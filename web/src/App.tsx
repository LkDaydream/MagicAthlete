import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { Lobby } from './ui/Lobby'
import { Room } from './ui/Room'

export default function App() {
  const init = useGameStore((s) => s.init)
  const joined = useGameStore((s) => s.joined)
  const connected = useGameStore((s) => s.connected)
  const error = useGameStore((s) => s.error)
  const notice = useGameStore((s) => s.notice)
  const roomCode = useGameStore((s) => s.roomCode)
  const theme = useGameStore((s) => s.theme)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const statusText = connected ? '已连接' : roomCode ? '重连中…' : '连接中…'
  const statusClass = connected ? 'ok' : roomCode ? 'warn' : 'bad'

  return (
    <div className="app">
      <div className={`conn-badge ${statusClass}`}>{statusText}</div>
      {notice && <div className="notice-banner">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}
      {joined ? <Room /> : <Lobby />}
    </div>
  )
}
