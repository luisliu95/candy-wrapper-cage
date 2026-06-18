# 《糖纸牢笼》回归测试清单

> 升级版本：序章 + 林夏线 + 记忆碎片 + 羁绊系统 + 警戒系统 + SugarEcho v2 + 三结局  
> 测试环境：`npm run dev` → `http://localhost:5173`

---

## 一、序章系统

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 1.1 | 序章自动播放 | 点击「新游戏」 | 8 帧序章画面依次播放，每帧 4-7 秒自动翻页 | 某帧不自动翻页 | 检查 `prologue.json` 中 duration 是否为正整数 |
| 1.2 | 序章点击翻页 | 序章播放中点击屏幕 | 立即跳到下一帧 | 点击无反应 | 检查 `Prologue.tsx` 的 onClick 绑定 |
| 1.3 | 序章跳过 | 点击右下角「跳过」按钮 | 直接进入第一章 | 跳过后画面残留 | 确认 `onComplete` 调用了 `startGame()` |
| 1.4 | 序章→第一章衔接 | 等序章自然播完或跳过 | phase 变为 `story`，显示「你在一阵刺鼻的甜味中醒来」 | 黑屏 | 检查 `App.tsx` 中 phase 判断逻辑 |
| 1.5 | 序章 JSON 完整性 | — | `prologue.json` 共 8 条记录，每条都有 id/text/duration | JSON 解析失败 | 运行 `python3 -m json.tool src/data/prologue.json` |

---

## 二、林夏背景线与莫妮卡来历

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 2.1 | 醒来回忆 | 进入第一章，观看前 5 个对话 | 出现「糖纸观察室」「林夏失踪」的回忆文本 + 获得 `mem_no_period` | 节点跳转断裂 | 检查 `ch1_wake_remember` 的 next 链 |
| 2.2 | 手机林夏账号 | Ch1 房间中查看「旧手机」 | 显示林夏草莓奶昔动态 → 莫妮卡内心独白 → 获得 `mem_wrong_password` | dialogueId 未触发 | 检查热区 `ch1_old_phone` 的 dialogueId |
| 2.3 | Ch2 林夏画风 | 进入第二章 | 自动出现莫妮卡认出林夏插画的内心独白 → 获得 `mem_strawberry_hate` | 碎片未获得 | 检查 `ch2_monika_observe_2` 的 addMemory |
| 2.4 | Ch3 照片墙 | Ch3 房间查看「照片墙」 | 显示林夏编号 0023，可选择「美空就是林夏？」→ 获得 `mem_meikong_slip` | 选项未出现 | 检查 `ch3_photo_linxia_choice` |
| 2.5 | Ch4 MK-01 终端 | Ch4 解锁终端后查看「MK-01 日志」 | 揭示美空=林夏 23% 人格残片，可选择与美空对话 | 热区 requireFlag 未满足 | 确认 `unlocked_terminal` flag 已设置 |

---

## 三、私人记忆碎片

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 3.1 | 碎片获得提示 | 触发任意 addMemory | 屏幕顶部显示「🧠 记忆碎片：xxx（证据 +N）」 | 提示不显示 | 检查 `addMemoryFragment()` 中的 set message |
| 3.2 | 碎片面板 | 点击左下角 🧠 按钮 | 弹出面板，显示已收集/未收集碎片网格 | 按钮不可见 | 检查 `MemoryPanel.tsx` 的 z-index |
| 3.3 | 碎片不重复 | 同一碎片触发两次 | 第二次不重复添加，不重复加证据 | 证据重复累加 | 检查 `addMemoryFragment` 的 includes 判断 |
| 3.4 | 碎片详情 | 面板中点击已收集碎片 | 显示标题/描述/引语/来源 | 详情不展开 | 检查 `MemoryPanel` 的 active 状态 |
| 3.5 | 碎片存档 | 获得碎片后存档 → 刷新 → 读档 | memoryFragments 恢复 | 读档后碎片丢失 | 检查 `saveGame/loadGame` 是否包含 memoryFragments |
| 3.6 | 8 个碎片全收集 | 完整流程收集 8 个 | 面板显示 8/8，进度条满 | 某碎片路径断裂 | 按 `DATA_SCHEMA.md` 碎片表逐一验证 |

---

