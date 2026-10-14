package bughunted.magicalathlete.ws;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import bughunted.magicalathlete.room.Character;
import bughunted.magicalathlete.room.CharacterCatalog;
import bughunted.magicalathlete.room.MoveRecord;
import bughunted.magicalathlete.room.Piece;
import bughunted.magicalathlete.room.Player;
import bughunted.magicalathlete.room.Room;
import bughunted.magicalathlete.room.RoomRegistry;

/**
 * 中继式 WebSocket 处理器。服务器只做「校验格式 + 记录最后状态 + 转发」，
 * 不判断任何移动是否合法。
 */
@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final String[] PALETTE = {
            "#e74c3c", "#3498db", "#2ecc71", "#f1c40f",
            "#9b59b6", "#e67e22", "#1abc9c", "#e84393"
    };

    /** 落子格号的合法上限（后端不感知具体赛道配置，仅做宽松校验）。 */
    private static final int MAX_CELL = 200;

    /** 每名玩家分到的角色数量。 */
    private static final int CHARACTERS_PER_PLAYER = 4;

    private final ObjectMapper mapper = new ObjectMapper();
    private final RoomRegistry rooms;
    private final CharacterCatalog catalog;
    private final SecureRandom random = new SecureRandom();
    private final AtomicLong seq = new AtomicLong();

    /** 原始 sessionId -> 可并发发送的会话。 */
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    /** 原始 sessionId -> 成员信息。 */
    private final Map<String, Membership> memberships = new ConcurrentHashMap<>();
    /** 房间码 -> 会话集合。 */
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    private record Membership(String roomCode, String playerId) {
    }

    public GameWebSocketHandler(RoomRegistry rooms, CharacterCatalog catalog) {
        this.rooms = rooms;
        this.catalog = catalog;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(),
                new ConcurrentWebSocketSessionDecorator(session, 5000, 512 * 1024));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode root = mapper.readTree(message.getPayload());
        String type = root.path("type").asText("");
        JsonNode payload = root.path("payload");
        switch (type) {
            case "room:join" -> onJoin(session, payload);
            case "board:side" -> onBoardSide(session, payload);
            case "twist:draw" -> onTwistDraw(session);
            case "piece:add" -> onPieceAdd(session, payload);
            case "piece:remove" -> onPieceRemove(session, payload);
            case "cell:color" -> onCellColor(session, payload);
            case "drag:start" -> onDragStart(session, payload);
            case "drag:move" -> onDragMove(session, payload);
            case "drag:end" -> onDragEnd(session, payload);
            case "dice:roll" -> onDiceRoll(session);
            case "move:undo" -> onUndo(session);
            case "room:reset" -> onReset(session);
            case "chara:use" -> onUseCharacter(session, payload);
            case "chara:unuse" -> onUnuseCharacter(session, payload);
            case "room:nextRound" -> onNextRound(session);
            case "room:redeal" -> onRedeal(session);
            case "chara:set" -> onCharaSet(session, payload);
            case "room:leave" -> onLeave(session);
            case "room:end" -> onEnd(session);
            case "score:adjust" -> onScoreAdjust(session, payload);
            case "score:reset" -> onScoreReset(session);
            default -> {
                // 未知消息忽略
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session.getId());
        Membership membership = memberships.remove(session.getId());
        if (membership == null) {
            return;
        }
        Room room = rooms.get(membership.roomCode());
        if (room == null) {
            return;
        }
        Set<WebSocketSession> set = roomSessions.get(room.getCode());
        if (set != null) {
            set.removeIf(s -> s.getId().equals(session.getId()));
        }
        Player player = room.getPlayer(membership.playerId());
        if (player != null) {
            player.setConnected(false);
        }
        // 释放该玩家持有的拖拽锁
        for (Piece piece : room.getPieceList()) {
            if (membership.playerId().equals(piece.getLockedBy())) {
                piece.setLockedBy(null);
            }
        }
        broadcast(room, "player:left", Map.of("playerId", membership.playerId()));
        broadcastState(room);
    }

    // ------------------------------------------------------------------ join

    private void onJoin(WebSocketSession session, JsonNode payload) {
        WebSocketSession ws = sessions.get(session.getId());
        String token = payload.path("token").asText("");
        String roomCode = payload.path("roomCode").asText("").trim().toUpperCase();
        String playerName = payload.path("playerName").asText("Player").trim();
        if (playerName.isEmpty()) {
            playerName = "Player";
        }
        int piecesPerPlayer = Math.max(1, Math.min(4, payload.path("piecesPerPlayer").asInt(1)));
        String characterSet = normalizeSet(payload.path("characterSet").asText("mixed"));

        Room room;
        if (roomCode.isEmpty()) {
            room = rooms.createRoom();
            room.setPiecesPerPlayer(piecesPerPlayer);
            room.setCharacterSet(characterSet);
            room.setDeck(catalog.shuffledIds(random, characterSet));
        } else {
            room = rooms.get(roomCode);
            if (room == null) {
                sendError(ws, "ROOM_NOT_FOUND", "房间不存在：" + roomCode);
                return;
            }
        }

        Player player = room.findPlayerByToken(token);
        if (player == null) {
            String playerId = "u" + randomHex(6);
            String color = nextColor(room);
            player = room.addPlayer(playerId, token, playerName, color);
            for (int i = 1; i <= room.getPiecesPerPlayer(); i++) {
                room.addPiece("piece-" + playerId + "-" + i, playerId, 0);
            }
            player.getCharacters().addAll(room.deal(CHARACTERS_PER_PLAYER));
        } else {
            player.setName(playerName);
            player.setConnected(true);
        }

        memberships.put(session.getId(), new Membership(room.getCode(), player.getId()));
        roomSessions.computeIfAbsent(room.getCode(), k -> ConcurrentHashMap.newKeySet()).add(ws);

        // 定向告知加入者自己的玩家 id（前端据此标注"我"）
        Map<String, Object> joined = new HashMap<>();
        joined.put("playerId", player.getId());
        joined.put("roomCode", room.getCode());
        send(ws, "room:joined", joined);

        broadcastState(room);
    }

    // ------------------------------------------------------------ board/cell

    private void onBoardSide(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        String side = payload.path("side").asText("mild");
        if (!side.equals("mild") && !side.equals("wild") && !side.equals("twisty") && !side.equals("whirly")) {
            side = "mild";
        }
        room.setBoardSide(side);
        broadcast(room, "board:side", Map.of("side", side));
    }

    /** NPC 棋子归属标识（不属于任何真人玩家，任何人都可拖动）。 */
    private static final String NPC_OWNER = "__npc__";

    /** 新增一枚棋子（对应某些角色/扭扭卡会在场上增加可操控角色或 NPC）。 */
    private void onPieceAdd(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        boolean npc = payload.path("npc").asBoolean(false);
        String ownerId = npc ? NPC_OWNER : membership.playerId();
        String id = "piece-" + ownerId + "-x" + System.nanoTime();
        Piece piece = room.addPiece(id, ownerId, 0);
        if (npc) {
            String name = payload.path("name").asText("");
            String color = payload.path("color").asText("");
            piece.setLabel(name.isEmpty() ? "NPC" : name);
            piece.setColor(color.isEmpty() ? nextNpcColor(room) : color);
        }
        broadcastState(room);
    }

    /** 移除一枚棋子。 */
    private void onPieceRemove(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        room.removePiece(payload.path("pieceId").asText(""));
        broadcastState(room);
    }

    /** 抽取一张扭扭卡：服务端随机决定索引，广播给所有人（保证大家看到同一张）。 */
    private void onTwistDraw(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        int index = random.nextInt(13);
        Map<String, Object> msg = new HashMap<>();
        msg.put("index", index);
        msg.put("byPlayer", membership.playerId());
        broadcast(room, "twist:drawn", msg);
    }

    private void onCellColor(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        int cell = payload.path("cell").asInt(-1);
        if (cell < 0 || cell > MAX_CELL) {
            return;
        }
        JsonNode colorNode = payload.path("color");
        String color = (colorNode.isMissingNode() || colorNode.isNull()) ? null : colorNode.asText();
        room.setCellColor(cell, color);
        Map<String, Object> msg = new HashMap<>();
        msg.put("cell", cell);
        msg.put("color", color);
        broadcast(room, "cell:color", msg);
    }

    // ------------------------------------------------------------------ drag

    private void onDragStart(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        Piece piece = room.getPiece(payload.path("pieceId").asText());
        if (piece == null) {
            return;
        }
        String lockedBy = piece.getLockedBy();
        if (lockedBy != null && !lockedBy.equals(membership.playerId())) {
            return; // 已被他人锁定
        }
        piece.setLockedBy(membership.playerId());
        Map<String, Object> msg = new HashMap<>();
        msg.put("pieceId", piece.getId());
        msg.put("lockedBy", membership.playerId());
        broadcast(room, "piece:locked", msg);
    }

    private void onDragMove(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        Piece piece = room.getPiece(payload.path("pieceId").asText());
        if (piece == null) {
            return;
        }
        if (piece.getLockedBy() != null && !piece.getLockedBy().equals(membership.playerId())) {
            return;
        }
        double x = payload.path("x").asDouble(0);
        double y = payload.path("y").asDouble(0);
        piece.setPosition(x, y);
        Map<String, Object> msg = new HashMap<>();
        msg.put("pieceId", piece.getId());
        msg.put("x", x);
        msg.put("y", y);
        msg.put("byPlayer", membership.playerId());
        broadcast(room, "piece:dragging", msg);
    }

    private void onDragEnd(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        Piece piece = room.getPiece(payload.path("pieceId").asText());
        if (piece == null) {
            return;
        }
        if (piece.getLockedBy() != null && !piece.getLockedBy().equals(membership.playerId())) {
            return;
        }
        int cell = payload.path("cell").asInt(0);
        cell = Math.max(0, Math.min(MAX_CELL, cell));
        int from = piece.getCell();
        piece.placeAt(cell);
        if (from != cell) {
            room.recordMove(new MoveRecord(piece.getId(), from, cell, membership.playerId()));
        }
        Map<String, Object> moved = new HashMap<>();
        moved.put("pieceId", piece.getId());
        moved.put("cell", cell);
        broadcast(room, "piece:moved", moved);
        broadcast(room, "piece:unlocked", Map.of("pieceId", piece.getId()));
    }

    // ------------------------------------------------------------------ dice

    private void onDiceRoll(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        int value = 1 + random.nextInt(6);
        Map<String, Object> msg = new HashMap<>();
        msg.put("playerId", membership.playerId());
        msg.put("value", value);
        broadcast(room, "dice:rolled", msg);
    }

    // --------------------------------------------------------- undo / reset

    private void onUndo(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        MoveRecord record = room.popMove();
        if (record == null) {
            return;
        }
        Piece piece = room.getPiece(record.pieceId());
        if (piece != null) {
            piece.placeAt(record.fromCell());
        }
        broadcastState(room);
    }

    private void onReset(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        room.resetAllPieces();
        room.clearHistory();
        broadcastState(room);
    }

    // ----------------------------------------------------------- characters

    private void onUseCharacter(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        Player player = room.getPlayer(membership.playerId());
        if (player == null) {
            return;
        }
        String characterId = payload.path("characterId").asText("");
        if (!player.getCharacters().contains(characterId)) {
            return;
        }
        player.useCharacter(characterId);
        broadcastState(room);
    }

    /** 取消使用角色（回退误触）。 */
    private void onUnuseCharacter(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        Player player = room.getPlayer(membership.playerId());
        if (player == null) {
            return;
        }
        String characterId = payload.path("characterId").asText("");
        if (!player.getCharacters().contains(characterId)) {
            return;
        }
        player.unuseCharacter(characterId);
        broadcastState(room);
    }

    private void onNextRound(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        room.nextRound();
        broadcastState(room);
    }

    private void onRedeal(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        room.setDeck(catalog.shuffledIds(random, room.getCharacterSet()));
        room.resetRound();
        for (Player player : room.getPlayers()) {
            player.resetCharacters();
            player.getCharacters().addAll(room.deal(CHARACTERS_PER_PLAYER));
        }
        broadcastState(room);
    }

    /** 切换角色池（gen1 / gen2 / mixed）并重新发牌。 */
    private void onCharaSet(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        String set = normalizeSet(payload.path("set").asText("mixed"));
        room.setCharacterSet(set);
        room.setDeck(catalog.shuffledIds(random, set));
        room.resetRound();
        for (Player player : room.getPlayers()) {
            player.resetCharacters();
            player.getCharacters().addAll(room.deal(CHARACTERS_PER_PLAYER));
        }
        broadcastState(room);
    }

    /** 规整角色池取值。 */
    private static String normalizeSet(String set) {
        if ("gen1".equals(set) || "gen2".equals(set) || "mixed".equals(set)) {
            return set;
        }
        return "mixed";
    }

    // ------------------------------------------------------- leave / end

    /** 玩家主动退出：从房间剔除该玩家及其棋子；房间空则销毁。 */
    private void onLeave(WebSocketSession session) {
        Membership membership = memberships.remove(session.getId());
        if (membership == null) {
            return;
        }
        Room room = rooms.get(membership.roomCode());
        if (room == null) {
            return;
        }
        Set<WebSocketSession> set = roomSessions.get(room.getCode());
        if (set != null) {
            set.removeIf(s -> s.getId().equals(session.getId()));
        }
        room.removePlayer(membership.playerId());
        if (room.isEmpty()) {
            roomSessions.remove(room.getCode());
            rooms.remove(room);
        } else {
            broadcastState(room);
        }
    }

    /** 结束房间：销毁房间，并通知房间内所有人。 */
    private void onEnd(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        if (membership == null) {
            return;
        }
        Room room = rooms.get(membership.roomCode());
        if (room == null) {
            return;
        }
        Set<WebSocketSession> set = roomSessions.remove(room.getCode());
        rooms.remove(room);
        if (set != null) {
            for (WebSocketSession s : set) {
                memberships.remove(s.getId());
                send(s, "room:closed", Map.of());
            }
        }
    }

    // --------------------------------------------------------------- score

    private void onScoreAdjust(WebSocketSession session, JsonNode payload) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        Player player = room.getPlayer(payload.path("playerId").asText(""));
        if (player == null) {
            return;
        }
        player.addScore(payload.path("delta").asInt(0));
        broadcastState(room);
    }

    private void onScoreReset(WebSocketSession session) {
        Membership membership = memberships.get(session.getId());
        Room room = room(membership);
        if (room == null) {
            return;
        }
        for (Player player : room.getPlayers()) {
            player.setScore(0);
        }
        broadcastState(room);
    }

    // --------------------------------------------------------------- helpers

    private Room room(Membership membership) {
        return membership == null ? null : rooms.get(membership.roomCode());
    }

    private void broadcastState(Room room) {
        broadcast(room, "room:state", stateView(room));
    }

    private void broadcast(Room room, String type, Object payload) {
        Set<WebSocketSession> set = roomSessions.get(room.getCode());
        if (set == null || set.isEmpty()) {
            return;
        }
        ObjectNode envelope = mapper.createObjectNode();
        envelope.put("type", type);
        envelope.put("seq", seq.incrementAndGet());
        envelope.set("payload", mapper.valueToTree(payload));
        String json = envelope.toString();
        for (WebSocketSession session : set) {
            sendRaw(session, json);
        }
    }

    private void sendError(WebSocketSession session, String code, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("code", code);
        payload.put("message", message);
        send(session, "error", payload);
    }

    /** 向单个会话发送一条消息。 */
    private void send(WebSocketSession session, String type, Object payload) {
        if (session == null) {
            return;
        }
        ObjectNode envelope = mapper.createObjectNode();
        envelope.put("type", type);
        envelope.put("seq", seq.incrementAndGet());
        envelope.set("payload", mapper.valueToTree(payload));
        sendRaw(session, envelope.toString());
    }

    private void sendRaw(WebSocketSession session, String json) {
        try {
            if (session != null && session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            // 发送失败（如连接已断）忽略
        }
    }

    private Map<String, Object> stateView(Room room) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("roomCode", room.getCode());
        view.put("boardSide", room.getBoardSide());
        view.put("piecesPerPlayer", room.getPiecesPerPlayer());
        view.put("round", room.getRound());
        view.put("characterSet", room.getCharacterSet());

        List<Map<String, Object>> players = new ArrayList<>();
        for (Player p : room.getPlayers()) {
            Map<String, Object> pv = new LinkedHashMap<>();
            pv.put("id", p.getId());
            pv.put("name", p.getName());
            pv.put("color", p.getColor());
            pv.put("connected", p.isConnected());
            pv.put("characters", new ArrayList<>(p.getCharacters()));
            pv.put("usedCharacters", new ArrayList<>(p.getUsedCharacters()));
            pv.put("activeCharacterId", p.getActiveCharacterId());
            pv.put("score", p.getScore());
            players.add(pv);
        }
        view.put("players", players);

        List<Map<String, Object>> pieces = new ArrayList<>();
        for (Piece piece : room.getPieceList()) {
            Map<String, Object> pv = new LinkedHashMap<>();
            pv.put("id", piece.getId());
            pv.put("ownerId", piece.getOwnerId());
            pv.put("cell", piece.getCell());
            pv.put("x", piece.getX());
            pv.put("y", piece.getY());
            pv.put("lockedBy", piece.getLockedBy());
            pv.put("label", piece.getLabel());
            pv.put("color", piece.getColor());
            pieces.add(pv);
        }
        view.put("pieces", pieces);

        Map<String, Object> colors = new LinkedHashMap<>();
        room.getCellColors().forEach((cell, color) -> colors.put(String.valueOf(cell), color));
        view.put("cellColors", colors);

        Map<String, Object> characterInfo = new LinkedHashMap<>();
        Set<String> inPlay = new HashSet<>();
        for (Player p : room.getPlayers()) {
            inPlay.addAll(p.getCharacters());
        }
        for (String id : inPlay) {
            Character character = catalog.get(id);
            if (character != null) {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("name", character.name());
                cm.put("nameEn", character.nameEn());
                cm.put("skill", character.skill());
                characterInfo.put(id, cm);
            }
        }
        view.put("characterInfo", characterInfo);
        return view;
    }

    private static final String[] NPC_COLORS = {
        "#5c6b7a", "#8e6bbf", "#3aa6a0", "#c46b3a", "#7a8b3a", "#b0476b", "#3a5cc4", "#c4a13a"
    };

    private String nextNpcColor(Room room) {
        Set<String> used = new HashSet<>();
        for (Piece piece : room.getPieceList()) {
            if (piece.getColor() != null) {
                used.add(piece.getColor());
            }
        }
        for (String candidate : NPC_COLORS) {
            if (!used.contains(candidate)) {
                return candidate;
            }
        }
        return NPC_COLORS[room.getPieceList().size() % NPC_COLORS.length];
    }

    private String nextColor(Room room) {
        Set<String> used = new HashSet<>();
        for (Player p : room.getPlayers()) {
            used.add(p.getColor());
        }
        for (String candidate : PALETTE) {
            if (!used.contains(candidate)) {
                return candidate;
            }
        }
        return PALETTE[room.getPlayers().size() % PALETTE.length];
    }

    private String randomHex(int length) {
        String hex = "0123456789abcdef";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(hex.charAt(random.nextInt(hex.length())));
        }
        return sb.toString();
    }
}
