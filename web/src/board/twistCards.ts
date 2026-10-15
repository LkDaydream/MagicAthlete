export interface TwistCard {
  name: string
  nameEn: string
  effect: string
}

/** Second Wind 扭扭卡（13 张）：由「扭扭格」触发，抽到即结算。 */
export const TWIST_CARDS: TwistCard[] = [
  {
    name: '时间小恶魔',
    nameEn: 'Time Imp',
    effect: '触发此效果的选手被淘汰，但会作为该玩家的额外选手，参加下一场比赛。',
  },
  {
    name: '炼金实验室收容泄露',
    nameEn: 'Alchemy Lab Containment Breach',
    effect: '把【大嘴狼人】放到起点；从此刻起，每个玩家回合结束时都掷骰移动它，被它超过的选手直接淘汰。',
  },
  {
    name: '终点线虫虫泛滥',
    nameEn: 'Bonkbug Infestation',
    effect: '当选手停在最后两格中的任意一格时，向后移动 5 格。',
  },
  {
    name: '预言池旁禁止奔跑',
    nameEn: 'No Running by the Scrying Pool',
    effect: '任何选手在主要移动阶段移动 6 格及以上，该选手直接淘汰。',
  },
  {
    name: '皮纳塔糖果掉落',
    nameEn: 'The Piñata Is Leaking',
    effect: '在第一个拐弯后的所有空格上各放 1 枚分数标记；选手停在带标记的格子时获得该标记。',
  },
  {
    name: '传送带启动',
    nameEn: 'The Conveyor Belt Is On',
    effect: '将所有选手传送至起点后第一格；所有选手基础移动 +3。',
  },
  {
    name: '全员诅咒',
    nameEn: 'Curse Wands for Everyone',
    effect: '每位玩家回合结束后投 1 枚骰子，按回合顺序跳过对应数量的玩家。',
  },
  {
    name: '季终决赛',
    nameEn: 'Season Finale',
    effect: '第 1 名与第 2 名展开 1v1 对决，争夺全部分数；从第二个拐弯开始，由当前第 1 名先行。',
  },
  {
    name: '旧货集市',
    nameEn: 'Swap Meet',
    effect: '所有玩家抽取 1 名新选手，可以选择用新选手替换自己当前的选手（同时决定）。',
  },
  {
    name: '随机性随机终止',
    nameEn: 'Randomness Has Randomly Ceased',
    effect: '所有玩家掷一次骰子；本局剩余所有需要掷骰的场合，都只能使用这次掷出的点数。',
  },
  {
    name: '地上烤鸡',
    nameEn: 'Roast Chicken on the Ground',
    effect: '排名最后的选手移动 7 格（并列最后则全部获得）。',
  },
  {
    name: '观众渴求混乱',
    nameEn: 'The Fans Demand Chaos',
    effect: '抽取 2 张扭扭卡，按顺序结算两张卡的效果。',
  },
  {
    name: '镜像世界假说实锤',
    nameEn: 'Mirror World Theory Confirmed',
    effect: '赛道行进方向反转。',
  },
]
