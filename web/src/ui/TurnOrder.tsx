import { useGameStore } from '../store/gameStore'

/** 投掷顺序：按各玩家「最近一次掷骰点数」从高到低排列（用于定先手）。 */
export function TurnOrder() {
  const players = useGameStore((s) => s.state?.players ?? [])
  const lastRolls = useGameStore((s) => s.lastRolls)

  const ranked = [...players].sort((a, b) => (lastRolls[b.id] ?? -1) - (lastRolls[a.id] ?? -1))

  return (
    <div className="panel turn-panel">
      <h3>投掷顺序</h3>
      <ol className="turn-order">
        {players.length === 0 && <li className="to-empty">暂无玩家</li>}
        {ranked.map((player, i) => (
          <li key={player.id}>
            <span className="to-rank">{i + 1}</span>
            <span className="dot" style={{ background: player.color }} />
            <span className="to-name">{player.name}</span>
            <span className="to-val">{lastRolls[player.id] ?? '—'}</span>
          </li>
        ))}
      </ol>
      <div className="to-hint">按最近掷骰点数，高者在前</div>
    </div>
  )
}
