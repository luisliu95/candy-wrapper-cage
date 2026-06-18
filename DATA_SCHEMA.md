# 《糖纸牢笼》数据文件架构文档

> 10 个 JSON 数据文件 + 2 个引擎文件 + 1 个类型定义  
> 总计 4131 行代码，一人可维护

---

## 文件总览

| # | 文件 | 行数 | 格式 | 说明 |
|---|------|------|------|------|
| 1 | `dialogues.json` | 1398 | `Record<id, StoryNode>` | 全部剧情对话（138 个节点） |
| 2 | `scenes.json` | 443 | `Record<roomId, Room>` | 4 个房间 + 热区定义 |
| 3 | `fakeMessages.json` | 387 | `Record<chapter, ChapterMessages>` | SugarEcho 伪造消息模板池 |
| 4 | `items.json` | 149 | `Record<id, Item>` | 18 个物品 |
| 5 | `puzzles.json` | 114 | `Record<id, Puzzle>` | 6 个谜题 |
| 6 | `leafletMethods.json` | 98 | `SteganMethod[]` | 4 种传单隐写方式 |
| 7 | `prologue.json` | 82 | `PrologueFrame[]` | 8 帧序章动画 |
| 8 | `memoryFragments.json` | 82 | `MemoryFragment[]` | 8 个记忆碎片 |
| 9 | `endings.json` | 79 | `Record<id, Ending>` | 3 个结局 |
| 10 | `recipes.json` | 37 | `CraftRecipe[]` | 5 个组合配方 |

**引擎文件：**
- `gameStore.ts`（745 行）— Zustand 状态管理
- `sugarEchoEngine.ts`（214 行）— SugarEcho 消息选择引擎
- `game.ts`（303 行）— TypeScript 类型定义

---

## 1. dialogues.json — 剧情对话

**格式：** `Record<string, StoryNode>`（138 个节点）

```jsonc
{
  "node_id": {
    "id": "node_id",           // 唯一 ID
    "chapter": 1,              // 所属章节 1-4
    "speaker": "美杜莎",       // 说话人
    "text": "对话文本",        // ≤80字
    "next": "next_node_id",    // 下一节点
    "choices": [...],          // 选项（与 next 互斥）
    "trigger": {...},          // 触发效果
    "enterRoom": "room_id",   // 进入房间探索
    "checkEnding": true,       // 到此节点检查结局
    "background": "bg_key"     // 切换背景
  }
}
```

### StoryChoice（选项）
```jsonc
{
  "text": "选项文本",
  "next": "target_node_id",
  "require": "item_id",       // 需要持有物品
  "requireFlag": "flag_name", // 需要标记
  "trigger": {
    "evidence": 2,
    "alert": -1,
    "trust_medusa": 15,
    "trust_xuheng": 10,
    "trust_qiaoqing": 10,
    "setFlag": "flag_name",
    "setFlags": ["flag1", "flag2"],
    "addItem": "item_id",
    "addMemory": "memory_id",
    "triggerSugarEcho": true,
    "triggerLeaflet": true
  }
}
```

### 与 Zustand 对应
- `trigger.evidence` → `gameStore.evidence`
- `trigger.alert` → `gameStore.alert`（clamp 0-100）
- `trigger.trust_*` → `gameStore.trust_*`（clamp 0-100）
- `trigger.setFlag` → `gameStore.flags[]`
- `trigger.addItem` → `gameStore.inventory[]`
- `trigger.addMemory` → `gameStore.memoryFragments[]`
- `enterRoom` → `gameStore.phase = 'topdown'`
- `checkEnding` → `gameStore.checkEnding()`

### 与 Phaser 对应
- `enterRoom` 值对应 `scenes.json` 的房间 ID

### 与 React UI 对应
- `speaker` → `DialogBox` 说话人标签
- `text` → `DialogBox` 打字机文本
- `choices` → `ChoicePanel` 选项按钮

---

## 2. scenes.json — 房间与交互热区

**格式：** `Record<string, Room>`（4 个房间）

