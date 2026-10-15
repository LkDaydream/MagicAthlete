import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { TWIST_CARDS } from '../board/twistCards'
import { DealStage } from './DealStage'

function fmtTime(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 扭扭卡面板（独立）：抽卡 + 全局展示当前抽到的卡 + 抽取记录。 */
export function TwistPanel() {
  const twistCard = useGameStore((s) => s.twistCard)
  const twistRevealing = useGameStore((s) => s.twistRevealing)
  const twistHistory = useGameStore((s) => s.twistHistory)
  const drawTwist = useGameStore((s) => s.drawTwist)
  const setTwistMode = useGameStore((s) => s.setTwistMode)
  const twistMode = useGameStore((s) => s.state?.twistMode ?? 'discard')
  const players = useGameStore((s) => s.state?.players ?? [])
  const [logOpen, setLogOpen] = useState(false)

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?'
  const card = twistCard ? TWIST_CARDS[twistCard.index % TWIST_CARDS.length] : null
  const by = twistCard ? nameOf(twistCard.byPlayer) : ''

  return (
    <div className="panel twist-panel">
      <div className="twist-head">
        <h3>扭扭卡</h3>
        <div className="twist-head-actions">
          <select
            className="twist-mode"
            value={twistMode}
            title="抽取模式：弃牌堆（不重复） / 放回重洗（可重复）"
            onChange={(event) => setTwistMode(event.target.value as 'discard' | 'return')}
          >
            <option value="discard">弃牌堆</option>
            <option value="return">放回重洗</option>
          </select>
          <button className="twist-log-btn" onClick={() => setLogOpen(true)}>
            记录
          </button>
          <button className="twist-draw" onClick={drawTwist}>
            抽扭扭卡
          </button>
        </div>
      </div>

      {twistRevealing ? (
        <DealStage />
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

      {logOpen && (
        <div className="modal-backdrop" onClick={() => setLogOpen(false)}>
          <div className="modal dice-log" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>扭扭卡记录（最近 {twistHistory.length} 次）</h3>
              <button className="link" onClick={() => setLogOpen(false)}>
                关闭
              </button>
            </div>
            {twistHistory.length === 0 && <div className="dice-log-empty">暂无记录</div>}
            <div className="dice-log-list">
              {twistHistory.map((entry, i) => (
                <div key={i} className="dice-log-row">
                  <span className="dl-time">{fmtTime(entry.at)}</span>
                  <span className="dl-name">{nameOf(entry.byPlayer)}</span>
                  <span className="dl-val">
                    {TWIST_CARDS[entry.index % TWIST_CARDS.length]?.name ?? `#${entry.index}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
