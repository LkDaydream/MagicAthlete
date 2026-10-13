import { useGameStore } from '../store/gameStore'

export function PlayerList() {
  const players = useGameStore((s) => s.state?.players ?? [])
  const myId = useGameStore((s) => s.playerId)

  return (
    <div className="panel">
      <h3>玩家（{players.length}）</h3>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id} className={player.connected ? '' : 'offline'}>
            <span className="dot" style={{ background: player.color }} />
            <span className="pname">
              {player.name}
              {player.id === myId ? '（我）' : ''}
            </span>
            {!player.connected && <span className="off">离线</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
