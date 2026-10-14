import { useGameStore } from '../store/gameStore'
import { TWIST_CARDS } from '../board/twistCards'

/** 扭扭卡面板（独立）：抽卡 + 全局展示当前抽到的卡。 */
export function TwistPanel() {
  const twistCard = useGameStore((s) => s.twistCard)
  const twistRevealing = useGameStore((s) => s.twistRevealing)
  const drawTwist = useGameStore((s) => s.drawTwist)
  const players = useGameStore((s) => s.state?.players ?? [])

  const card = twistCard ? TWIST_CARDS[twistCard.index % TWIST_CARDS.length] : null
  const by = twistCard ? players.find((p) => p.id === twistCard.byPlayer)?.name ?? '' : ''

  return (
    <div className="panel twist-panel">
      <div className="twist-head">
        <h3>扭扭卡</h3>
        <button className="twist-draw" onClick={drawTwist}>
          抽扭扭卡
        </button>
      </div>
      {twistRevealing ? (
        <div className="twist-card twist-back">抽卡中…</div>
      ) : card ? (
        <div className="twist-card">
          <div className="twist-card-name">{card.name}</div>
          <div className="twist-card-en">
            {card.nameEn}
            {by ? ` · ${by} 抽取` : ''}
          </div>
          <div className="twist-card-effect">{card.effect}</div>
        </div>
      ) : (
        <div className="twist-empty">尚未抽取。抽到的卡会全局展示给所有玩家。</div>
      )}
    </div>
  )
}
