import { useGameStore } from '../store/gameStore'
import { TWIST_CARDS } from '../board/twistCards'

/** 抽到扭扭卡时的弹窗（所有玩家看到同一张卡）。 */
export function TwistReveal() {
  const twistCard = useGameStore((s) => s.twistCard)
  const twistModalOpen = useGameStore((s) => s.twistModalOpen)
  const twistRevealing = useGameStore((s) => s.twistRevealing)
  const closeTwist = useGameStore((s) => s.closeTwist)
  const players = useGameStore((s) => s.state?.players ?? [])

  if (!twistModalOpen || !twistCard) return null
  const card = TWIST_CARDS[twistCard.index % TWIST_CARDS.length]
  const by = players.find((p) => p.id === twistCard.byPlayer)?.name ?? ''

  return (
    <div className="modal-backdrop" onClick={closeTwist}>
      <div className="modal twist-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>扭扭卡{by ? ` · ${by} 抽取` : ''}</h3>
          <button className="link" onClick={closeTwist}>
            关闭
          </button>
        </div>
        <div className={`twist-card${twistRevealing ? ' twist-back' : ''}`}>
          {twistRevealing ? (
            <div className="twist-rolling">抽卡中…</div>
          ) : (
            <>
              <div className="twist-card-name">{card.name}</div>
              <div className="twist-card-en">{card.nameEn}</div>
              <div className="twist-card-effect">{card.effect}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
