import { useGameStore } from '../store/gameStore'

const PALETTE = ['#f6d365', '#fda085', '#84fab0', '#a1c4fd', '#e0c3fc', '#ff9a9e']
const ERASE = '__erase__'

export function Toolbar() {
  const boardSide = useGameStore((s) => s.state?.boardSide ?? 'mild')
  const setBoardSide = useGameStore((s) => s.setBoardSide)
  const resetRoom = useGameStore((s) => s.resetRoom)
  const undoTurn = useGameStore((s) => s.undoTurn)
  const paintMode = useGameStore((s) => s.paintMode)
  const armedColor = useGameStore((s) => s.armedColor)
  const setArmedColor = useGameStore((s) => s.setArmedColor)
  const setPaintMode = useGameStore((s) => s.setPaintMode)
  const soundOn = useGameStore((s) => s.soundOn)
  const toggleSound = useGameStore((s) => s.toggleSound)

  return (
    <div className="panel">
      <h3>操作</h3>
      <div className="row">
        <button onClick={() => setBoardSide(boardSide === 'mild' ? 'wild' : 'mild')}>
          赛道：{boardSide === 'mild' ? '温和面' : '狂野面'}
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
    </div>
  )
}
