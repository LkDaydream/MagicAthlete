export type BoardSide = 'mild' | 'wild' | 'twisty' | 'whirly'
export type CharacterSet = 'gen1' | 'gen2' | 'mixed'

export interface PlayerView {
  id: string
  name: string
  color: string
  connected: boolean
  /** 分到的角色 id（4 个）。 */
  characters: string[]
  /** 已使用过的角色 id。 */
  usedCharacters: string[]
  /** 本轮正在使用的角色 id。 */
  activeCharacterId: string | null
  /** 当前分数。 */
  score: number
}

export interface CharacterInfo {
  name: string
  nameEn?: string
  skill: string
}

export interface PieceView {
  id: string
  ownerId: string
  cell: number
  /** 拖动中的归一化坐标（0..1），非拖动时为 null。 */
  x: number | null
  y: number | null
  lockedBy: string | null
  /** 自定义显示名（NPC）。 */
  label?: string | null
  /** 自定义颜色（NPC）。 */
  color?: string | null
}

export interface RoomState {
  roomCode: string
  boardSide: BoardSide
  characterSet: CharacterSet
  piecesPerPlayer: number
  round: number
  players: PlayerView[]
  pieces: PieceView[]
  /** 自定义格子颜色：格号(字符串) -> hex 颜色。 */
  cellColors: Record<string, string>
  /** 在场角色 id -> 名称/技能。 */
  characterInfo: Record<string, CharacterInfo>
}

/** 统一消息信封。 */
export interface Envelope<T = unknown> {
  type: string
  seq: number
  payload: T
}