```jsonc
{
  "ch1_dorm": {
    "id": "ch1_dorm",
    "chapter": 1,
    "name": "粉色宿舍",
    "description": "房间描述",
    "background": "CSS渐变",
    "playerSpawn": { "x": 50, "y": 70 },  // 百分比坐标
    "hotspots": [...],                      // 交互区域列表
    "exitTo": "dialogue_node_id"            // 退出跳转
  }
}
```

### Hotspot（交互区域）
```jsonc
{
  "id": "ch1_bed",
  "x": 3, "y": 20, "w": 22, "h": 28,     // 百分比定位
  "label": "莫妮卡的床",
  "description": "调查描述",
  "icon": "🛏️",
  // Phaser 专用
  "interactionRadius": 55,
  "interactionType": "investigate",         // investigate|pickup|talk|puzzle|exit
  "promptText": "调查床铺",
  "spriteColor": 16751001,
  "blocked": true,
  // 交互效果
  "itemId": "sticky_note_m",               // 拾取物品
  "puzzleId": "ch1_drawer_puzzle",          // 打开谜题
  "dialogueId": "ch1_phone_echo",           // 跳转对话
  "storyJump": "ch1_exit_dorm",            // 剧情跳转
  "requireFlag": "door_unlocked",          // 前置标记
  "requireItem": "rusty_key",              // 前置物品
  "usedFlag": "picked_sticky_note",        // 使用后标记
  "trigger": { "evidence": 1 },            // 触发效果
  "maxAlert": 65,                          // 警戒上限（超过不可用）
  "multiDescriptions": [...]                // 多次调查不同描述
}
```

### 与 Zustand 对应
- `maxAlert` → `gameStore.alert` 检查
- `requireFlag` → `gameStore.flags` 检查
- `trigger` → `gameStore.applyTrigger()`
- `usedFlag` → `gameStore.usedHotspots`

### 与 Phaser 对应
- `x,y,w,h` → Phaser 实体位置
- `interactionRadius` → E 键检测半径
- `spriteColor` → 实体渲染颜色
- `blocked` → 碰撞体
- `promptText` → 接近时显示提示

### 与 React UI 对应
- `label` + `description` → `PhaserRoom` 弹窗
- `multiDescriptions` → 多次调查文本轮换

---

## 3. fakeMessages.json — SugarEcho 伪造消息

**格式：** 按章节分层 + 条件池

```jsonc
{
  "chapter_1": {
    "base": [FakeMessage, ...],              // 基础池
    "high_evidence": [FakeMessage, ...],     // 高证据时
    "high_alert": [FakeMessage, ...],        // 高警戒时
    "previously_detected": [FakeMessage, ...], // 多次被识破后
    "many_memories": [FakeMessage, ...],     // 记忆碎片多时
    "has_sticky_note": [FakeMessage, ...]    // 持有特定物品时
  },
  "flaw_types": { "punctuation": "标点习惯", ... }
}
```

### FakeMessage
```jsonc
{
  "id": "c1_base_1",
  "sender": "莫妮卡",
  "text": "消息文本",
  "timestamp": "18:42",
  "flaw": "preference",            // 漏洞类型 key
  "flawHint": "识破后的提示",
  "flawDetail": "SugarEcho 内部日志",
  "difficulty": 2,                  // 1-3 识别难度
  "rewardMemory": "mem_id",        // 识破后获得记忆碎片
  "rewardEvidence": 4,             // 自定义证据奖励（默认3）
  "echoNote": "SugarEcho 内心独白", // UI 展开显示
  "category": "preference"          // 分类标签
}
```

### 20 种漏洞类型
`punctuation` `preference` `official` `secret_code` `betrayal` `memory` `fact` `logic` `contradiction` `manipulation` `reference` `identity` `awareness` `pattern` `promise` `gaslighting` `cover_up` `glitch` `vocabulary` `tone`

