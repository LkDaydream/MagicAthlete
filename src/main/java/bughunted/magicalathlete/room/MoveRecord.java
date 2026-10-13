package bughunted.magicalathlete.room;

/**
 * 一次「落子」记录，用于「撤回上一步」。
 *
 * @param pieceId  棋子 id
 * @param fromCell 落子前的格号
 * @param toCell   落子后的格号
 * @param byPlayer 操作者玩家 id
 */
public record MoveRecord(String pieceId, int fromCell, int toCell, String byPlayer) {
}
