# 魔法运动会 · 联机棋盘（Magical Athlete Web）

桌游《Magical Athlete（魔法运动会 / 胡闹运动会）》的 Web 联机版：**可交互棋盘 + 实时同步**，方便朋友异地联机游玩。

> **设计定位：中继服务器 + 人工裁定。**
> 程序只提供**游玩工具**（棋盘、棋子、骰子、角色牌、扭扭卡、计分等）与状态同步，
> **不实现、不校验、不推进任何游戏规则**；先手、淘汰、名次、回合、技能结算等一律由玩家连麦自行裁定。

## 功能一览

- **棋盘**：四条赛道（温和 / 狂野 / 扭扭赛道 / 螺旋世界）可切换；拖拽棋子吸附落格；同格自动错开；格子改色（用于标记，如皮纳塔分数标记）；撤回 / 重置。
- **骰子**：一次掷 1–6 颗；手动改点；隐藏 / 揭晓（如骗人豹）；最近 30 次掷骰记录。
- **棋子**：新增棋子 / 新增 NPC（可命名、自动异色）；移除；**绊倒 / 摔倒标记**。
- **角色**：开局发牌（**随机发牌** / **卡池抽选**，张数可调）；角色池（一代 / 二代 / 混用）；本轮使用 / 撤销；抽牌（可一次多张，如蛋抽 3 选 1）；**自选角色卡**（测试/自定义）；替换出战；附加能力（缝合怪）；交换操控权（狸猫换太子）。
- **扭扭卡**：抽取模式（**弃牌堆** / **放回重洗**）可切换；抽卡动画（防剧透）；**牌堆 / 弃牌堆 / 抽取记录**查看。
- **计分**：分数加减 / 清零。
- **速查**：名词解释 / 规则 / 扭扭卡 / 角色（均支持模糊查询）。
- **其他**：房间码分享、断线重连、主题切换、音效。

## 技术栈

- 后端：Java 17 · Spring Boot 3 · WebSocket（内存房间，权威中继同步）
- 前端：React 18 · TypeScript · Vite · zustand · SVG 棋盘

## 运行

```bash
# 1) 构建前端 + 打包后端
./mvnw clean package -DskipTests        # Windows: .\mvnw.cmd clean package -DskipTests

# 2) 启动
java -jar target/magical-athlete-0.0.1-SNAPSHOT.jar

# 3) 浏览器打开
#    http://localhost:8080
```

> 前端构建产物会输出到 `src/main/resources/static`（该目录被 `.gitignore` 忽略，打包时由构建重新生成）。
> **异地联机**：把 8080 端口通过 **Cloudflare Tunnel / frp** 等工具穿透即可（服务器为权威中继，无需"房主"在线）。

### 前端单独开发

```bash
cd web
npm install
npm run dev     # 开发（Vite）
npm run build   # 构建（产物输出到 ../src/main/resources/static）
```

## 目录结构

```
├── src/main/java/bughunted/magicalathlete
│   ├── room/            # 房间 / 玩家 / 棋子 / 角色目录
│   └── ws/              # WebSocket 中继处理器
├── src/main/resources
│   ├── characters.json  # 72 名角色（一代 36 + 二代 36）
│   └── static/          # 前端构建产物（git 忽略）
├── web/                 # React 前端
│   └── src/{board,ui,store,net,protocol}
└── docs/                # 规则 / 角色 / 赛道文档
```

## 规则文档

- 第一部：`docs/game-rules.md`、`docs/characters.md`、`docs/track.md`
- 第二部《Second Wind》：`docs/game-rules-second-wind.md`、`docs/characters-second-wind.md`、`docs/track-second-wind.md`

> ⚠️ 角色 / 扭扭卡等资料多为**社区整理、非官方**，最终以实体规则书为准。

## 说明

- 本移植**只提供工具，不做规则判定**；某些"标记 / 名次"等需求直接用现有工具表达——例如皮纳塔的"每格放 1 枚分数标记"用「格子改色」，淘汰用「移回起点 / 移除棋子」。
- 扭扭卡的牌堆机制（弃牌堆 / 放回重洗）官方规则尚未公开，因此做成**可切换**以适配不同理解。
