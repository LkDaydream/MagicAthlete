import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useGameStore } from '../store/gameStore'
import {
  buildLayout,
  loadTrackConfig,
  nearestCell,
  type BoardLayout,
  type TrackConfig,
} from '../board/layout'
import type { PieceView, PlayerView } from '../protocol/messages'
import { Piece } from './Piece'
import { playMove } from './sound'

const DRAG_SEND_INTERVAL = 33 // ms，约 30Hz

/** 特殊格类型：STAR / TRIP / FWDn（前进 n） / BACKn（后退 n）。 */
function specialIcon(type: string): string | null {
  if (type === 'STAR') return '★'
  if (type === 'TRIP') return '✖'
  const fwd = /^FWD(\d+)$/.exec(type)
  if (fwd) return `➡${fwd[1]}`
  const back = /^BACK(\d+)$/.exec(type)
  if (back) return `⬅${back[1]}`
  return null
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function cellFill(type: string): string {
  if (type === 'START') return 'var(--cell-start)'
  if (type === 'FINISH') return 'var(--cell-finish)'
  if (type === 'STAR') return 'var(--cell-star)'
  if (type === 'TRIP') return 'var(--cell-trip)'
  if (type.startsWith('FWD')) return 'var(--cell-fwd)'
  if (type.startsWith('BACK')) return 'var(--cell-back)'
  return 'var(--cell-normal)'
}

export function Board() {
  const state = useGameStore((s) => s.state)
  const myId = useGameStore((s) => s.playerId)
  const draggingRemote = useGameStore((s) => s.draggingRemote)
  const selectedPieceId = useGameStore((s) => s.selectedPieceId)
  const paintMode = useGameStore((s) => s.paintMode)
  const send = useGameStore((s) => s.send)
  const paintCell = useGameStore((s) => s.paintCell)
  const selectPiece = useGameStore((s) => s.selectPiece)
  const soundOn = useGameStore((s) => s.soundOn)

  const [config, setConfig] = useState<TrackConfig | null>(null)
  const [localDrag, setLocalDrag] = useState<{ pieceId: string; x: number; y: number } | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pieceId: string; lastSent: number; rect: DOMRect } | null>(null)

  useEffect(() => {
    loadTrackConfig()
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  const layout = useMemo<BoardLayout | null>(
    () => (config ? buildLayout(config, state?.boardSide ?? 'mild') : null),
    [config, state?.boardSide],
  )

  // 按容器宽度缩放棋盘（不放大）
  useEffect(() => {
    const wrap = wrapRef.current
    if (!layout || !wrap) return
    const update = () => setScale(Math.min(1, wrap.clientWidth / layout.width))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [layout])

  const players = state?.players ?? []
  const pieces = state?.pieces ?? []

  const playerById = useMemo(() => {
    const map = new Map<string, PlayerView>()
    players.forEach((player) => map.set(player.id, player))
    return map
  }, [players])

  // 同格堆叠：确定性排序 + 偏移错开 + 数量统计
  const stacking = useMemo(() => {
    const byCell = new Map<number, PieceView[]>()
    for (const piece of pieces) {
      if (localDrag?.pieceId === piece.id) continue
      if (draggingRemote[piece.id]) continue
      const list = byCell.get(piece.cell) ?? []
      list.push(piece)
      byCell.set(piece.cell, list)
    }
    const positions = new Map<string, { x: number; y: number; z: number }>()
    const counts = new Map<number, number>()
    for (const [cellIndex, list] of byCell) {
      list.sort((a, b) => a.id.localeCompare(b.id))
      counts.set(cellIndex, list.length)
      const cell = layout?.cells[cellIndex]
      if (!cell) continue
      const count = list.length
      list.forEach((piece, index) => {
        const offset = count > 1 ? index * 14 - (count - 1) * 7 : 0
        positions.set(piece.id, { x: cell.x + offset, y: cell.y + offset, z: index + 1 })
      })
    }
    return { positions, counts }
  }, [pieces, localDrag, draggingRemote, layout])

  if (!layout) {
    return <div className="board-loading">加载赛道…</div>
  }

  const doDragMove = (clientX: number, clientY: number) => {
    const drag = dragRef.current
    if (!drag) return
    const { rect } = drag
    const nx = clamp01((clientX - rect.left) / rect.width)
    const ny = clamp01((clientY - rect.top) / rect.height)
    setLocalDrag({ pieceId: drag.pieceId, x: nx * layout.width, y: ny * layout.height })
    const now = performance.now()
    if (now - drag.lastSent >= DRAG_SEND_INTERVAL) {
      drag.lastSent = now
      send('drag:move', { pieceId: drag.pieceId, x: nx, y: ny })
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      doDragMove(event.clientX, event.clientY)
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const { rect } = drag
    const nx = clamp01((event.clientX - rect.left) / rect.width)
    const ny = clamp01((event.clientY - rect.top) / rect.height)
    const cell = nearestCell(layout, nx * layout.width, ny * layout.height)
    send('drag:end', { pieceId: drag.pieceId, cell })
    if (soundOn) {
      playMove()
    }
    try {
      boardRef.current?.releasePointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    dragRef.current = null
    setLocalDrag(null)
  }

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, piece: PieceView) => {
    if (paintMode) return
    if (piece.lockedBy && piece.lockedBy !== myId) return
    if (!boardRef.current) return
    event.preventDefault()
    try {
      boardRef.current.setPointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    dragRef.current = {
      pieceId: piece.id,
      lastSent: 0,
      rect: boardRef.current.getBoundingClientRect(),
    }
    selectPiece(piece.id)
    send('drag:start', { pieceId: piece.id })
    doDragMove(event.clientX, event.clientY)
  }

  const renderPiece = (piece: PieceView) => {
    let x: number
    let y: number
    let z = 1
    let dragging = false
    if (localDrag?.pieceId === piece.id) {
      x = localDrag.x
      y = localDrag.y
      z = 999
      dragging = true
    } else if (draggingRemote[piece.id]) {
      const remote = draggingRemote[piece.id]
      x = remote.x * layout.width
      y = remote.y * layout.height
      z = 999
      dragging = true
    } else {
      const position = stacking.positions.get(piece.id)
      if (!position) return null
      x = position.x
      y = position.y
      z = position.z
    }
    const locked = Boolean(piece.lockedBy) && piece.lockedBy !== myId
    if (!dragging && piece.id === hoverId) {
      z = 998
    }
    return (
      <Piece
        key={piece.id}
        piece={piece}
        player={playerById.get(piece.ownerId)}
        x={x}
        y={y}
        z={z}
        dragging={dragging}
        selected={selectedPieceId === piece.id}
        locked={locked}
        onHover={setHoverId}
        onPointerDown={(event) => beginDrag(event, piece)}
      />
    )
  }

  const half = layout.cellSize / 2
  const trackPoints = layout.cells.map((cell) => `${cell.x},${cell.y}`).join(' ')

  return (
    <>
      <div className="board-caption">
        赛道 {layout.cells.length} 格 · 起点 + {layout.cells.length - 1} 格
      </div>
      <div className="board-wrap" ref={wrapRef} style={{ height: layout.height * scale }}>
      <div
        ref={boardRef}
        className={`board${paintMode ? ' painting' : ''}`}
        style={{
          width: layout.width,
          height: layout.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg className="board-svg" width={layout.width} height={layout.height}>
          <polyline className="track-line" points={trackPoints} />
          {layout.cells.map((cell) => {
            const custom = state?.cellColors?.[String(cell.index)]
            const count = stacking.counts.get(cell.index) ?? 0
            const icon = specialIcon(cell.type)
            return (
              <g
                key={cell.index}
                className={`cell cell-${cell.type.toLowerCase()}${paintMode ? ' paintable' : ''}`}
                onClick={() => paintMode && paintCell(cell.index)}
              >
                <rect
                  x={cell.x - half}
                  y={cell.y - half}
                  width={layout.cellSize}
                  height={layout.cellSize}
                  rx={14}
                  style={{ fill: custom ?? cellFill(cell.type) }}
                />
                <text className="cell-index" x={cell.x} y={cell.y + 5} textAnchor="middle">
                  {cell.index}
                </text>
                {cell.type === 'START' && (
                  <text className="cell-tag" x={cell.x} y={cell.y + 26} textAnchor="middle">
                    START
                  </text>
                )}
                {cell.type === 'FINISH' && (
                  <text className="cell-tag" x={cell.x} y={cell.y + 26} textAnchor="middle">
                    FINISH
                  </text>
                )}
                {icon && (
                  <text className="cell-icon" x={cell.x} y={cell.y - 20} textAnchor="middle">
                    {icon}
                  </text>
                )}
                {count > 1 && (
                  <text className="cell-count" x={cell.x + half - 14} y={cell.y - half + 20} textAnchor="middle">
                    ×{count}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <div className="pieces-layer">{pieces.map(renderPiece)}</div>
      </div>
    </div>
    </>
  )
}
