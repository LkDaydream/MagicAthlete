import { create } from 'zustand'
import { GameSocket } from '../net/GameSocket'
import type { BoardSide, Envelope, PieceView, RoomState } from '../protocol/messages'

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
  value: number
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
  paintMode: boolean
  armedColor: string | null
  selectedPieceId: string | null
  soundOn: boolean
  notice: string | null

  init(): void
  join(roomCode: string, name: string, piecesPerPlayer: number): void
  send(type: string, payload?: unknown): void
  setPaintMode(on: boolean): void
  setArmedColor(color: string | null): void
  selectPiece(id: string | null): void
  paintCell(cell: number): void
  rollDice(): void
  resetRoom(): void
  undoTurn(): void
  setBoardSide(side: BoardSide): void
  toggleSound(): void
  useCharacter(characterId: string): void
  nextRound(): void
  redeal(): void
  theme: string
  setTheme(theme: string): void
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
        const roll: DiceRoll = {
          playerId: payload.playerId,
          value: payload.value,
          seq: message.seq,
          at: Date.now(),
        }
        set({ lastDice: roll, diceHistory: [roll, ...get().diceHistory].slice(0, 30) })
        break
      }
      case 'error':
        set({ error: payload.message ?? '发生错误' })
        break
      default:
        break
    }
  }

  let noticeTimer: number | null = null
  function notify(text: string): void {
    set({ notice: text })
    if (noticeTimer) {
      window.clearTimeout(noticeTimer)
    }
    noticeTimer = window.setTimeout(() => set({ notice: null }), 2500)
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

    join(roomCode, name, piecesPerPlayer) {
      set({ playerName: name, error: null })
      socket.send('room:join', {
        token: loadToken(),
        roomCode: roomCode.trim().toUpperCase(),
        playerName: name,
        piecesPerPlayer,
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

    rollDice() {
      socket.send('dice:roll')
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

    toggleSound() {
      const next = !get().soundOn
      localStorage.setItem('ma_sound', next ? 'on' : 'off')
      set({ soundOn: next })
    },

    useCharacter(characterId) {
      socket.send('chara:use', { characterId })
    },

    nextRound() {
      socket.send('room:nextRound')
    },

    redeal() {
      socket.send('room:redeal')
    },

    theme: localStorage.getItem('ma_theme') ?? 'comic',

    setTheme(theme) {
      localStorage.setItem('ma_theme', theme)
      set({ theme })
    },
  }
})
