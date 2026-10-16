import { useGameStore } from '../store/gameStore'
import { Board } from './Board'
import { CardModal } from './CardModal'
import { CharacterPanel } from './CharacterPanel'
import { ConnBadge } from './ConnBadge'
import { DicePanel } from './DicePanel'
import { LookupModal } from './LookupModal'
import { PlayerList } from './PlayerList'
import { RacersBar } from './RacersBar'
import { RoomInfo } from './RoomInfo'
import { Scoreboard } from './Scoreboard'
import { Toolbar } from './Toolbar'
import { ThemeSwitcher } from './ThemeSwitcher'
import { TwistPanel } from './TwistPanel'
import { TwistReveal } from './TwistReveal'

export function Room() {
  const roomCode = useGameStore((s) => s.state?.roomCode ?? '')
  const round = useGameStore((s) => s.state?.round ?? 1)

  const copy = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => undefined)
  }

  return (
    <div className="room">
      <header className="room-header">
        <div className="brand">魔法运动会</div>
        <div className="room-code">
          房间码 <b>{roomCode}</b>
          <button className="link" onClick={copy}>
            复制
          </button>
        </div>
        <RoomInfo />
        <div className="round-badge">第 {round} / 4 轮</div>
        <CardModal />
        <LookupModal />
        <ThemeSwitcher />
        <ConnBadge />
      </header>

      <main className="room-body">
        <aside className="rail rail-left">
          <PlayerList />
          <CharacterPanel />
        </aside>

        <div className="board-area">
          <Board />
          <RacersBar />
          <div className="board-lower">
            <TwistPanel />
            <Scoreboard />
          </div>
        </div>

        <aside className="rail rail-right">
          <DicePanel />
          <Toolbar />
        </aside>
      </main>
      <TwistReveal />
    </div>
  )
}
