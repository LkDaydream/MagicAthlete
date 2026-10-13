import { useState } from 'react'

const TERMS: { term: string; def: string }[] = [
  { term: '主移动', def: '回合内「掷骰前进」的专属动作。很多技能只检测主移动。' },
  { term: '移动', def: '任何位置变化（瞬移/Warp 除外）。' },
  { term: '经过', def: '某次移动开始时你在对方身后、结束时在其身前。' },
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

/** 名词解释：点术语看解释。 */
export function Glossary() {
  const [open, setOpen] = useState<string | null>(null)
  const current = TERMS.find((t) => t.term === open) ?? null

  return (
    <div className="panel">
      <h3>名词解释</h3>
      <div className="glossary-chips">
        {TERMS.map((t) => (
          <button
            key={t.term}
            className={open === t.term ? 'active' : ''}
            onClick={() => setOpen(open === t.term ? null : t.term)}
          >
            {t.term}
          </button>
        ))}
      </div>
      {current && (
        <div className="glossary-def">
          <b>{current.term}</b>：{current.def}
        </div>
      )}
    </div>
  )
}
