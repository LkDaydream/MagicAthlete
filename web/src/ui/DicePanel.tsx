import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { playDice } from './sound'

/** 3x3 网格中的点位索引（0..8，行优先）。 */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

const COUNTS = [1, 2, 3, 4, 5, 6]

function Die({ value, rolling }: { value: number | null; rolling: boolean }) {
  const pips = value ? PIPS[value] ?? [] : []
  const classNames = ['die']
  if (rolling) classNames.push('rolling')
  if (!value) classNames.push('idle')
  return (
    <div className={classNames.join(' ')}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`pip${pips.includes(i) ? ' on' : ''}`} />
      ))}
    </div>
  )
}

function fmtTime(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function DicePanel() {
  const lastDice = useGameStore((s) => s.lastDice)
  const history = useGameStore((s) => s.diceHistory)
  const rollDice = useGameStore((s) => s.rollDice)
  const setDice = useGameStore((s) => s.setDice)
  const soundOn = useGameStore((s) => s.soundOn)
  const players = useGameStore((s) => s.state?.players ?? [])

  const [count, setCount] = useState(1)
  const [faces, setFaces] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [sel, setSel] = useState(0)
  const [logOpen, setLogOpen] = useState(false)
  const playedSeq = useRef<number | null>(null)

  // 每次新结果：滚动动画后再定格
  useEffect(() => {
    if (!lastDice || lastDice.seq === playedSeq.current) {
      return
    }
    playedSeq.current = lastDice.seq
    if (soundOn) {
      playDice()
    }
    const n = Math.max(1, lastDice.values.length)
    setRolling(true)
    setFaces(Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)))
    let ticks = 0
    const spin = window.setInterval(() => {
      setFaces(Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)))
      ticks += 1
      if (ticks >= 10) {
        window.clearInterval(spin)
        setFaces(lastDice.values)
        setRolling(false)
      }
    }, 70)
    return () => window.clearInterval(spin)
  }, [lastDice, soundOn])

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?'
  const lv = lastDice?.values ?? []
  // 当前颗数是否与最近一次结果一致
  const hasResult = !rolling && lv.length === count
  const hidden = hasResult && Boolean(lastDice?.hidden)
  const shown = rolling
    ? faces
    : hasResult
      ? lv
      : Array.from({ length: count }, () => null)
  const selIdx = Math.min(sel, count - 1)
  // 当前显示的点数（空白骰按 1 计），供「改点」直接使用（无需先掷）
  const curValues = (rolling ? faces : shown).map((v) => v ?? 1)

  const setOne = (index: number, value: number) => {
    const next = [...curValues]
    next[index] = value
    setDice(next, hidden)
  }

  return (
    <div className="panel dice-stack">
      <div className="dice-head">
        <h3>掷骰</h3>
        <button className="dice-log-btn" onClick={() => setLogOpen(true)}>
          记录
        </button>
      </div>

      <div className="dice-count">
        <span className="dice-count-label">颗数</span>
        {COUNTS.map((n) => (
          <button key={n} className={count === n ? 'active' : ''} onClick={() => setCount(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="dice-row">
        {shown.map((v, i) => (
          <button
            key={i}
            className={`die-slot${selIdx === i ? ' sel' : ''}`}
            onClick={() => setSel(i)}
            title="点击选中后可手动改点"
          >
            <Die value={hidden ? null : v} rolling={rolling} />
            {hidden && <span className="die-q">?</span>}
          </button>
        ))}
      </div>

      {!rolling && (
        <div className="dice-set">
          <span className="dice-set-label">改点</span>
          {COUNTS.map((n) => (
            <button key={n} onClick={() => setOne(selIdx, n)}>
              {n}
            </button>
          ))}
          <button className="dice-hide" onClick={() => setDice(curValues, !hidden)}>
            {hidden ? '揭晓' : '隐藏'}
          </button>
        </div>
      )}

      <div className="dice-info">
        {rolling
          ? `${nameOf(lastDice?.playerId ?? '')} 掷骰中…`
          : lastDice
            ? `${nameOf(lastDice.playerId)} 掷出了 ${hidden ? '? ? ?' : lv.join(' / ')}`
            : '选择颗数后点击掷骰'}
      </div>

      <button className="primary" onClick={() => rollDice(count)}>
        掷骰子
      </button>

      {logOpen && (
        <div className="modal-backdrop" onClick={() => setLogOpen(false)}>
          <div className="modal dice-log" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>掷骰记录（最近 {history.length} 次）</h3>
              <button className="link" onClick={() => setLogOpen(false)}>
                关闭
              </button>
            </div>
            {history.length === 0 && <div className="dice-log-empty">暂无记录</div>}
            <div className="dice-log-list">
              {history.map((roll) => (
                <div key={roll.seq} className="dice-log-row">
                  <span className="dl-time">{fmtTime(roll.at)}</span>
                  <span className="dl-name">{nameOf(roll.playerId)}</span>
                  <span className="dl-val">
                    {roll.hidden ? '（隐藏）' : roll.values.join(' / ')}
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
