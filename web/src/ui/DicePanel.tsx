import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { playDice } from './sound'

export function DicePanel() {
  const lastDice = useGameStore((s) => s.lastDice)
  const rollDice = useGameStore((s) => s.rollDice)
  const soundOn = useGameStore((s) => s.soundOn)
  const players = useGameStore((s) => s.state?.players ?? [])
  const playedSeq = useRef<number | null>(null)

  // 每次新的掷骰结果播放一次音效
  useEffect(() => {
    if (lastDice && lastDice.seq !== playedSeq.current) {
      playedSeq.current = lastDice.seq
      if (soundOn) {
        playDice()
      }
    }
  }, [lastDice, soundOn])

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '?'

  return (
    <div className="panel">
      <h3>掷骰</h3>
      <div className={`dice-face${lastDice ? ' rolled' : ''}`} key={lastDice?.seq ?? 0}>
        {lastDice ? lastDice.value : '—'}
      </div>
      <div className="dice-info">
        {lastDice ? `${nameOf(lastDice.playerId)} 掷出了 ${lastDice.value}` : '点击下方按钮掷骰'}
      </div>
      <button className="primary" onClick={rollDice}>
        掷骰子
      </button>
    </div>
  )
}