## 四、NPC 羁绊值系统

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 4.1 | 信任值变化 | Ch1 选择「这里是什么地方？」 | 状态栏美杜莎信任 +15 | 值未变化 | 检查 choice 的 trigger.trust_medusa |
| 4.2 | 信任值上限 | 通过多次选择累加超过 100 | 信任值 clamp 在 100 | 超过 100 | 检查 `clamp100()` |
| 4.3 | 负面选择降信任 | 选择「别挡路」 | 美杜莎信任 -10 | 值变为负数 | 检查 clamp 下限为 0 |
| 4.4 | 羁绊等级颜色 | 信任值到达 40 / 70 | 状态栏颜色变为金色 / 粉色 | 颜色不变 | 检查 `StatusBar.tsx` 的 BOND_COLORS |
| 4.5 | 高羁绊解锁 | Ch2 美杜莎信任≥一定值时选择「能画给我看吗」 | 获得巡逻路线图 + `has_patrol_map` flag | 选项不可选 | 检查 requireFlag 条件 |
| 4.6 | 高羁绊掩护 | Ch2 走高警戒路线 + 已获得盲区信息 | 美杜莎拽你进盲区，alert -1 | 选项不出现 | 检查 `medusa_showed_blindspots` flag |
| 4.7 | Ch4 高羁绊帮助 | 进入 Ch4 时有 `has_patrol_map` flag | 美杜莎给机房摄像头图 + `medusa_will_stall` | — | — |

---

## 五、alert 警戒值系统

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 5.1 | 警戒等级显示 | alert 达到 40 | 状态栏显示橙色 + 「警惕」标签 | 标签不显示 | 检查 `StatusBar` 的 alertLevel 判断 |
| 5.2 | 高警戒 UI | alert 达到 70 | 状态栏红色脉冲 + 场景红色滤镜 | CSS 不生效 | 检查 `.alert-high` 类是否添加到 game-container |
| 5.3 | 美空广播 | alert 从低→中 | 自动弹出美空广播条「加强巡逻」 | 广播不弹出 | 检查 `StatusBar` 的 useEffect 等级变化检测 |
| 5.4 | 热区锁定 | alert > 65 时尝试操作铁皮柜 | 弹窗显示「警戒太高，无法操作」 | 仍可操作 | 检查 `triggerInteraction` 的 maxAlert 判断 |
| 5.5 | 高羁绊抵消 | alert > 65 但有高羁绊NPC | 显示「同伴掩护」+ 允许操作（+15容错） | 容错未生效 | 检查 `getHighBondCount()` 是否正确 |
| 5.6 | 传单成功率降低 | alert ≥ 40 时进入传单隐写 | 简报显示「中警戒，成功率 -15%」 | 提示不显示 | 检查 `LeafletGame` 的警戒警告 |
| 5.7 | SugarEcho 删证据 | alert ≥ 70 时触发 SugarEcho | 显示「SugarEcho 反制，证据 -N」 | 证据未减少 | 检查 `triggerSugarEcho` 中 alert≥70 分支 |
| 5.8 | 警戒值上限 | 多次触发 alert 增加 | clamp 在 100 | 超过 100 | 检查 `clamp100()` |

---

## 六、SugarEcho 消息系统

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 6.1 | 章节过渡触发 | Ch1→Ch2 过渡 | 自动进入 SugarEcho 审查界面 | 未触发 | 检查 `ch1_to_ch2` 的 triggerSugarEcho |
| 6.2 | 消息显示 | SugarEcho 界面 | 手机模拟 + 打字机效果 + 消息文本 | 文本不显示 | 检查 `currentFakeMessage` 是否非 null |
| 6.3 | 难度标签 | 显示消息 | 底部显示「识别难度：普通/中等/极难」 | 标签缺失 | 检查 msg.difficulty 是否存在 |
| 6.4 | 内心独白 | 点击「SugarEcho 内部日志」 | 展开 echoNote 文本 | 按钮不可见 | 检查 msg.echoNote 是否存在 |
| 6.5 | 正确识破 | 选择正确漏洞类型 | 显示「识破伪装」+ 证据 +N + 可能获得碎片 | 证据未增加 | 检查 `judgeFlaw` 的 reward 逻辑 |
| 6.6 | 错误判断 | 选择错误漏洞类型 | 显示「判断失误」+ 警戒 +1~2 | 警戒未增加 | 检查 alertPenalty 计算 |
| 6.7 | 忽略消息 | 点击「忽略消息」 | 记录到 history 但无奖惩，回到剧情 | phase 未切回 | 检查 `dismissSugarEcho` 的 phase 设置 |
| 6.8 | 多次识破后谨慎 | 识破 ≥2 次后再触发 | 消息变为极简/空洞模板（previously_detected 池） | 仍出普通消息 | 检查 `detectedCount` 传递是否正确 |
| 6.9 | 每章不重复 | 同一章再次触发 | 不重复显示 SugarEcho | 重复弹出 | 检查 `fakeMessageHistory.some(h => h.chapter)` |
| 6.10 | 碎片奖励 | 识破含 rewardMemory 的消息 | 延迟获得对应记忆碎片 | 碎片未获得 | 检查 `setTimeout(() => addMemoryFragment())` |

