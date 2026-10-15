import type { PointerEvent as ReactPointerEvent } from 'react'
import type { PieceView, PlayerView } from '../protocol/messages'

interface Props {
  piece: PieceView
  player?: PlayerView
  x: number
  y: number
  z: number
  dragging: boolean
  selected: boolean
  locked: boolean
  onHover: (id: string | null) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}

/** 单枚棋子：玩家颜色圆点 + 玩家名标签。 */
export function Piece({ piece, player, x, y, z, dragging, selected, locked, onHover, onPointerDown }: Props) {
  const isNpc = piece.ownerId === '__npc__'
  const classNames = ['piece']
  if (dragging) classNames.push('dragging')
  if (selected) classNames.push('selected')
  if (locked) classNames.push('locked')
  if (piece.tripped) classNames.push('tripped')
  return (
    <div
      className={classNames.join(' ')}
      style={{
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
        zIndex: z,
        // 远端拖动用 CSS 过渡做平滑，避免手动插值
        transition: dragging ? 'none' : 'transform 90ms linear',
      }}
      onPointerEnter={() => onHover(piece.id)}
      onPointerLeave={() => onHover(null)}
      onPointerDown={onPointerDown}
      title={piece.label ?? player?.name ?? piece.id}
    >
      <div className="piece-dot" style={{ background: piece.color ?? player?.color ?? (isNpc ? '#5c6b7a' : '#888') }} />
      <div className="piece-name">{piece.label ?? player?.name ?? (isNpc ? 'NPC' : '?')}</div>
      {piece.tripped && <div className="piece-trip">绊</div>}
    </div>
  )
}
