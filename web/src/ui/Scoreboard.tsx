import { useGameStore } from '../store/gameStore'

/** 计分板：手动加减分，分数实时同步；顺序固定（按加入顺序），避免分数变动时点错。 */
export function Scoreboard() {
  const players = useGameStore((s) => s.state?.players ?? [])
  const adjustScore = useGameStore((s) => s.adjustScore)
  const resetScores = useGameStore((s) => s.resetScores)

  return (
    <div className="panel">
      <h3>计分板</h3>
      <ul className="score-list">
        {players.length === 0 && <li className="score-empty">暂无玩家</li>}
        {players.map((player) => (
          <li key={player.id} className={player.connected ? '' : 'offline'}>
            <span className="dot" style={{ background: player.color }} />
            <span className="score-name">{player.name}</span>
            <span className="score-value">{player.score}</span>
            <span className="score-btns">
              <button onClick={() => adjustScore(player.id, -1)}>−</button>
              <button onClick={() => adjustScore(player.id, 1)}>+</button>
            </span>
          </li>
        ))}
      </ul>
      <div className="row">
        <button
          onClick={() => {
            if (window.confirm('确定把所有玩家分数清零？')) {
              resetScores()
            }
          }}
        >
          分数清零
        </button>
      </div>
    </div>
  )
}
