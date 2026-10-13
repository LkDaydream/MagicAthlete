import { useGameStore } from '../store/gameStore'

/** 棋盘下方：展示每名玩家「本轮出战角色 + 技能」，方便查看。 */
export function RacersBar() {
  const players = useGameStore((s) => s.state?.players ?? [])
  const info = useGameStore((s) => s.state?.characterInfo ?? {})

  return (
    <div className="racers-bar">
      <div className="racers-title">本轮出战角色</div>
      <div className="racers-list">
        {players.length === 0 && <span className="racer-empty">等待玩家…</span>}
        {players.map((player) => {
          const cid = player.activeCharacterId
          const name = cid ? info[cid]?.name ?? cid : ''
          const skill = cid ? info[cid]?.skill ?? '' : ''
          return (
            <div key={player.id} className={`racer${cid ? '' : ' empty'}`}>
              <div className="racer-head">
                <span className="dot" style={{ background: player.color }} />
                <span className="racer-name">{player.name}</span>
              </div>
              <div className="racer-char">{name || '未选'}</div>
              {skill && <div className="racer-skill">{skill}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
