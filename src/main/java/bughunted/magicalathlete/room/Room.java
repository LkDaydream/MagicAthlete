package bughunted.magicalathlete.room;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    private volatile String boardSide = "mild";
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
