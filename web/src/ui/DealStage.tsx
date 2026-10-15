/** 「从牌堆抽牌」动画：一叠牌背 + 一张抽出并翻起的卡。 */
export function DealStage() {
  return (
    <div className="deal-stage">
      <div className="deck-stack">
        <span className="deck-back" />
        <span className="deck-back" />
        <span className="deck-back" />
      </div>
      <div className="deal-card">抽卡中…</div>
    </div>
  )
}
