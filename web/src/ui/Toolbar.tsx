import { useGameStore } from '../store/gameStore'
import type { BoardSide } from '../protocol/messages'

const PALETTE = ['#f6d365', '#fda085', '#84fab0', '#a1c4fd', '#e0c3fc', '#ff9a9e']
const ERASE = '__erase__'

const SIDES: BoardSide[] = ['mild', 'wild', 'twisty', 'whirly']
const SIDE_LABEL: Record<BoardSide, string> = {
  mild: '温和面',
  wild: '狂野面',
  twisty: '扭扭赛道',
  whirly: '螺旋世界',
}
const nextSide = (side: BoardSide): BoardSide => SIDES[(SIDES.indexOf(side) + 1) % SIDES.length]

export function Toolbar() {
  const boardSide = useGameStore((s) => s.state?.boardSide ?? 'mild')
  const setBoardSide = useGameStore((s) => s.setBoardSide)
  const addPiece = useGameStore((s) => s.addPiece)
  const removePiece = useGameStore((s) => s.removePiece)
  const selectedPieceId = useGameStore((s) => s.selectedPieceId)
  const resetRoom = useGameStore((s) => s.resetRoom)
  const undoTurn = useGameStore((s) => s.undoTurn)
  const paintMode = useGameStore((s) => s.paintMode)
  const armedColor = useGameStore((s) => s.armedColor)
  const setArmedColor = useGameStore((s) => s.setArmedColor)
  const setPaintMode = useGameStore((s) => s.setPaintMode)
  const soundOn = useGameStore((s) => s.soundOn)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const leaveRoom = useGameStore((s) => s.leaveRoom)
  const endRoom = useGameStore((s) => s.endRoom)

  return (
    <div className="panel">
      <h3>操作</h3>
      <div className="row">
        <button onClick={() => setBoardSide(nextSide(boardSide))}>赛道：{SIDE_LABEL[boardSide]}</button>
      </div>
      <div className="row">
        <button onClick={() => addPiece(false)}>新增棋子</button>
        <button
          onClick={() => {
            const name = window.prompt('NPC 名称', 'NPC')
            if (name === null) return
            addPiece(true, name.trim() || 'NPC')
          }}
        >
          新增 NPC
        </button>
      </div>
      <div className="row">
        <button disabled={!selectedPieceId} onClick={() => selectedPieceId && removePiece(selectedPieceId)}>
          移除选中棋子
        </button>
      </div>
      <div className="row">
        <button onClick={resetRoom}>重置到起点</button>
        <button onClick={undoTurn}>撤回上一步</button>
      </div>
      <div className="row">
        <button
          className={paintMode ? 'active' : ''}
          onClick={() => {
            const next = !paintMode
            setPaintMode(next)
            if (next && !armedColor) {
              setArmedColor(PALETTE[0])
            }
          }}
        >
          格子改色
        </button>
        <button onClick={toggleSound}>音效：{soundOn ? '开' : '关'}</button>
      </div>
      {paintMode && (
        <div className="palette">
          {PALETTE.map((color) => (
            <button
              key={color}
              className={`swatch${armedColor === color ? ' active' : ''}`}
              style={{ background: color }}
              onClick={() => setArmedColor(color)}
            />
          ))}
          <button
            className={`swatch erase${armedColor === ERASE ? ' active' : ''}`}
            onClick={() => setArmedColor(ERASE)}
          >
            擦
          </button>
        </div>
      )}
      <div className="row">
        <button onClick={leaveRoom}>离开房间</button>
        <button
          onClick={() => {
            if (window.confirm('确定结束房间？房间会被销毁，所有玩家都会被移出。')) {
              endRoom()
            }
          }}
        >
          结束房间
        </button>
      </div>
    </div>
  )
}
