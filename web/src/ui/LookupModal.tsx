import { useEffect, useMemo, useState } from 'react'
import { TWIST_CARDS } from '../board/twistCards'

const TERMS: { term: string; def: string }[] = [
  { term: '主移动', def: '回合内「掷骰前进」的专属动作。很多技能只检测主移动。' },
  { term: '移动', def: '任何位置变化（瞬移/Warp 除外）。' },
  { term: '经过', def: '某次移动开始时你在对方身后、结束时在其身前（反向亦算）。' },
  { term: '同格', def: '两人都停下在同一格；只是途经不算同格。' },
  { term: '停下', def: '一次移动完成后落定的状态。' },
  { term: '摔倒', def: '跳过下一次主移动（用倒扣的指示物表示）。' },
  { term: '瞬移(Warp)', def: '直接换格，不算「移动」，不触发依赖移动的技能。' },
  { term: '领先/落后', def: '按与终点的距离判断；同格不分先后。' },
  { term: '独自一人', def: '该格上只有你一名运动员。' },
  { term: '领跑', def: '当前最靠近终点（尚未冲线）的运动员。' },
  { term: '末位', def: '当前最靠近起点的运动员（可并列）。' },
  { term: '超过', def: '某次动作开始时你在对方身后、结束时在其身前。' },
]

interface CharEntry {
  id: string
  name: string
  nameEn?: string
  skill: string
}

type Tab = 'glossary' | 'rules' | 'twist' | 'characters'

const TABS: { id: Tab; label: string }[] = [
  { id: 'glossary', label: '名词解释' },
  { id: 'rules', label: '规则' },
  { id: 'twist', label: '扭扭卡' },
  { id: 'characters', label: '角色' },
]

/** 「速查」按钮：把 名词解释 / 规则 / 扭扭卡 / 角色 合并到一个弹窗（均支持模糊查询处）。 */
export function LookupModal() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('glossary')
  const [twistQuery, setTwistQuery] = useState('')
  const [charQuery, setCharQuery] = useState('')
  const [chars, setChars] = useState<CharEntry[]>([])

  // 切到「角色」页时按需加载角色目录
  useEffect(() => {
    if (!open || tab !== 'characters' || chars.length > 0) {
      return
    }
    fetch(`${import.meta.env.BASE_URL}api/characters`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setChars(Array.isArray(data) ? (data as CharEntry[]) : []))
      .catch(() => setChars([]))
  }, [open, tab, chars.length])

  const twists = useMemo(() => {
    const q = twistQuery.trim().toLowerCase()
    if (!q) return TWIST_CARDS
    return TWIST_CARDS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.effect.toLowerCase().includes(q),
    )
  }, [twistQuery])

  const filteredChars = useMemo(() => {
    const q = charQuery.trim().toLowerCase()
    if (!q) return chars
    return chars.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameEn ?? '').toLowerCase().includes(q) ||
        c.skill.toLowerCase().includes(q),
    )
  }, [chars, charQuery])

  return (
    <>
      <button className="focus-btn" onClick={() => setOpen(true)}>
        速查
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal lookup-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>速查</h3>
              <button className="link" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>

            <div className="lookup-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`lookup-tab${tab === t.id ? ' active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'glossary' && (
              <dl className="glossary-list">
                {TERMS.map((t) => (
                  <div key={t.term} className="glossary-row">
                    <dt>{t.term}</dt>
                    <dd>{t.def}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tab === 'rules' && (
              <div className="rules-list">
                <section>
                  <h4>基本玩法</h4>
                  <ul>
                    <li>2–6 人，共 4 轮比赛。</li>
                    <li>开局：蛇形轮抽，每人 4 名角色。</li>
                    <li>每轮每人派 1 名上场；掷 1 颗骰，按点数前进（主移动）。</li>
                    <li>当有 2 名选手冲线，本轮结束；前 2 名得分（越往后分值越高）。</li>
                    <li>4 轮后总分最高者获胜。</li>
                  </ul>
                </section>

                <section>
                  <h4>赛道与功能格</h4>
                  <ul>
                    <li>四条赛道：温和 / 狂野 / 扭扭赛道 / 螺旋世界。</li>
                    <li>★：得 1 分；绊倒（TRIP）：跳过下次主移动。</li>
                    <li>前进 / 后退格：按格上的数字前进或后退（箭头随行进方向）。</li>
                    <li>扭扭格：第一名经过时，抽一张扭扭卡并执行。</li>
                    <li>螺旋格：停在其上，传送到与之连通的另一端。</li>
                  </ul>
                </section>

                <section>
                  <h4>结算要点</h4>
                  <ul>
                    <li>技能结算顺序：从赛道最前的玩家开始，按回合顺序顺时针结算。</li>
                    <li>「主移动」= 掷骰前进；「移动」含技能造成的位移。</li>
                    <li>重掷：上一次点数视作从未发生（不触发能力）。</li>
                    <li>死循环：结算一轮后终止；若全员无法移动，比赛立即结束（未冲线者不得剩余分数）。</li>
                  </ul>
                </section>

                <section>
                  <h4>第二部新增（Second Wind）</h4>
                  <ul>
                    <li>36 个新角色；可与第一部混玩。</li>
                    <li>混玩赛道顺序：温和 → 狂野 → 扭扭赛道 → 螺旋世界。</li>
                    <li>13 张扭扭卡（由扭扭格触发）。</li>
                    <li>扭扭卡抽取模式可切换：弃牌堆（抽过进弃牌，抽空重洗，不会立即重复）/ 放回重洗（抽出即放回混洗，可重复）。</li>
                    <li>变体（2–3 人）：可用 2 名角色，并可自由选择出场先后顺序。</li>
                  </ul>
                </section>
              </div>
            )}

            {tab === 'twist' && (
              <div className="twist-lookup">
                <input
                  className="lookup-input"
                  value={twistQuery}
                  placeholder="输入 卡名 / 英文名 / 效果关键词…"
                  onChange={(event) => setTwistQuery(event.target.value)}
                />
                <div className="twist-lookup-list">
                  {twists.map((c) => (
                    <div key={c.nameEn} className="twist-lookup-row">
                      <div className="twist-lookup-name">
                        {c.name}
                        <span className="twist-lookup-en">{c.nameEn}</span>
                      </div>
                      <div className="twist-lookup-effect">{c.effect}</div>
                    </div>
                  ))}
                  {twists.length === 0 && <div className="lookup-empty">无匹配卡牌</div>}
                </div>
              </div>
            )}

            {tab === 'characters' && (
              <div className="twist-lookup">
                <input
                  className="lookup-input"
                  value={charQuery}
                  placeholder="输入 中文名 / 英文名 / 技能关键词…"
                  onChange={(event) => setCharQuery(event.target.value)}
                />
                <div className="lookup-list">
                  {filteredChars.map((c) => (
                    <div key={c.id} className="lookup-row">
                      <div className="lookup-title">
                        <span className="lookup-name">{c.name}</span>
                        <span className="lookup-en">{c.nameEn ?? ''}</span>
                      </div>
                      <div className="lookup-skill">{c.skill}</div>
                    </div>
                  ))}
                  {chars.length > 0 && filteredChars.length === 0 && (
                    <div className="lookup-empty">无匹配角色</div>
                  )}
                  {chars.length === 0 && <div className="lookup-empty">加载中…</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
