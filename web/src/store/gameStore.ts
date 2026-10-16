import { create } from 'zustand'
import { GameSocket } from '../net/GameSocket'
import type { BoardSide, CharacterSet, Envelope, PieceView, RoomState } from '../protocol/messages'

const ERASE = '__erase__'

const socket = new GameSocket(
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
)

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'x' + Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function loadToken(): string {
  let token = localStorage.getItem('ma_token')
  if (!token) {
    token = randomId()
    localStorage.setItem('ma_token', token)
  }
  return token
}

export interface DiceRoll {
  playerId: string
  values: number[]
  hidden: boolean
  /** 是否播放掷骰动画（手动改点/隐藏为 false）。 */
  animate: boolean
  seq: number
  at: number
}

interface GameStore {
  connected: boolean
  joined: boolean
  error: string | null
  roomCode: string | null
  playerId: string | null
  playerName: string
  state: RoomState | null
  /** 远端正在拖动的棋子 -> 归一化坐标（0..1）。 */
  draggingRemote: Record<string, { x: number; y: number }>
  diceHistory: DiceRoll[]
  lastDice: DiceRoll | null
  /** 最近抽到的扭扭卡（索引）；null 表示无。 */
  twistCard: { index: number; byPlayer: string; at: number } | null
  /** 扭扭卡抽取历史（最近若干次）。 */
  twistHistory: { index: number; byPlayer: string; at: number }[]
  /** 扭扭卡揭示弹窗是否打开（关闭后仍保留当前卡）。 */
  twistModalOpen: boolean
  /** 扭扭卡是否处于“抽取动画中”（期间不剧透结果）。 */
  twistRevealing: boolean
  paintMode: boolean
  armedColor: string | null
  selectedPieceId: string | null
  soundOn: boolean
  notice: string | null

  init(): void
  join(roomCode: string, name: string, piecesPerPlayer: number, characterSet: CharacterSet): void
  setCharacterSet(set: CharacterSet): void
  send(type: string, payload?: unknown): void
  setPaintMode(on: boolean): void
  setArmedColor(color: string | null): void
  selectPiece(id: string | null): void
  paintCell(cell: number): void
  rollDice(count?: number): void
  setDice(values: number[], hidden: boolean): void
  resetRoom(): void
  undoTurn(): void
  setBoardSide(side: BoardSide): void
  drawTwist(): void
  setTwistMode(mode: 'discard' | 'return'): void
  closeTwist(): void
  addPiece(npc?: boolean, name?: string, color?: string): void
  removePiece(pieceId: string): void
  toggleTrip(pieceId: string, tripped: boolean): void
  toggleSound(): void
  useCharacter(characterId: string): void
  unuseCharacter(characterId: string): void
  drawChara(count?: number): void
  pickChara(characterId: string): void
  replaceChara(characterId: string): void
  attachChara(characterId: string): void
  swapChara(targetPlayerId: string): void
  cancelCharaDraw(): void
  nextRound(): void
  redeal(): void
  setDealSetting(mode: 'random' | 'draft', perPlayer: number): void
  takeCharacter(characterId: string, targetPlayerId?: string): void
  returnCharacter(characterId: string, targetPlayerId?: string): void
  theme: string
  setTheme(theme: string): void
  leaveRoom(): void
  endRoom(): void
  adjustScore(playerId: string, delta: number): void
  resetScores(): void
}

let initialized = false

function patchPiece(pieces: PieceView[], id: string, patch: Partial<PieceView>): PieceView[] {
  return pieces.map((piece) => (piece.id === id ? { ...piece, ...patch } : piece))
}

