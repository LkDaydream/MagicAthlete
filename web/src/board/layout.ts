import type { BoardSide } from '../protocol/messages'

export interface TrackConfig {
  shape?: 'ring' | 'serpentine'
  columns: number
  rows?: number
  /** 起点占用几列（与实体版图一致，默认 1）。 */
  startWidth?: number
  cellSize: number
  gap: number
  padding: number
  totalCells: number
  boards: Record<string, { id: string; name: string; special: Record<string, string>; links?: number[][] }>
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
  /** 格宽（像素）；缺省为 cellSize。 */
  w?: number
  /** 该格的行进方向（角度，度；0° 指向右，SVG 坐标 y 向下）。 */
  dir?: number
}

export interface BoardLayout {
  side: BoardSide
  name: string
  width: number
  height: number
  cellSize: number
  cells: CellLayout[]
  /** 螺旋世界的连通格对（用于画"环"）。 */
  links?: { a: { x: number; y: number }; b: { x: number; y: number } }[]
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
 * 生成赛道坐标：贴棋盘四边「开环环形」按**整数网格**铺格
 * （顺时针 上→右→下→左）。起点占 startWidth 列（与实体一致），其余每格 1 列；
 * 角落格严格落在四角 → 整圈对齐不歪。末尾两格为终点，与起点之间留缺口。
 */
export function buildLayout(config: TrackConfig, side: BoardSide): BoardLayout {
  const board = config.boards[side] ?? config.boards[Object.keys(config.boards)[0]]
  const special = board?.special ?? {}
  const { cellSize, gap, padding, totalCells } = config
  const cols = Math.max(2, config.columns)
  const rows = Math.max(2, config.rows ?? 4)
  const startCols = Math.max(1, config.startWidth ?? 1)

  // 顺时针网格走位（span = 占几列；只有起点 > 1）
  const walk: { col: number; row: number; span: number }[] = []
  walk.push({ col: 0, row: 0, span: startCols }) // 起点
  for (let c = startCols; c < cols; c++) walk.push({ col: c, row: 0, span: 1 }) // 上边
  for (let r = 1; r < rows; r++) walk.push({ col: cols - 1, row: r, span: 1 }) // 右边
  for (let c = cols - 2; c >= 0; c--) walk.push({ col: c, row: rows - 1, span: 1 }) // 下边
  for (let r = rows - 2; r >= 1; r--) walk.push({ col: 0, row: r, span: 1 }) // 左边

  const width = padding * 2 + cols * cellSize + (cols - 1) * gap
  const height = padding * 2 + rows * cellSize + (rows - 1) * gap

  const cells: CellLayout[] = []
  const total = Math.min(totalCells, walk.length)
  for (let i = 0; i < total; i++) {
    const g = walk[i]
    const w = g.span * cellSize + (g.span - 1) * gap
    const x = padding + g.col * (cellSize + gap) + w / 2
    const y = padding + g.row * (cellSize + gap) + cellSize / 2
    let type = 'NORMAL'
    if (i === 0) {
      type = 'START'
    } else if (i === totalCells - 1) {
      // 最后一格 = 终点
      type = 'FINISH'
    }
    const sp = special[String(i)] ?? null
    if (sp) {
      type = sp
    }
    cells.push({ index: i, row: g.row, col: g.col, x, y, type, special: sp, w: w === cellSize ? undefined : w })
  }

  // 计算每格的「行进方向」（用于把前进/后退箭头旋转到正确朝向）
  for (let i = 0; i < cells.length; i++) {
    const prev = cells[i - 1]
    const next = cells[i + 1]
    let dx = 0
    let dy = 0
    if (prev && next) {
      dx = next.x - prev.x
      dy = next.y - prev.y
    } else if (next) {
      dx = next.x - cells[i].x
      dy = next.y - cells[i].y
    } else if (prev) {
      dx = cells[i].x - prev.x
      dy = cells[i].y - prev.y
    }
    cells[i].dir = Math.round((Math.atan2(dy, dx) * 180) / Math.PI)
  }

  // 螺旋世界：把连通格标为 SPIRAL，并记录连线（供渲染"环"）
  const linksCfg = board?.links ?? []
  for (const [a, b] of linksCfg) {
    if (cells[a] && cells[a].type === 'NORMAL') cells[a].type = 'SPIRAL'
    if (cells[b] && cells[b].type === 'NORMAL') cells[b].type = 'SPIRAL'
  }
  const links = linksCfg
    .filter(([a, b]) => cells[a] && cells[b])
    .map(([a, b]) => ({
      a: { x: cells[a].x, y: cells[a].y },
      b: { x: cells[b].x, y: cells[b].y },
    }))

  return {
    side: (board?.id ?? 'mild') as BoardSide,
    name: board?.name ?? '',
    width,
    height,
    cellSize,
    cells,
    links,
  }
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
