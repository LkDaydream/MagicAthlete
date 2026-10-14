import { useState } from 'react'

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

/** 「名词解释」按钮：点击弹出全部名词与解释。 */
export function Glossary() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="focus-btn" onClick={() => setOpen(true)}>
        名词解释
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>名词解释</h3>
              <button className="link" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            <dl className="glossary-list">
              {TERMS.map((t) => (
                <div key={t.term} className="glossary-row">
                  <dt>{t.term}</dt>
                  <dd>{t.def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  )
}