### 与 Zustand 对应
- `sugarEchoEngine.ts` 根据 `GameSnapshot` 选择消息
- `GameSnapshot` 包含：chapter, evidence, alert, trust_*, flags, inventory, memoryFragments, detectedCount
- 识破奖励 → `gameStore.evidence` + `gameStore.memoryFragments`
- 错判惩罚 → `gameStore.alert`

### 与 React UI 对应
- `SugarEchoScreen.tsx`：手机模拟、漏洞选择、难度标签、内心独白

---

## 4. items.json — 物品

**格式：** `Record<string, Item>`（18 个物品）

```jsonc
{
  "sticky_note_m": {
    "id": "sticky_note_m",
    "name": "美杜莎的便利贴",
    "description": "A号床枕头下的便利贴...",
    "icon": "📝",
    "chapter": 1,
    "category": "evidence",      // evidence|key|tool|document|personal
    "combinable": true           // 是否可参与组合（可选）
  }
}
```

### 与 Zustand 对应
- `gameStore.inventory[]` 存储 item ID
- `gameStore.addItem()` / `gameStore.removeItem()` / `gameStore.hasItem()`

### 与 React UI 对应
- `Inventory.tsx`：icon + name + description

---

## 5. puzzles.json — 谜题

**格式：** `Record<string, Puzzle>`（6 个谜题）

```jsonc
{
  "ch1_drawer_puzzle": {
    "id": "ch1_drawer_puzzle",
    "chapter": 1,
    "title": "书桌抽屉密码锁",
    "description": "谜题描述",
    "type": "input",              // input|choice|sequence
    "options": ["A", "B", "C"],   // choice 类型用
    "answer": "12011",
    "hint": "提示文本",
    "successNode": "ch1_drawer_opened",
    "failNode": "ch1_drawer_fail",
    "reward": { "evidence": 2 },  // 成功触发
    "maxAttempts": 3
  }
}
```

### 与 Zustand 对应
- `gameStore.openPuzzle()` / `gameStore.solvePuzzle()` / `gameStore.closePuzzle()`
- `successNode` / `failNode` → `gameStore.goToNode()`

### 与 React UI 对应
- `PuzzleModal.tsx`：输入框 / 选择按钮

---

## 6. memoryFragments.json — 记忆碎片

**格式：** `MemoryFragment[]`（8 个碎片）

```jsonc
{
  "id": "mem_no_period",
  "chapter": 1,
  "title": "没有句号的人",
  "icon": "💬",
  "description": "碎片描述（2-3行）",
  "quote": "「莫妮卡的感悟引语」",
  "evidenceBonus": 2,             // 获得时 +evidence
  "obtainedFrom": "获取来源说明"
}
```

### 8 个碎片列表
| ID | 章节 | 标题 | 证据 | 获取方式 |
|----|------|------|------|---------|
| `mem_no_period` | 1 | 没有句号的人 | +2 | 醒来回忆（自动） |
| `mem_wrong_password` | 1 | 错误暗号 | +2 | 查看手机后的林夏账号对比 |
| `mem_strawberry_hate` | 2 | 讨厌草莓奶油 | +2 | 认出林夏画风（自动） |
| `mem_timed_draft` | 2 | 定时草稿 | +3 | 第四章进入机房前独白 |
| `mem_pause_pattern` | 3 | 停顿的节拍 | +2 | 美空推荐林夏食谱（自动） |
| `mem_meikong_slip` | 3 | 美空的真名 | +3 | 照片墙/MK-01终端 |
| `mem_echo_fear` | 4 | SugarEcho 的恐惧 | +3 | SugarEcho 对话选择 |
| `mem_last_message` | 4 | 最后的真话 | +3 | 服务器机柜热区 |

### 与 Zustand 对应
- `gameStore.memoryFragments[]` 存储已获得 ID
- `gameStore.addMemoryFragment()` → evidence + message
- `gameStore.getMemoryCount()` → 结局判定

### 与 React UI 对应
- `MemoryPanel.tsx`：左下角 🧠 按钮 + 收集面板

---

## 7. endings.json — 结局

**格式：** `Record<string, Ending>`（3 个结局）

