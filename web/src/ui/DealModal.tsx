import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

const PER_OPTIONS = [1, 2, 3, 4, 5, 6, 8]

/**
 * 「发牌」弹窗：开局发牌设置 + 卡池抽选。
 * - 随机发牌：每人随机发 N 张；
 * - 卡池抽选：抽出 人数×N 张放入公共牌池，展示（含技能）后由玩家点选领取。
 */
export function DealModal() {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState('')

  const state = useGameStore((s) => s.state)
  const myId = useGameStore((s) => s.playerId)
  const redeal = useGameStore((s) => s.redeal)
  const setDealSetting = useGameStore((s) => s.setDealSetting)
  const takeCharacter = useGameStore((s) => s.takeCharacter)

  const perPlayer = state?.charactersPerPlayer ?? 4
  const dealMode = state?.dealMode ?? 'random'
  const pool = state?.draftPool ?? []
  const players = state?.players ?? []
  const info = state?.characterInfo ?? {}
  const others = players.filter((p) => p.id !== myId)
  const targetId = target || myId || ''

  const nameOf = (id: string) => info[id]?.name ?? id
  const skillOf = (id: string) => info[id]?.skill ?? '—'

  return (
    <>
      <button className="focus-btn" onClick={() => setOpen(true)}>
        发牌
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal card-modal deal-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>开局发牌</h3>
              <button className="link" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>

            <div className="deal-row">
              <span className="deal-label">每人张数</span>
              {PER_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={`deal-chip${perPlayer === n ? ' active' : ''}`}
                  onClick={() => setDealSetting(dealMode as 'random' | 'draft', n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="deal-row">
              <span className="deal-label">发牌方式</span>
              <button
                className={`deal-chip${dealMode === 'random' ? ' active' : ''}`}
                onClick={() => setDealSetting('random', perPlayer)}
              >
                随机发牌
              </button>
              <button
                className={`deal-chip${dealMode === 'draft' ? ' active' : ''}`}
                onClick={() => setDealSetting('draft', perPlayer)}
              >
                卡池抽选
              </button>
            </div>

            <div className="deal-row">
              <button className="card-draw-main" onClick={redeal}>
                重新发牌
              </button>
              <span className="card-hint">
                {dealMode === 'draft'
                  ? `卡池 = 人数 ${players.length} × ${perPlayer} = ${players.length * perPlayer} 张`
                  : `每人随机 ${perPlayer} 张`}
              </span>
            </div>

            {dealMode === 'draft' && (
              <div className="card-section">
                <div className="card-section-title">公共牌池（剩 {pool.length} 张）· 点卡领取</div>
                <div className="deal-row">
                  <span className="deal-label">拿给</span>
                  <select
                    className="deal-select"
                    value={targetId}
                    onChange={(event) => setTarget(event.target.value)}
                  >
                    {myId && <option value={myId}>我</option>}
                    {others.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                {pool.length === 0 ? (
                  <div className="lookup-empty">牌池已空（都已领取）</div>
                ) : (
                  <div className="pool-grid">
                    {pool.map((cid) => (
                      <button
                        key={cid}
                        className="pool-card"
                        onClick={() => takeCharacter(cid, targetId)}
                      >
                        <span className="pool-title">
                          {nameOf(cid)}
                          <span className="pool-en">{info[cid]?.nameEn ?? ''}</span>
                        </span>
                        <span className="pool-skill">{skillOf(cid)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
