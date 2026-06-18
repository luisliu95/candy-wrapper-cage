// ===== 《糖纸牢笼》核心类型定义 =====

/** 剧情节点 */
export interface StoryNode {
  id: string;
  chapter?: number;       // 所属章节 1-4
  speaker: string;        // 说话人："旁白" | "美杜莎" | "许珩" | "乔青" | "系统"
  text: string;           // 对话文本（≤80字）
  next?: string;          // 下一个节点 ID
  choices?: StoryChoice[];
  trigger?: StoryTrigger;
  background?: string;    // 切换背景 key
  enterRoom?: string;     // 进入房间探索
  checkEnding?: boolean;  // 到此节点检查结局
  requireFlag?: string;   // 需要某标记才显示此节点
}

/** 玩家选项 */
export interface StoryChoice {
  text: string;
  next: string;
  require?: string;       // 需要持有的物品 ID
  requireFlag?: string;   // 需要某剧情标记
  trigger?: StoryTrigger;
}

/** 触发效果 —— 支持多NPC信任值 */
export interface StoryTrigger {
  addItem?: string;
  removeItem?: string;
  evidence?: number;
  alert?: number;
  trust_medusa?: number;
  trust_xuheng?: number;
  trust_qiaoqing?: number;
  setFlag?: string;
  setFlags?: string[];    // 批量设置标记
  removeFlag?: string;
  triggerSugarEcho?: boolean;
  triggerLeaflet?: boolean;
  addMemory?: string;         // 获得记忆碎片 ID
}

/** 场景（房间） */
export interface Room {
  id: string;
  chapter: number;
  name: string;
  description: string;
  background: string;     // CSS 渐变/颜色
  hotspots: Hotspot[];
  exitTo?: string;        // 退出后跳转的剧情节点
  requireFlag?: string;   // 需要标记才能进入
  unlockHint?: string;    // 未解锁时的提示
  playerSpawn?: { x: number; y: number }; // 玩家出生点（百分比坐标）
}

/** 交互类型 —— 决定 E 键提示文字和图标 */
export type InteractionType = 'investigate' | 'pickup' | 'talk' | 'use' | 'puzzle' | 'exit';

/**
 * 交互区域（兼容点击热区和 Phaser interaction zone）
 *
 * 原有字段（React 点击热区）全部保留，
 * 新增 Phaser 专用字段均为可选，向后兼容。
 */
export interface Hotspot {
  id: string;
  // --- 定位（百分比坐标，React 热区使用） ---
  x: number; y: number;
  w: number; h: number;
  // --- 基础信息 ---
  label: string;
  description: string;
  icon?: string;
  // --- Phaser 交互区域专用字段（可选，不影响旧数据） ---
  interactionRadius?: number;   // 交互触发半径(px)，默认50
  promptText?: string;          // 自定义 E 键提示文字
  interactionType?: InteractionType; // 交互分类
  spriteColor?: number;         // 实体显示颜色（十六进制）
  blocked?: boolean;            // 是否作为碰撞体阻挡玩家
  // --- 交互效果（两种模式共用） ---
  itemId?: string;
  puzzleId?: string;
  requireItem?: string;
  requireItems?: string[];
  requireFlag?: string;
  usedFlag?: string;
  trigger?: StoryTrigger;
  storyJump?: string;
  dialogueId?: string;
  examineCount?: number;
  multiDescriptions?: string[];
}

/** 物品 */
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  chapter: number;        // 所属章节
  category: 'key' | 'evidence' | 'tool' | 'document' | 'personal';
  combinable?: boolean;   // 是否可参与组合
}

/** 物品组合配方 */
export interface CraftRecipe {
  id: string;
  materials: [string, string];  // 两个材料物品 ID
  result: string;               // 产出物品 ID
  description: string;          // 组合描述文本
  trigger?: StoryTrigger;       // 组合时额外触发效果
}

/** 谜题 */
export interface Puzzle {
  id: string;
  chapter: number;
  title: string;
  description: string;
  type: 'input' | 'choice' | 'sequence';
  options?: string[];
  answer: string;
  hint?: string;
  successNode: string;
  failNode: string;
  reward?: StoryTrigger;
  maxAttempts?: number;
}

/** 结局 */
export interface Ending {
  id: string;
  title: string;
  description: string;
  epilogue?: string;      // 后日谈
  condition: EndingCondition;
  priority: number;       // 数字越大优先匹配
}

export interface EndingCondition {
  minEvidence?: number;
  maxEvidence?: number;
  minAlert?: number;
  maxAlert?: number;
  minTrustMedusa?: number;
  maxTrustMedusa?: number;
  minTrustXuheng?: number;
  maxTrustXuheng?: number;
  minTrustQiaoqing?: number;
  maxTrustQiaoqing?: number;
  hasFlag?: string;
  hasFlags?: string[];
  hasItem?: string;
  minMemoryFragments?: number; // 最少记忆碎片数量
}

/** 游戏存档 */
export interface SaveData {
  currentNode: string;
  currentRoom: string | null;
  inventory: string[];
  evidence: number;
  alert: number;
  trust_medusa: number;
  trust_xuheng: number;
  trust_qiaoqing: number;
  flags: string[];
  usedHotspots: string[];
  memoryFragments: string[];
  chapter: number;
  timestamp: number;
}

/** SugarEcho 伪造消息 */
export interface FakeMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  flaw: string;           // 漏洞类型 key
  flawHint: string;       // 玩家识破后看到的提示
  flawDetail: string;     // 技术层面的解释（SugarEcho 视角）
}

/** 章节消息池 */
export interface ChapterMessages {
  base: FakeMessage[];
  [conditionKey: string]: FakeMessage[];
}

/** 玩家对消息的审查选项 */
export interface FlawOption {
  type: string;
  label: string;
}

/** 传单隐写暗号方式 */
export interface SteganMethod {
  id: string;
  name: string;
  icon: string;
  description: string;       // 玩法说明
  flavor: string;            // 剧情氛围描述
  baseSuccessRate: number;   // 基础成功率 0-100
  evidenceReward: number;    // 成功时 +evidence
  alertRisk: number;         // 失败时 +alert
  bonusItem?: string;        // 持有此物品提升成功率
  bonusRate: number;         // 物品加成百分点
  medusaHintThreshold: number;  // trust_medusa >= 此值时给提示
  medusaHint: string;        // 美杜莎的提示文本
  scanPhases: string[];      // SugarEcho 扫描阶段描述（3段）
  successText: string;
  failText: string;
}

/** 传单隐写结果 */
export interface LeafletResult {
  methodId: string;
  success: boolean;
  roll: number;            // 实际骰点
  threshold: number;       // 成功阈值
  evidenceDelta: number;
  alertDelta: number;
}

/** 私人记忆碎片 */
export interface MemoryFragment {
  id: string;
  chapter: number;
  title: string;
  icon: string;
  description: string;
  quote: string;            // 莫妮卡的感悟引语
  evidenceBonus: number;    // 获得时额外 +evidence
  obtainedFrom: string;     // 获取来源说明
}

/** 游戏阶段 */
export type GamePhase = 'start' | 'prologue' | 'story' | 'topdown' | 'puzzle' | 'ending' | 'sugarecho' | 'leaflet';
