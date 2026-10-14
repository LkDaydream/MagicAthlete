import { useGameStore } from '../store/gameStore'
import type { BoardSide } from '../protocol/messages'

const SIDE_LABEL: Record<BoardSide, string> = {
  mild: '温和',
  wild: '狂野',
  twisty: '扭扭',
  whirly: '螺旋世界',
}

/** 房间信息：「平铺」在 header 里展示（不占侧栏）。 */
export function RoomInfo() {
  const piecesPerPlayer = useGameStore((s) => s.state?.piecesPerPlayer ?? 1)
  const boardSide = useGameStore((s) => s.state?.boardSide ?? 'mild')
  const players = useGameStore((s) => s.state?.players ?? [])
  const pieces = useGameStore((s) => s.state?.pieces ?? [])

  return (
    <div className="room-stats">
      <span className="stat">
        每人棋子 <b>{piecesPerPlayer}</b>
      </span>
      <span className="stat">
        赛道 <b>{SIDE_LABEL[boardSide]}</b>
      </span>
      <span className="stat">
        在线 <b>{players.filter((p) => p.connected).length}/{players.length}</b>
      </span>
      <span className="stat">
        棋子 <b>{pieces.length}</b>
      </span>
    </div>
  )
}