export const useGameStore = create<GameStore>((set, get) => {
  function handle(message: Envelope): void {
    // 消息负载结构由协议约定，此处按需取值。
    const payload = message.payload as any
    const current = get().state
    switch (message.type) {
      case 'room:joined':
        set({ playerId: payload.playerId, roomCode: payload.roomCode, joined: true })
        break
      case 'room:state':
        set({ state: payload as RoomState, joined: true, roomCode: payload.roomCode, draggingRemote: {} })
        break
      case 'board:side':
        if (current) {
          set({ state: { ...current, boardSide: payload.side as BoardSide } })
        }
        break
      case 'cell:color': {
        if (!current) break
        const colors = { ...current.cellColors }
        const key = String(payload.cell)
        if (payload.color) {
          colors[key] = payload.color
        } else {
          delete colors[key]
        }
        set({ state: { ...current, cellColors: colors } })
        break
      }
      case 'piece:locked':
        if (current) {
          set({ state: { ...current, pieces: patchPiece(current.pieces, payload.pieceId, { lockedBy: payload.lockedBy }) } })
        }
        break
      case 'piece:unlocked':
        if (current) {
          set({ state: { ...current, pieces: patchPiece(current.pieces, payload.pieceId, { lockedBy: null }) } })
        }
        break
      case 'piece:dragging':
        set({
          draggingRemote: {
            ...get().draggingRemote,
            [payload.pieceId]: { x: payload.x, y: payload.y },
          },
        })
        break
      case 'piece:moved': {
        if (!current) break
        const draggingRemote = { ...get().draggingRemote }
        delete draggingRemote[payload.pieceId]
        set({
          draggingRemote,
          state: {
            ...current,
            pieces: patchPiece(current.pieces, payload.pieceId, { cell: payload.cell, x: null, y: null }),
          },
        })
        break
      }
      case 'dice:rolled': {
        const values: number[] = Array.isArray(payload.values)
          ? payload.values
          : payload.value != null
            ? [payload.value]
            : []
        const roll: DiceRoll = {
          playerId: payload.playerId,
          values,
          hidden: Boolean(payload.hidden),
          animate: true,
          seq: message.seq,
          at: Date.now(),
        }
        set({
          lastDice: roll,
          diceHistory: [roll, ...get().diceHistory].slice(0, 30),
        })
        break
      }
      case 'dice:updated': {
        // 手动改点 / 隐藏 / 揭晓：就地更新，不改变 seq、不播动画、不记入掷骰历史
        const prev = get().lastDice
        set({
          lastDice: {
            playerId: prev?.playerId ?? payload.playerId,
            values: Array.isArray(payload.values) ? payload.values : [],
            hidden: Boolean(payload.hidden),
            animate: false,
            seq: prev?.seq ?? message.seq,
            at: Date.now(),
          },
        })
        break
      }
      case 'twist:drawn': {
        const entry = { index: payload.index, byPlayer: payload.byPlayer, at: Date.now() }
        set({
          twistCard: entry,
          twistHistory: [entry, ...get().twistHistory].slice(0, 30),
          twistModalOpen: true,
          twistRevealing: true,
        })
        if (twistTimer) window.clearTimeout(twistTimer)
        twistTimer = window.setTimeout(() => set({ twistRevealing: false }), 1200)
        break
      }
      case 'error':
        set({ error: payload.message ?? '发生错误' })
        break
      case 'room:closed':
        resetLocal()
        notify('房间已结束')
        break
      default:
        break
    }
  }

  let twistTimer: number | null = null
  let noticeTimer: number | null = null
  function notify(text: string): void {
    set({ notice: text })
    if (noticeTimer) {
      window.clearTimeout(noticeTimer)
    }
    noticeTimer = window.setTimeout(() => set({ notice: null }), 2500)
  }

  function resetLocal(): void {
    set({
      joined: false,
      state: null,
      roomCode: null,
      playerId: null,
      draggingRemote: {},
      diceHistory: [],
      lastDice: null,
      twistCard: null,
      twistHistory: [],
      twistModalOpen: false,
      twistRevealing: false,
      selectedPieceId: null,
      paintMode: false,
      armedColor: null,
    })
  }

  return {
    connected: false,
    joined: false,
    error: null,
    roomCode: null,
    playerId: null,
    playerName: '',
    state: null,
    draggingRemote: {},
    diceHistory: [],
    lastDice: null,
    twistCard: null,
    twistHistory: [],
    twistModalOpen: false,
    twistRevealing: false,
    paintMode: false,
    armedColor: null,
    selectedPieceId: null,
    soundOn: localStorage.getItem('ma_sound') !== 'off',
    notice: null,

    init() {
      if (initialized) return
      initialized = true

      socket.onOpen(() => {
        set({ connected: true, error: null })
        const { roomCode, playerName } = get()
        // 断线重连后自动复用身份重新加入
        if (roomCode) {
          socket.send('room:join', { token: loadToken(), roomCode, playerName })
          notify('已重新连接')
        }
      })
      socket.onClose(() => set({ connected: false }))
      socket.onMessage(handle)
      socket.connect()
    },

    join(roomCode, name, piecesPerPlayer, characterSet) {
      set({ playerName: name, error: null })
      socket.send('room:join', {
        token: loadToken(),
        roomCode: roomCode.trim().toUpperCase(),
        playerName: name,
        piecesPerPlayer,
        characterSet,
      })
    },

    send(type, payload) {
      socket.send(type, payload)
    },

    setPaintMode(on) {
      set({ paintMode: on, armedColor: on ? get().armedColor : null })
    },

    setArmedColor(color) {
      set({ armedColor: color, paintMode: true })
    },

    selectPiece(id) {
      set({ selectedPieceId: id })
    },

    paintCell(cell) {
      const { armedColor } = get()
      if (!armedColor) return
      socket.send('cell:color', { cell, color: armedColor === ERASE ? null : armedColor })
    },

    rollDice(count) {
      socket.send('dice:roll', { count: Math.max(1, Math.min(6, count ?? 1)) })
    },

    setDice(values, hidden) {
      socket.send('dice:set', { values, hidden })
    },

    resetRoom() {
      socket.send('room:reset')
    },

    undoTurn() {
      socket.send('move:undo')
    },

    setBoardSide(side) {
      socket.send('board:side', { side })
    },

    setCharacterSet(set) {
      socket.send('chara:set', { set })
    },

    drawTwist() {
      socket.send('twist:draw')
    },

    setTwistMode(mode) {
      socket.send('twist:mode', { mode })
    },

    closeTwist() {
      set({ twistModalOpen: false })
    },

    addPiece(npc, name, color) {
      socket.send('piece:add', { npc: Boolean(npc), name, color })
    },

    removePiece(pieceId) {
      socket.send('piece:remove', { pieceId })
    },

    toggleTrip(pieceId, tripped) {
      socket.send('piece:trip', { pieceId, tripped })
    },

    toggleSound() {
      const next = !get().soundOn
      localStorage.setItem('ma_sound', next ? 'on' : 'off')
      set({ soundOn: next })
    },

    useCharacter(characterId) {
      socket.send('chara:use', { characterId })
    },

    unuseCharacter(characterId) {
      socket.send('chara:unuse', { characterId })
    },

    drawChara(count) {
      socket.send('chara:draw', { count: Math.max(1, Math.min(3, count ?? 1)) })
    },

    pickChara(characterId) {
      socket.send('chara:pick', { characterId })
    },

    replaceChara(characterId) {
      socket.send('chara:replace', { characterId })
    },

    attachChara(characterId) {
      socket.send('chara:attach', { characterId })
    },

    swapChara(targetPlayerId) {
      socket.send('chara:swap', { targetPlayerId })
    },

    cancelCharaDraw() {
      socket.send('chara:cancel')
    },

    nextRound() {
      socket.send('room:nextRound')
    },

    redeal() {
      socket.send('room:redeal')
    },

    setDealSetting(mode, perPlayer) {
      socket.send('room:deal', { mode, perPlayer })
    },

    takeCharacter(characterId, targetPlayerId) {
      socket.send('chara:take', { characterId, targetPlayerId })
    },

    returnCharacter(characterId, targetPlayerId) {
      socket.send('chara:return', { characterId, targetPlayerId })
    },

    theme: localStorage.getItem('ma_theme') ?? 'comic',

    setTheme(theme) {
      localStorage.setItem('ma_theme', theme)
      set({ theme })
    },

    leaveRoom() {
      socket.send('room:leave')
      resetLocal()
    },

    endRoom() {
      socket.send('room:end')
    },

    adjustScore(playerId, delta) {
      socket.send('score:adjust', { playerId, delta })
    },

    resetScores() {
      socket.send('score:reset')
    },
  }
})
