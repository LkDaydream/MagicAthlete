import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { CharacterSet } from '../protocol/messages'

/** 角色面板：展示每名玩家分到的角色与其技能，并标记每轮使用的角色。 */
export function CharacterPanel() {
  const state = useGameStore((s) => s.state)
  const myId = useGameStore((s) => s.playerId)
  const useCharacter = useGameStore((s) => s.useCharacter)
  const unuseCharacter = useGameStore((s) => s.unuseCharacter)
  const nextRound = useGameStore((s) => s.nextRound)
  const redeal = useGameStore((s) => s.redeal)
  const charSet = useGameStore((s) => s.state?.characterSet ?? 'mixed')
  const setCharacterSet = useGameStore((s) => s.setCharacterSet)
  const [expanded, setExpanded] = useState<string | null>(null)

  const players = state?.players ?? []
  const info = state?.characterInfo ?? {}
  const round = state?.round ?? 1
  const me = players.find((p) => p.id === myId)
  const others = players.filter((p) => p.id !== myId)
  const extras = me?.extras ?? []

  const nameOf = (id: string) => info[id]?.name ?? id
  const skillOf = (id: string) => info[id]?.skill ?? '—'

  return (
    <div className="panel">
      <div className="char-head">
        <h3>我的角色</h3>
        <div className="char-head-actions">
          <select
            className="char-set"
            value={charSet}
            title="角色池（切换后会重新发牌）"
            onChange={(event) => setCharacterSet(event.target.value as CharacterSet)}
          >
            <option value="gen1">一代</option>
            <option value="gen2">二代</option>
            <option value="mixed">混用</option>
          </select>
          <button onClick={nextRound} disabled={round >= 4}>
            下一轮
          </button>
          <button onClick={redeal}>重新发牌</button>
        </div>
      </div>

      <div className="char-list mine">
        {(me?.characters ?? []).map((cid) => {
          const used = me?.usedCharacters.includes(cid) ?? false
          const active = me?.activeCharacterId === cid
          return (
            <div key={cid} className={`char-card${active ? ' active' : ''}${used && !active ? ' used' : ''}`}>
              <div className="char-name">{nameOf(cid)}</div>
              <div className="char-skill">{skillOf(cid)}</div>
              {used ? (
                <div className="char-used-row">
                  <span className={`char-flag${active ? '' : ' muted'}`}>
                    {active ? '本轮使用中' : '已用'}
                  </span>
                  <button className="char-undo" onClick={() => unuseCharacter(cid)}>
                    撤销
                  </button>
                </div>
              ) : (
                <button className="char-use" onClick={() => useCharacter(cid)}>
                  本轮使用
                </button>
              )}
            </div>
          )
        })}
        {(me?.characters ?? []).length === 0 && <div className="char-empty">暂未发到角色</div>}
      </div>

      {extras.length > 0 && (
        <div className="char-extras">
          <div className="char-sub">附加能力（缝合怪）</div>
          {extras.map((cid) => (
            <div key={cid} className="char-extra">
              <b>{nameOf(cid)}</b> · {skillOf(cid)}
            </div>
          ))}
        </div>
      )}

      <div className="char-sub">其他玩家（点角色名看技能）</div>
      {others.length === 0 && <div className="char-empty">暂无其他玩家</div>}
      {others.map((player) => (
        <div key={player.id} className="char-other">
          <div className="char-other-name">
            <span className="dot" style={{ background: player.color }} />
            {player.name}
          </div>
          <div className="char-chips">
            {player.characters.map((cid) => (
              <button
                key={cid}
                className={`chip${player.activeCharacterId === cid ? ' active' : ''}${
                  player.usedCharacters.includes(cid) ? ' used' : ''
                }`}
                onClick={() => setExpanded(expanded === cid ? null : cid)}
              >
                {nameOf(cid)}
              </button>
            ))}
          </div>
          {expanded && player.characters.includes(expanded) && (
            <div className="char-skill small">{skillOf(expanded)}</div>
          )}
        </div>
      ))}
    </div>
  )
}