```jsonc
{
  "ending_true_echo": {
    "id": "ending_true_echo",
    "title": "🕊️ 真实回声",
    "subtitle": "你证明了一件事：你是你自己。",
    "description": "结局场景描述",
    "epilogue": "后日谈文本",
    "lastMessage": "最后一条手机消息",
    "npcEpilogues": {
      "medusa_high": "高羁绊后日谈",
      "medusa_mid": "中羁绊后日谈",
      "medusa_low": "低羁绊后日谈",
      "xuheng_high": "...",
      "xuheng_mid": "...",
      "xuheng_low": "...",
      "qiaoqing_high": "...",
      "qiaoqing_mid": "...",
      "qiaoqing_low": "..."
    },
    "condition": {
      "minEvidence": 12,
      "maxAlert": 65,
      "minHighBondCount": 2,
      "minMemoryFragments": 3,
      "hasFlags": ["medusa_joined", "qiaoqing_joined"]
    },
    "priority": 10
  }
}
```

### 结局判定逻辑（priority 从高到低）
```
真实回声(10): evidence≥12 AND alert≤65 AND highBond≥2 AND memories≥3
纸门之后(5):  evidence≥5
完美替身(1):  兜底（evidence≤5 或以上都不满足）
```

### EndingCondition 支持的字段
`minEvidence` `maxEvidence` `minAlert` `maxAlert` `minTrustMedusa` `maxTrustMedusa` `minTrustXuheng` `maxTrustXuheng` `minTrustQiaoqing` `maxTrustQiaoqing` `hasFlag` `hasFlags` `hasItem` `minMemoryFragments` `minHighBondCount`

### 与 Zustand 对应
- `gameStore.checkEnding()` 按 priority 匹配
- `npcEpilogues` key 格式：`{npc}_{bondLevel}`，由 `getBondLevel()` 决定

### 与 React UI 对应
- `EndingScreen.tsx`：标题、subtitle、描述/后日谈切换、NPC 后日谈按钮、最后一条消息手机模拟

---

## 8. prologue.json — 序章动画

**格式：** `PrologueFrame[]`（8 帧）

```jsonc
{
  "id": "pro_1",
  "bg": "city_night",      // CSS 背景效果 key
  "bgColor": "#0a0a1e",
  "icon": "🌙",
  "speaker": null,          // null = 旁白
  "text": "三个月前。",
  "subtext": "城市边缘，深夜",  // 副文本（可选）
  "duration": 4000           // 自动翻页毫秒
}
```

### 与 React UI 对应
- `Prologue.tsx`：全屏动画，点击/自动翻页，可跳过

---

## 9. recipes.json — 组合配方

**格式：** `CraftRecipe[]`（5 个配方）

```jsonc
{
  "id": "recipe_door_code",
  "materials": ["leaflet_fragment", "purple_candy_wrap"],
  "result": "door_passcode",
  "description": "组合描述",
  "trigger": { "evidence": 2, "setFlag": "crafted_door_code" }
}
```

### 与 Zustand 对应
- `gameStore.tryCombine()` 匹配材料
- `gameStore.combineSlots[]` 临时存储选中物品

---

## 10. leafletMethods.json — 传单隐写

**格式：** `SteganMethod[]`（4 种方式）

```jsonc
{
  "id": "strawberry_coords",
  "name": "草莓籽坐标",
  "icon": "🍓",
  "description": "玩法说明",
  "flavor": "氛围文案",
  "baseSuccessRate": 70,
  "evidenceReward": 3,
  "alertRisk": 2,
  "bonusItem": "escape_map",
  "bonusRate": 15,
  "medusaHintThreshold": 30,    // trust_medusa ≥ 此值显示提示
  "medusaHint": "美杜莎建议",
  "qiaoBonusFlag": "qiao_gifted_component",  // 乔青加成
  "qiaoBonusRate": 10,
  "qiaoBonusHint": "乔青加成说明",
  "scanPhases": ["扫描阶段1", "扫描阶段2", "扫描阶段3"],
  "successText": "成功文案",
  "failText": "失败文案"
}
```

