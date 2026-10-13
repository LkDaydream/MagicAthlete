import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ThemeSwitcher } from './ThemeSwitcher'

export function Lobby() {
  const join = useGameStore((s) => s.join)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState(() => localStorage.getItem('ma_name') ?? '')
  const [code, setCode] = useState('')
  const [pieces, setPieces] = useState(1)

  const start = () => {
    const finalName = name.trim() || 'Player'
    localStorage.setItem('ma_name', finalName)
    if (mode === 'join' && !code.trim()) {
      return
    }
    join(mode === 'join' ? code.trim() : '', finalName, pieces)
  }

  return (
    <div className="lobby">
      <h1>魔法运动员 · 联机棋盘</h1>
      <p className="subtitle">和朋友一起拖棋子、掷骰子、玩桌游</p>

      <div className="segmented">
        <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
          创建房间
        </button>
        <button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
          加入房间
        </button>
      </div>

      <label>
        <span>昵称</span>
        <input
          value={name}
          maxLength={12}
          placeholder="你的名字"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      {mode === 'join' && (
        <label>
          <span>房间码</span>
          <input
            value={code}
            maxLength={6}
            placeholder="如 ABCD"
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </label>
      )}

      {mode === 'create' && (
        <label>
          <span>每人棋子数</span>
          <select value={pieces} onChange={(event) => setPieces(Number(event.target.value))}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} 枚
              </option>
            ))}
          </select>
        </label>
      )}

      <button className="primary" onClick={start}>
        {mode === 'create' ? '创建并进入' : '加入'}
      </button>

      <ThemeSwitcher />
    </div>
  )
}
