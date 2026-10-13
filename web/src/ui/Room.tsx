import { useGameStore } from '../store/gameStore'
import { Board } from './Board'
import { CharacterPanel } from './CharacterPanel'
import { DicePanel } from './DicePanel'
import { Glossary } from './Glossary'
import { PlayerList } from './PlayerList'
import { RacersBar } from './RacersBar'
import { RoomInfo } from './RoomInfo'
import { Scoreboard } from './Scoreboard'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Toolbar } from './Toolbar'

export function Room() {
  const roomCode = useGameStore((s) => s.state?.roomCode ?? '')
  const round = useGameStore((s) => s.state?.round ?? 1)
  const players = useGameStore((s) => s.state?.players ?? [])
  const info = useGameStore((s) => s.state?.characterInfo ?? {})

  const copy = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => undefined)
  }

  return (
    <div className="room">
      <header className="room-header">
        <div className="brand">魔法运动员</div>
        <div className="room-code">
          房间码 <b>{roomCode}</b>
          <button className="link" onClick={copy}>
            复制
          </button>
        </div>
        <div className="round-badge">第 {round} / 4 轮</div>
        <ThemeSwitcher />
      </header>

      <div className="round-strip">
        <span className="round-strip-label">本轮出战</span>
        {players.length === 0 && <span className="rb-empty">等待玩家…</span>}
        {players.map((player) => {
          const active = player.activeCharacterId ? info[player.activeCharacterId]?.name ?? '' : ''
          return (
            <div key={player.id} className={`rb${player.connected ? '' : ' off'}`}>
              <span className="dot" style={{ background: player.color }} />
              <span className="rb-name">{player.name}</span>
              <span className={`rb-char${active ? '' : ' empty'}`}>{active || '未选'}</span>
              <span className="rb-score">{player.score}</span>
            </div>
          )
        })}
      </div>

      <main className="room-body">
        <aside className="rail rail-left">
          <Scoreboard />
          <PlayerList />
          <CharacterPanel />
        </aside>

        <div className="board-area">
          <Board />
          <RacersBar />
        </div>

        <aside className="rail rail-right">
          <DicePanel />
          <Toolbar />
          <RoomInfo />
          <Glossary />
        </aside>
      </main>
    </div>
  )
}
