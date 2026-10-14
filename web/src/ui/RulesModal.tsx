import { useState } from 'react'

/** 「规则查询」按钮：弹出游戏规则，方便玩家自查。 */
export function RulesModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="focus-btn" onClick={() => setOpen(true)}>
        规则查询
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal rules-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>游戏规则</h3>
              <button className="link" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
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
                  <li>变体（2–3 人）：可用 2 名角色，并可自由选择出场先后顺序。</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
