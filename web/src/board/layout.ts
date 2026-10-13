import type { BoardSide } from '../protocol/messages'

export interface TrackConfig {
  columns: number
  cellSize: number
  gap: number
  padding: number
  totalCells: number
  boards: Record<string, { id: string; name: string; special: Record<string, string> }>
}

export interface CellLayout {
  index: number
  row: number
  col: number
  /** 格心 x（棋盘单位）。 */
  x: number
  /** 格心 y（棋盘单位）。 */
  y: number
  /** NORMAL | START | FINISH | ARROW_FWD | ARROW_BACK | STAR | TRIP */
  type: string
  special: string | null
}

export interface BoardLayout {
  side: BoardSide
  width: number
  height: number
  cellSize: number
  cells: CellLayout[]
}

/** 加载赛道布局配置（外置 JSON，便于照实体版图校准）。 */
export async function loadTrackConfig(): Promise<TrackConfig> {
  const url = `${import.meta.env.BASE_URL}board/track.json`
  // 强制不走 HTTP 缓存，避免更新后仍拿到旧的赛道配置
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`加载赛道配置失败：${response.status}`)
  }
  return (await response.json()) as TrackConfig
}

/**
 * 由紧凑配置计算网格坐标。采用「蛇形（boustrophedon）」排布：
 * 偶数行从左到右、奇数行从右到左，起点在 0、终点在最后一格。
 */
export function buildLayout(config: TrackConfig, side: BoardSide): BoardLayout {
  const board = config.boards[side] ?? config.boards[Object.keys(config.boards)[0]]
  const special = board?.special ?? {}
  const { columns, cellSize, gap, padding, totalCells } = config
  const rows = Math.ceil(totalCells / columns)
  const width = padding * 2 + columns * cellSize + (columns - 1) * gap
  const height = padding * 2 + rows * cellSize + (rows - 1) * gap

  const cells: CellLayout[] = []
  for (let i = 0; i < totalCells; i++) {
    const row = Math.floor(i / columns)
    const col = row % 2 === 0 ? i % columns : columns - 1 - (i % columns)
    const x = padding + col * (cellSize + gap) + cellSize / 2
    const y = padding + row * (cellSize + gap) + cellSize / 2
    let type = 'NORMAL'
    if (i === 0) {
      type = 'START'
    } else if (i === totalCells - 1) {
      type = 'FINISH'
    }
    const sp = special[String(i)] ?? null
    if (sp) {
      type = sp
    }
    cells.push({ index: i, row, col, x, y, type, special: sp })
  }

  return { side: board?.id === 'wild' ? 'wild' : 'mild', width, height, cellSize, cells }
}

/** 找到距离给定棋盘坐标最近的格号。 */
export function nearestCell(layout: BoardLayout, x: number, y: number): number {
  let best = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (const cell of layout.cells) {
    const dx = cell.x - x
    const dy = cell.y - y
    const dist = dx * dx + dy * dy
    if (dist < bestDist) {
      bestDist = dist
      best = cell.index
    }
  }
  return best
}
