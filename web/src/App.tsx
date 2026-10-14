import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { Lobby } from './ui/Lobby'
import { Room } from './ui/Room'

export default function App() {
  const init = useGameStore((s) => s.init)
  const joined = useGameStore((s) => s.joined)
  const error = useGameStore((s) => s.error)
  const notice = useGameStore((s) => s.notice)
  const theme = useGameStore((s) => s.theme)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app">
      {notice && <div className="notice-banner">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}
      {joined ? <Room /> : <Lobby />}
    </div>
  )
}
