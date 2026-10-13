import { useGameStore } from '../store/gameStore'

/** 房间信息/设置面板（只读展示当前房间的配置）。 */
export function RoomInfo() {
  const roomCode = useGameStore((s) => s.state?.roomCode ?? '-')
  const piecesPerPlayer = useGameStore((s) => s.state?.piecesPerPlayer ?? 1)
  const boardSide = useGameStore((s) => s.state?.boardSide ?? 'mild')
  const players = useGameStore((s) => s.state?.players ?? [])
  const pieces = useGameStore((s) => s.state?.pieces ?? [])
  const online = players.filter((p) => p.connected).length

  return (
    <div className="panel">
      <h3>房间设置</h3>
      <dl className="info">
        <div>
          <dt>房间码</dt>
          <dd>{roomCode}</dd>
        </div>
        <div>
          <dt>每人棋子</dt>
          <dd>{piecesPerPlayer} 枚</dd>
        </div>
        <div>
          <dt>当前赛道</dt>
          <dd>{boardSide === 'mild' ? '温和面' : '狂野面'}</dd>
        </div>
        <div>
          <dt>在线人数</dt>
          <dd>
            {online} / {players.length}
          </dd>
        </div>
        <div>
          <dt>棋子总数</dt>
          <dd>{pieces.length}</dd>
        </div>
      </dl>
    </div>
  )
}