---

## 七、结局系统

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 7.1 | 真实回声触发 | evidence≥12 + alert≤65 + highBond≥2 + memories≥3 + medusa_joined + qiaoqing_joined | 进入「🕊️ 真实回声」结局 | 条件不满足 | 用 console 打印 checkEnding 时的各值 |
| 7.2 | 纸门之后触发 | evidence≥5 但不满足真实回声条件 | 进入「🚪 纸门之后」结局 | 误触真实回声 | 检查 priority 排序（10 > 5） |
| 7.3 | 完美替身触发 | evidence < 5 | 进入「🍬 完美替身」结局 | 触发了纸门之后 | 检查 fallback 是否为 `ending_perfect_double` |
| 7.4 | 结局画面 | 进入任意结局 | 显示标题 + subtitle + 描述文本 | 黑屏 | 检查 `currentEnding` 是否在 endings.json 中 |
| 7.5 | 后日谈 | 点击「📖 后日谈」 | 切换到后日谈长文本 | 按钮不显示 | 检查 ending.epilogue 是否存在 |
| 7.6 | 最后一条消息 | 点击「📱 最后一条消息」 | 显示手机模拟 + 消息文本 + 底部注释 | 手机样式错位 | 检查 `.last-msg-*` CSS |
| 7.7 | NPC 后日谈（高） | 美杜莎信任 ≥70 时点击「🐍 美杜莎」 | 显示高羁绊后日谈 | 显示中/低版本 | 检查 `getBondLevel()` 和 key 匹配逻辑 |
| 7.8 | NPC 后日谈（低） | 美杜莎信任 < 40 时 | 显示低羁绊后日谈或不显示 | 按钮不出现 | 检查 `getMatchedNpcEpilogue` 降级匹配 |
| 7.9 | 记忆碎片统计 | 进入结局 | 统计栏显示碎片数量 | 碎片数为 0 | 检查 `memoryFragments` 是否从 store 获取 |
| 7.10 | 真实回声·美空线 | 最好结局的后日谈 | 文本中出现 MK-01 系统日志 + 「曹莓」暗号 | 文案缺失 | 检查 `ending_true_echo.epilogue` 内容 |

---

## 八、旧功能回归

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 8.1 | Ch1 密码谜题 | 查看海报→输入 12011→打开抽屉 | 获得千纸鹤 + evidence | 谜题不弹出 | 检查 `ch1_drawer_puzzle` 的 requireFlag |
| 8.2 | Ch1 门禁谜题 | 输入 0042 | 门禁解除 | 答案不匹配 | 检查 `ch1_door_puzzle.answer` |
| 8.3 | Ch2 铁皮柜谜题 | 输入 0712 | 获得许珩笔记 | 高警戒锁定 | 降低 alert 再试 |
| 8.4 | Ch3 广播谜题 | 选择正确操作顺序 | 广播设备启动 | 选项顺序错误 | 检查 `ch3_broadcast_puzzle.answer` |
| 8.5 | Ch4 终端谜题 | 输入 0712 | 终端解锁 + 出口解锁 | — | — |
| 8.6 | 物品组合 | 传单碎片 + 紫色糖纸 | 合成门禁暗号 | 组合失败 | 检查 `recipes.json` 材料 ID |
| 8.7 | 传单隐写 | Ch2 选择暗号方式 → 制作 → 扫描 | 骰点判定成功/失败 | 成功率异常 | 检查 `calcRate` 函数 |
| 8.8 | Phaser 移动 | WASD / 方向键 | 角色 8 方向移动 + 碰撞 | 穿墙 | 检查 Phaser 碰撞体 |
| 8.9 | Phaser E 键交互 | 靠近热区按 E | 弹出交互弹窗 | 无反应 | 检查 `entity-interact` 事件 |
| 8.10 | ESC 退出房间 | 按 ESC 或点击「离开房间」 | 回到剧情 phase | 卡在房间 | 检查 `exitRoom()` |

