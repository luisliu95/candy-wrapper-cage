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
  triggerSugarEcho?: boolean; // 触发 SugarEcho 消息审查
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
}

/** 可点击热区 */
export interface Hotspot {
  id: string;
  x: number; y: number;
  w: number; h: number;
  label: string;
  description: string;
  icon?: string;            // 热区图标 emoji
  itemId?: string;
  puzzleId?: string;
  requireItem?: string;
  requireItems?: string[];  // 需要同时持有多个物品
  requireFlag?: string;
  usedFlag?: string;
  trigger?: StoryTrigger;
  storyJump?: string;
  dialogueId?: string;
  examineCount?: number;    // 可调查次数（>1 次才出新信息）
  multiDescriptions?: string[]; // 多次调查时的不同描述
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
  hasFlags?: string[];    // 需要同时拥有多个标记
  hasItem?: string;
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

/** 游戏阶段 */
export type GamePhase = 'start' | 'story' | 'room' | 'puzzle' | 'ending' | 'sugarecho';
