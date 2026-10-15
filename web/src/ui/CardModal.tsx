import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { DealStage } from './DealStage'

const COUNTS = [1, 2, 3]

interface CharEntry {
  id: string
  name: string
  nameEn?: string
  skill: string
}

/**
 * 「角色牌」弹窗：随机抽取（可多张，如蛋抽 3 选 1）/ 自选（测试、自定义）/
 * 替换 / 附加能力 / 交换操控权。
 */
export function CardModal() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [revealing, setRevealing] = useState(false)
  const [picked, setPicked] = useState('')
  const [target, setTarget] = useState('')
  const [pickOpen, setPickOpen] = useState(false)
  const [pickQuery, setPickQuery] = useState('')
  const [catalog, setCatalog] = useState<CharEntry[]>([])
  const manualRef = useRef(false)

  const state = useGameStore((s) => s.state)
  const myId = useGameStore((s) => s.playerId)
  const drawChara = useGameStore((s) => s.drawChara)
  const pickChara = useGameStore((s) => s.pickChara)
  const replaceChara = useGameStore((s) => s.replaceChara)
  const attachChara = useGameStore((s) => s.attachChara)
  const swapChara = useGameStore((s) => s.swapChara)
  const cancelCharaDraw = useGameStore((s) => s.cancelCharaDraw)

  const players = state?.players ?? []
  const info = state?.characterInfo ?? {}
  const me = players.find((p) => p.id === myId)
  const others = players.filter((p) => p.id !== myId)
  const pendingDraws = me?.pendingDraws ?? []
  const extras = me?.extras ?? []
  const pendingKey = pendingDraws.join(',')

  // 自选列表按需加载
  useEffect(() => {
    if (!pickOpen || catalog.length > 0) {
      return
    }
    fetch(`${import.meta.env.BASE_URL}api/characters`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCatalog(Array.isArray(data) ? (data as CharEntry[]) : []))
      .catch(() => setCatalog([]))
  }, [pickOpen, catalog.length])

  const filtered = useMemo(() => {
    const q = pickQuery.trim().toLowerCase()
    if (!q) {
      return catalog
    }
    return catalog.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameEn ?? '').toLowerCase().includes(q) ||
        c.skill.toLowerCase().includes(q),
    )
  }, [catalog, pickQuery])

  // 抽到新卡 → 播放抽牌动画（自选时跳过）
  useEffect(() => {
    if (!pendingKey) {
      return
    }
    setPicked(pendingKey.split(',')[0])
    if (manualRef.current) {
      manualRef.current = false
      setRevealing(false)
      return
    }
    setRevealing(true)
    const timer = window.setTimeout(() => setRevealing(false), 1000)
    return () => window.clearTimeout(timer)
  }, [pendingKey])

  const nameOf = (id: string) => info[id]?.name ?? id
  const skillOf = (id: string) => info[id]?.skill ?? '—'

  const manualPick = (id: string) => {
    manualRef.current = true
    pickChara(id)
  }

  return (
    <>
      <button className="focus-btn" onClick={() => setOpen(true)}>
        角色牌
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal card-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>角色牌</h3>
              <button className="link" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>

            <div className="card-draw-row">
              <div className="card-count">
                <span className="card-count-label">张数</span>
                {COUNTS.map((n) => (
                  <button key={n} className={count === n ? 'active' : ''} onClick={() => setCount(n)}>
                    {n}
                  </button>
                ))}
              </div>
              <button
                className="card-draw-main"
                onClick={() => drawChara(count)}
                disabled={pendingDraws.length > 0}
              >
                抽取新选手
              </button>
              <button className="card-pick-toggle" onClick={() => setPickOpen((v) => !v)}>
                {pickOpen ? '收起自选' : '自选角色卡'}
              </button>
            </div>
            <div className="card-hint">旧货集市 · 缝合怪 · 蛋（抽 3 选 1）· 自选用于自定义 / 测试</div>

            {pickOpen && (
              <div className="card-picker">
                <input
                  className="lookup-input"
                  value={pickQuery}
                  placeholder="输入 中文名 / 英文名 / 技能关键词…"
                  onChange={(event) => setPickQuery(event.target.value)}
                />
                <div className="card-picker-list">
                  {filtered.map((c) => (
                    <button key={c.id} className="card-picker-row" onClick={() => manualPick(c.id)}>
                      <span className="card-picker-name">
                        {c.name}
                        <span className="twist-lookup-en">{c.nameEn ?? ''}</span>
                      </span>
                      <span className="card-picker-skill">{c.skill}</span>
                    </button>
                  ))}
                  {catalog.length > 0 && filtered.length === 0 && (
                    <div className="lookup-empty">无匹配角色</div>
                  )}
                  {catalog.length === 0 && <div className="lookup-empty">加载中…</div>}
                </div>
              </div>
            )}

            {pendingDraws.length > 0 &&
              (revealing ? (
                <DealStage />
              ) : (
                <>
                  <div className="card-pick">
                    {pendingDraws.map((cid) => (
                      <button
                        key={cid}
                        className={`pick-card${picked === cid ? ' sel' : ''}`}
                        onClick={() => setPicked(cid)}
                      >
                        <div className="pick-name">{nameOf(cid)}</div>
                        <div className="pick-skill">{skillOf(cid)}</div>
                      </button>
                    ))}
                  </div>
                  <div className="draw-card-actions">
                    <button disabled={!picked} onClick={() => replaceChara(picked)}>
                      替换出战
                    </button>
                    <button disabled={!picked} onClick={() => attachChara(picked)}>
                      附加能力
                    </button>
                    <button className="link" onClick={cancelCharaDraw}>
                      放弃
                    </button>
                  </div>
                  {pendingDraws.length > 1 && (
                    <div className="card-hint">共 {pendingDraws.length} 张 · 点选一张后选择用途</div>
                  )}
                </>
              ))}

            {extras.length > 0 && (
              <div className="card-section">
                <div className="card-section-title">附加能力（缝合怪）</div>
                {extras.map((cid) => (
                  <div key={cid} className="card-extra">
                    <b>{nameOf(cid)}</b> · {skillOf(cid)}
                  </div>
                ))}
              </div>
            )}

            <div className="card-section">
              <div className="card-section-title">交换操控权（狸猫换太子）</div>
              <div className="card-swap">
                <select value={target} onChange={(event) => setTarget(event.target.value)}>
                  <option value="">选择玩家…</option>
                  {others.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!target}
                  onClick={() => {
                    if (target) {
                      swapChara(target)
                      setTarget('')
                    }
                  }}
                >
                  交换角色牌
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
