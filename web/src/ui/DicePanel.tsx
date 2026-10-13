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

export function DicePanel() {
  const lastDice = useGameStore((s) => s.lastDice)
  const rollDice = useGameStore((s) => s.rollDice)
  const soundOn = useGameStore((s) => s.soundOn)
  const players = useGameStore((s) => s.state?.players ?? [])

  const [face, setFace] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const playedSeq = useRef<number | null>(null)

  // 每次新结果：先播放音效并滚动动画（快速切换点数），再定格到最终点数
  useEffect(() => {
    if (!lastDice || lastDice.seq === playedSeq.current) {
      return
    }
    playedSeq.current = lastDice.seq
    if (soundOn) {
      playDice()
    }
    setRolling(true)
    let ticks = 0
    const spin = window.setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 6))
      ticks += 1
      if (ticks >= 12) {
        window.clearInterval(spin)
        setFace(lastDice.value)
        setRolling(false)
      }
    }, 70)
    return () => window.clearInterval(spin)
  }, [lastDice, soundOn])

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?'
  const shown = face ?? lastDice?.value ?? null

  return (
    <div className="panel">
      <h3>掷骰</h3>
      <div className="dice-stage">
        <Die value={shown} rolling={rolling} />
      </div>
      <div className="dice-info">
        {rolling
          ? `${nameOf(lastDice?.playerId ?? '')} 掷骰中…`
          : lastDice
            ? `${nameOf(lastDice.playerId)} 掷出了 ${lastDice.value}`
            : '点击下方按钮掷骰'}
      </div>
      <button className="primary" onClick={rollDice}>
        掷骰子
      </button>
    </div>
  )
}
