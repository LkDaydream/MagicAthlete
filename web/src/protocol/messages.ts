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
  /** 抽到但未决定用途的角色牌（旧货集市 / 缝合怪 / 蛋）。 */
  pendingDraws?: string[]
  /** 附加能力（缝合怪）。 */
  extras?: string[]
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
  /** 是否处于绊倒 / 摔倒状态。 */
  tripped?: boolean
}

export interface RoomState {
  roomCode: string
  boardSide: BoardSide
  characterSet: CharacterSet
  /** 扭扭卡抽取模式：discard（弃牌堆） / return（放回重洗）。 */
  twistMode?: string
  /** 扭扭卡牌堆中剩余卡的索引（已排序）。 */
  twistDeck?: number[]
  /** 扭扭卡弃牌堆中卡的索引（已排序）。 */
  twistDiscard?: number[]
  /** 开局每人发牌数。 */
  charactersPerPlayer?: number
  /** 发牌方式：random（随机发牌） / draft（卡池抽选）。 */
  dealMode?: string
  /** 卡池抽选模式下的公共牌池（未被领取的角色 id）。 */
  draftPool?: string[]
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