---

## 九、存档系统

| # | 测试项 | 操作步骤 | 预期结果 | 可能问题 | 修复建议 |
|---|--------|---------|---------|---------|---------|
| 9.1 | 存档 | 点击状态栏「💾 存档」 | 提示「游戏已保存」 | 提示不显示 | 检查 `saveGame()` |
| 9.2 | 读档 | 刷新页面 → 点击「继续游戏」 | 恢复到存档时的状态 | 数据丢失 | 检查 localStorage key |
| 9.3 | 读档完整性 | 存档后读档 | evidence/alert/trust_*/flags/inventory/memoryFragments 全部恢复 | 新字段丢失 | 检查 `loadGame` 是否包含所有字段 |
| 9.4 | 删档重开 | 结局画面点击「重新开始」 | 清除存档 + 回到开始画面 | 旧状态残留 | 检查 `deleteSave()` + `window.location.reload()` |

---

## 快速冒烟测试路径

### 路径 A：真实回声（最好结局）
```
序章跳过 → Ch1 选择信任美杜莎(+15) → 查看手机(+mem) → 查看监控
→ 解谜开抽屉 → 开门 → 美杜莎盲区事件(+10) → 进 Ch2
→ SugarEcho 正确识破 → 传单隐写 → 解铁皮柜 → 乔青信任选择(+15)
→ 美空失言 → 许珩笔记 → 进 Ch3
→ SugarEcho 正确识破 → 找磁带 → 照片墙发现林夏 → 播磁带 → 团结选择(+20)
→ 乔青改装天线 → 和美杜莎谈话 → 进 Ch4
→ SugarEcho 正确识破 → 美杜莎给图 → 解终端 → MK-01日志 → 与林夏对话
→ 取硬盘 → SugarEcho对话 → 警报 → 美杜莎拖延 → 选择广播
→ 检查：evidence≥12, alert≤65, highBond≥2, memories≥3 → 真实回声
```

### 路径 B：完美替身（失败结局）
```
序章跳过 → Ch1 选择「别挡路」(-10) → 不查手机 → 直接开门
→ Ch2 SugarEcho 判错(+alert) → 不解铁皮柜 → 乔青冷淡选择(-5)
→ Ch3 SugarEcho 判错(+alert) → 不找磁带 → 急躁选择(+alert)
→ Ch4 SugarEcho 忽略 → 直接终端谜题 → 选择逃跑
→ 检查：evidence<5 → 完美替身
```

---

## 自动验证脚本

在浏览器控制台运行：
```js
// 检查核心数据完整性
const store = window.__ZUSTAND_STORE__ || document.querySelector('[data-zustand]');
console.log('=== 数据完整性检查 ===');
fetch('/src/data/dialogues.json').then(r=>r.json()).then(d=>{
  const nodes = Object.keys(d).filter(k=>!k.startsWith('__'));
  console.log(`dialogues: ${nodes.length} nodes`);
});
fetch('/src/data/endings.json').then(r=>r.json()).then(d=>{
  const endings = Object.keys(d).filter(k=>!k.startsWith('__'));
  console.log(`endings: ${endings.length} → ${endings.join(', ')}`);
});
fetch('/src/data/memoryFragments.json').then(r=>r.json()).then(d=>{
  console.log(`memoryFragments: ${d.length} fragments`);
  const ids = d.map(m=>m.id);
  const unique = new Set(ids);
  console.log(`unique IDs: ${unique.size}/${ids.length} ${unique.size===ids.length?'✓':'⚠ 有重复!'}`);
});
fetch('/src/data/fakeMessages.json').then(r=>r.json()).then(d=>{
  const chapters = Object.keys(d).filter(k=>k.startsWith('chapter_'));
  chapters.forEach(ch=>{
    const pools = Object.keys(d[ch]);
    const total = pools.reduce((s,p)=>s+(Array.isArray(d[ch][p])?d[ch][p].length:0),0);
    console.log(`${ch}: ${total} messages in ${pools.length} pools`);
  });
});
```
