package bughunted.magicalathlete.room;

/**
 * 棋盘上的一枚棋子。{@code cell} 为所在格号；{@code x}/{@code y} 为拖动过程中的
 * 归一化坐标（相对棋盘 0..1），落子后清空。{@code lockedBy} 为拖动锁的持有者。
 */
public class Piece {

    private final String id;
    private final String ownerId;
    private volatile int cell;
    private volatile Double x;
    private volatile Double y;
    private volatile String lockedBy;
    /** 自定义显示名（NPC 名称；为空则用所属玩家名）。 */
    private volatile String label;
    /** 自定义颜色（NPC 颜色；为空则用所属玩家颜色）。 */
    private volatile String color;
    /** 是否处于「绊倒 / 摔倒」状态（下次主移动跳过）。 */
    private volatile boolean tripped;

    public Piece(String id, String ownerId, int cell) {
        this.id = id;
        this.ownerId = ownerId;
        this.cell = cell;
    }

    public String getId() {
        return id;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public int getCell() {
        return cell;
    }

    public void setCell(int cell) {
        this.cell = cell;
    }

    public Double getX() {
        return x;
    }

    public Double getY() {
        return y;
    }

    public void setPosition(Double x, Double y) {
        this.x = x;
        this.y = y;
    }

    public String getLockedBy() {
        return lockedBy;
    }

    public void setLockedBy(String lockedBy) {
        this.lockedBy = lockedBy;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public boolean isTripped() {
        return tripped;
    }

    public void setTripped(boolean tripped) {
        this.tripped = tripped;
    }

    /** 落子：固定到某格并清除拖动中的临时坐标与锁。 */
    public void placeAt(int cell) {
        this.cell = cell;
        this.x = null;
        this.y = null;
        this.lockedBy = null;
    }
}