### 实际成功率计算
```
rate = baseSuccessRate
  + (hasItem(bonusItem) ? bonusRate : 0)
  + (hasFlag(qiaoBonusFlag) ? qiaoBonusRate : 0)
  + (evidence >= 8 ? 5 : 0)
  - (alert >= 70 ? 25 : alert >= 40 ? 15 : alert >= 5 ? 5 : 0)
clamp(5, 95)
```

---

## 核心状态（gameStore.ts）

| 状态 | 类型 | 范围 | 影响 |
|------|------|------|------|
| `evidence` | number | 0+ | 结局判定、SugarEcho 消息选择 |
| `alert` | number | 0-100 | 热区锁定、传单成功率、UI滤镜、结局 |
| `trust_medusa` | number | 0-100 | 羁绊等级(low/mid/high)、NPC后日谈 |
| `trust_xuheng` | number | 0-100 | 同上 |
| `trust_qiaoqing` | number | 0-100 | 同上 |
| `flags` | string[] | — | 剧情分支条件 |
| `inventory` | string[] | — | 物品持有 |
| `memoryFragments` | string[] | — | 碎片收集、结局判定 |
| `fakeMessageHistory` | array | — | SugarEcho 识破记录 |
| `chapter` | 1-4 | — | 当前章节 |
| `phase` | GamePhase | 8种 | UI 路由 |

### 等级计算
```
BondLevel: 0-39=low, 40-69=mid, 70-100=high
AlertLevel: 0-39=low, 40-69=mid, 70-100=high
```

---

## 兼容性说明

### 无需新建的文件
以下功能已整合在现有文件中，**不需要**独立的 JSON：

| 提议文件 | 实际位置 | 原因 |
|----------|---------|------|
| `npcBondEvents.json` | `dialogues.json` 中的 `ch*_medusa_bond_*` / `ch*_qiao_bond_*` 节点 | 羁绊事件就是特殊的对话节点 |
| `alertEvents.json` | `gameStore.ts` 中的 `getAlertLevel()` + `pixel.css` 中的 `.alert-*` 样式 | 警戒影响是逻辑+样式，不是数据 |
| `interactions.json` | `scenes.json` 中的 `hotspots[]` | 交互区域已在房间定义中 |
| `quests.json` | `dialogues.json` 中的 `trigger.setFlag` + `requireFlag` | 任务通过 flag 链实现 |

### 向后兼容保证
- 所有新增字段（`maxAlert`, `difficulty`, `rewardMemory`, `echoNote`, `subtitle`, `lastMessage`）都是**可选字段**
- 旧数据缺少新字段时使用默认值：`difficulty=1`, `rewardEvidence=3`, `maxAlert=undefined`（不限制）
- `clamp100()` 函数确保信任值和警戒值永远在 0-100 范围内

---

## 关键 flag 索引

| Flag | 设置章节 | 用途 |
|------|---------|------|
| `discovered_echo_system` | Ch1 | 发现 SugarEcho 替你发消息 |
| `medusa_joined` | Ch1 | 美杜莎加入队伍 |
| `qiaoqing_joined` | Ch2 | 乔青加入队伍 |
| `united_team` | Ch3 | 三人团结 |
| `medusa_showed_blindspots` | Ch1 | 美杜莎标记监控盲区 |
| `has_patrol_map` | Ch2 | 获得巡逻路线图 |
| `qiao_gifted_component` | Ch2 | 乔青给了零件 |
| `qiao_upgraded_antenna` | Ch3 | 天线已改装 |
| `heard_tape` | Ch3 | 听过录音磁带 |
| `broadcast_ready` | Ch3 | 广播设备就绪 |
| `unlocked_terminal` | Ch4 | 终端已解锁 |
| `confirmed_meikong_is_linxia` | Ch4 | 确认美空=林夏 |
| `meikong_will_help` | Ch4 | 美空承诺帮助 |
| `confronted_sugarecho` | Ch4 | 与 SugarEcho 对话 |
