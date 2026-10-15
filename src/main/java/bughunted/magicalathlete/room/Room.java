package bughunted.magicalathlete.room;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 一个对局房间。持有玩家与棋子的最新状态，仅用于同步与断线恢复，不做任何规则校验。
 * 玩家按加入顺序保存（LinkedHashMap），顺序用于确定同格棋子的堆叠层级。
 */
public class Room {

    private final String code;
    private final Map<String, Player> players = new LinkedHashMap<>();
    private final Map<String, Piece> pieces = new ConcurrentHashMap<>();
    /** 自定义格子颜色：cell -> hex 颜色（纯视觉）。 */
    private final Map<Integer, String> cellColors = new ConcurrentHashMap<>();
    /** 落子历史，用于「撤回上一步」。 */
    private final Deque<MoveRecord> moveHistory = new ArrayDeque<>();
    /** 已洗牌的角色牌堆，用于给玩家发角色。 */
    private final Deque<String> deck = new ArrayDeque<>();
    /** 扭扭卡牌堆（存卡索引）与弃牌堆。 */
    private final Deque<Integer> twistDeck = new ArrayDeque<>();
    private final List<Integer> twistDiscard = new ArrayList<>();
    /** 扭扭卡抽取模式：discard=抽进弃牌堆（抽空重洗）；return=抽出的牌放回牌堆并混洗。 */
    private volatile String twistMode = "discard";

    private volatile String boardSide = "mild";
    private volatile String characterSet = "mixed";
    private volatile int piecesPerPlayer = 1;
    private volatile int round = 1;

    public Room(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public String getBoardSide() {
        return boardSide;
    }

    public void setBoardSide(String boardSide) {
        this.boardSide = boardSide;
    }

    public String getCharacterSet() {
        return characterSet;
    }

    public void setCharacterSet(String characterSet) {
        this.characterSet = characterSet;
    }

    public int getPiecesPerPlayer() {
        return piecesPerPlayer;
    }

    public void setPiecesPerPlayer(int piecesPerPlayer) {
        this.piecesPerPlayer = piecesPerPlayer;
    }

    // ---------------------------------------------------------------- players

    public synchronized Player addPlayer(String id, String token, String name, String color) {
        Player player = new Player(id, token, name, color);
        players.put(id, player);
        return player;
    }

    public synchronized Player findPlayerByToken(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        for (Player player : players.values()) {
            if (token.equals(player.getToken())) {
                return player;
            }
        }
        return null;
    }

    public synchronized Collection<Player> getPlayers() {
        return new ArrayList<>(players.values());
    }

    public synchronized Player getPlayer(String id) {
        return players.get(id);
    }

    /** 移除玩家及其所有棋子（退出房间）。 */
    public synchronized void removePlayer(String playerId) {
        if (players.remove(playerId) != null) {
            pieces.values().removeIf(piece -> piece.getOwnerId().equals(playerId));
        }
    }

    public synchronized boolean isEmpty() {
        return players.isEmpty();
    }

    // ----------------------------------------------------------------- pieces

    public Map<String, Piece> getPieces() {
        return pieces;
    }

    public Piece addPiece(String id, String ownerId, int cell) {
        Piece piece = new Piece(id, ownerId, cell);
        pieces.put(id, piece);
        return piece;
    }

    public Piece getPiece(String id) {
        return pieces.get(id);
    }

    public void removePiece(String id) {
        pieces.remove(id);
    }

    public Collection<Piece> getPieceList() {
        return new ArrayList<>(pieces.values());
    }

    /** 所有棋子回到起点（格 0）。 */
    public void resetAllPieces() {
        pieces.values().forEach(piece -> piece.placeAt(0));
    }

    // ------------------------------------------------------------ cell colors

    public Map<Integer, String> getCellColors() {
        return cellColors;
    }

    public void setCellColor(int cell, String color) {
        if (color == null || color.isEmpty()) {
            cellColors.remove(cell);
        } else {
            cellColors.put(cell, color);
        }
    }

    // ----------------------------------------------------------- move history

    public synchronized void recordMove(MoveRecord record) {
        moveHistory.push(record);
    }

    public synchronized MoveRecord popMove() {
        return moveHistory.poll();
    }

    public synchronized void clearHistory() {
        moveHistory.clear();
    }

    // ------------------------------------------------------------ characters

    public synchronized void setDeck(Collection<String> ids) {
        deck.clear();
        deck.addAll(ids);
    }

    /** 从牌堆顶抽取若干角色 id。 */
    public synchronized List<String> deal(int count) {
        List<String> hand = new ArrayList<>();
        for (int i = 0; i < count && !deck.isEmpty(); i++) {
            hand.add(deck.poll());
        }
        return hand;
    }

    // --------------------------------------------------------------- twist

    /**
     * 抽一张扭扭卡（返回卡索引）。两种模式：
     * discard：抽过的卡进弃牌堆，牌堆抽空后把弃牌堆重洗为新牌堆（不会立即重复）；
     * return： 抽出的牌立即放回牌堆并混洗（可能重复）。
     */
    public synchronized int drawTwist(int count, Random random) {
        if (twistDeck.isEmpty() && twistDiscard.isEmpty()) {
            resetTwistDeck(count, random);
        }
        if ("return".equals(twistMode)) {
            if (twistDeck.isEmpty()) {
                resetTwistDeck(count, random);
            }
            // 抽出的牌放回牌堆并混洗 ⇒ 等价于在整副牌里等概率抽一张
            List<Integer> all = new ArrayList<>(twistDeck);
            return all.get(random.nextInt(all.size()));
        }
        if (twistDeck.isEmpty()) {
            List<Integer> again = new ArrayList<>(twistDiscard);
            twistDiscard.clear();
            Collections.shuffle(again, random);
            twistDeck.addAll(again);
        }
        if (twistDeck.isEmpty()) {
            return -1;
        }
        int index = twistDeck.poll();
        twistDiscard.add(index);
        return index;
    }

    public String getTwistMode() {
        return twistMode;
    }

    public void setTwistMode(String twistMode) {
        this.twistMode = twistMode;
    }

    /** 重置扭扭卡牌堆为 0..count-1 的洗牌序列，并清空弃牌堆。 */
    public synchronized void resetTwistDeck(int count, Random random) {
        twistDeck.clear();
        twistDiscard.clear();
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ids.add(i);
        }
        Collections.shuffle(ids, random);
        twistDeck.addAll(ids);
    }

    public int getRound() {
        return round;
    }

    public void nextRound() {
        if (round < 4) {
            round++;
        }
    }

    public void resetRound() {
        round = 1;
    }
}
