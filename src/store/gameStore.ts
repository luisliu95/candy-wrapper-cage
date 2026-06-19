import { create } from 'zustand';
import type { GamePhase, SaveData, StoryNode, StoryTrigger, Ending, EndingCondition, CraftRecipe, FakeMessage, Hotspot, Room, MemoryFragment, BondLevel, AlertLevel } from '../types/game';
import { getBondLevel, getAlertLevel } from '../types/game';

/** 将值 clamp 到 [0, 100] */
function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v));
}
import memoryData from '../data/memoryFragments.json';
import storyData from '../data/dialogues.json';
import roomsData from '../data/scenes.json';
import itemsData from '../data/items.json';
import puzzlesData from '../data/puzzles.json';
import endingsData from '../data/endings.json';
import recipesData from '../data/recipes.json';
import { selectFakeMessage, generateFlawOptions, getDetectionReward } from './sugarEchoEngine';

const SAVE_KEY = 'candy_wrapper_cage_save';

interface GameState {
  phase: GamePhase;
  currentNode: string;
  currentRoom: string | null;
  currentPuzzle: string | null;
  currentEnding: string | null;
  inventory: string[];
  chapter: number;
  // 数值系统
  evidence: number;
  alert: number;
  trust_medusa: number;
  trust_xuheng: number;
  trust_qiaoqing: number;
  // 标记与状态
  flags: string[];
  usedHotspots: string[];
  hotspotExamineCount: Record<string, number>;
  message: string | null;
  // 背包组合
  combineMode: boolean;
  combineSlots: string[];
  // SugarEcho 系统
  currentFakeMessage: FakeMessage | null;
  fakeMessageHistory: { chapter: number; messageId: string; detected: boolean }[];
  sugarEchoFlawOptions: { type: string; label: string }[];
  // 记忆碎片
  memoryFragments: string[];

  // Actions
  addMemoryFragment: (memoryId: string) => void;
  hasMemory: (memoryId: string) => boolean;
  getMemoryCount: () => number;
  startGame: () => void;
  loadGame: () => boolean;
  saveGame: () => void;
  deleteSave: () => void;
  hasSave: () => boolean;

  goToNode: (nodeId: string) => void;
  enterRoom: (roomId: string) => void;
  exitRoom: () => void;
  openPuzzle: (puzzleId: string) => void;
  solvePuzzle: (answer: string) => void;
  closePuzzle: () => void;

  addItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  hasItem: (itemId: string) => boolean;
  hasFlag: (flag: string) => boolean;

  applyTrigger: (trigger: StoryTrigger) => void;
  useHotspot: (hotspotId: string) => void;
  isHotspotUsed: (hotspotId: string) => boolean;
  getHotspotExamineCount: (hotspotId: string) => number;
  incrementExamineCount: (hotspotId: string) => void;

  // 背包组合
  toggleCombineMode: () => void;
  selectForCombine: (itemId: string) => void;
  clearCombineSlots: () => void;
  tryCombine: () => void;
  getAvailableRecipes: () => CraftRecipe[];

  // SugarEcho
  triggerSugarEcho: () => void;
  judgeFlaw: (flawType: string) => void;
  dismissSugarEcho: () => void;

  // 统一交互入口（Phaser E键 / React 点击热区 共用）
  triggerInteraction: (interactionId: string) => { handled: boolean; reason?: string };
  getHotspotById: (roomId: string, hotspotId: string) => Hotspot | null;

  checkEnding: () => void;
  showMessage: (msg: string) => void;
  clearMessage: () => void;

  getStoryNode: (id: string) => StoryNode | null;
  getCurrentNode: () => StoryNode | null;

  // 羁绊等级
  getBondLevels: () => { medusa: BondLevel; xuheng: BondLevel; qiaoqing: BondLevel };
  getHighBondCount: () => number;
  // 警戒等级
  getAlertLevel: () => AlertLevel;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'start',
  currentNode: 'start',
  currentRoom: null,
  currentPuzzle: null,
  currentEnding: null,
  inventory: [],
  chapter: 1,
  evidence: 0,
  alert: 0,
  trust_medusa: 0,
  trust_xuheng: 0,
  trust_qiaoqing: 0,
  flags: [],
  usedHotspots: [],
  hotspotExamineCount: {},
  message: null,
  combineMode: false,
  combineSlots: [],
  currentFakeMessage: null,
  fakeMessageHistory: [],
  sugarEchoFlawOptions: [],
  memoryFragments: [],

  addMemoryFragment: (memoryId: string) => {
    const s = get();
    if (s.memoryFragments.includes(memoryId)) return;
    const mem = (memoryData as MemoryFragment[]).find(m => m.id === memoryId);
    const fragments = [...s.memoryFragments, memoryId];
    const evidenceBonus = mem?.evidenceBonus || 0;
    set({
      memoryFragments: fragments,
      evidence: s.evidence + evidenceBonus,
      message: `🧠 记忆碎片：${mem?.title || memoryId}（证据 +${evidenceBonus}）`,
    });
  },

  hasMemory: (memoryId: string) => {
    return get().memoryFragments.includes(memoryId);
  },

  getMemoryCount: () => {
    return get().memoryFragments.length;
  },

  startGame: () => {
    set({
      phase: 'story',
      currentNode: 'start',
      currentRoom: null,
      currentPuzzle: null,
      currentEnding: null,
      inventory: [],
      chapter: 1,
      evidence: 0,
      alert: 0,
      trust_medusa: 0,
      trust_xuheng: 0,
      trust_qiaoqing: 0,
      flags: [],
      usedHotspots: [],
      hotspotExamineCount: {},
      message: null,
      combineMode: false,
      combineSlots: [],
      currentFakeMessage: null,
      fakeMessageHistory: [],
      sugarEchoFlawOptions: [],
      memoryFragments: [],
    });
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const save: SaveData = JSON.parse(raw);
      set({
        phase: save.currentRoom ? 'topdown' : 'story',
        currentNode: save.currentNode,
        currentRoom: save.currentRoom,
        currentPuzzle: null,
        currentEnding: null,
        inventory: save.inventory,
        chapter: save.chapter || 1,
        evidence: save.evidence,
        alert: save.alert,
        trust_medusa: save.trust_medusa || 0,
        trust_xuheng: save.trust_xuheng || 0,
        trust_qiaoqing: save.trust_qiaoqing || 0,
        flags: save.flags,
        usedHotspots: save.usedHotspots || [],
        hotspotExamineCount: (save as any).hotspotExamineCount || {},
        memoryFragments: save.memoryFragments || [],
        message: '存档读取成功！',
        combineMode: false,
        combineSlots: [],
      });
      return true;
    } catch {
      return false;
    }
  },

  saveGame: () => {
    const s = get();
    const save = {
      currentNode: s.currentNode,
      currentRoom: s.currentRoom,
      inventory: [...s.inventory],
      evidence: s.evidence,
      alert: s.alert,
      trust_medusa: s.trust_medusa,
      trust_xuheng: s.trust_xuheng,
      trust_qiaoqing: s.trust_qiaoqing,
      flags: [...s.flags],
      usedHotspots: [...s.usedHotspots],
      hotspotExamineCount: { ...s.hotspotExamineCount },
      memoryFragments: [...s.memoryFragments],
      chapter: s.chapter,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    set({ message: '游戏已保存！' });
  },

  deleteSave: () => {
    localStorage.removeItem(SAVE_KEY);
  },

  hasSave: () => {
    return !!localStorage.getItem(SAVE_KEY);
  },

  goToNode: (nodeId: string) => {
    const node = (storyData as Record<string, StoryNode>)[nodeId];
    if (!node) return;

    // 更新章节
    const chapterUpdate = node.chapter ? { chapter: node.chapter } : {};

    // 应用触发器
    if (node.trigger) {
      get().applyTrigger(node.trigger);
    }

    // 进入房间（根据 explorationMode 选择 phase）
    if (node.enterRoom) {
      set({ currentNode: nodeId, phase: 'topdown', currentRoom: node.enterRoom, ...chapterUpdate });
      return;
    }

    // 检查结局
    if (node.checkEnding) {
      set({ currentNode: nodeId, ...chapterUpdate });
      get().checkEnding();
      return;
    }

    set({ currentNode: nodeId, phase: 'story', ...chapterUpdate });
  },

  enterRoom: (roomId: string) => {
    set({ currentRoom: roomId, phase: 'topdown' });
  },

  exitRoom: () => {
    const room = get().currentRoom;
    if (!room) return;
    const roomData = (roomsData as Record<string, { exitTo?: string }>)[room];
    const exitNode = roomData?.exitTo || 'start';
    set({ currentRoom: null, phase: 'story', currentNode: exitNode });
  },

  openPuzzle: (puzzleId: string) => {
    set({ currentPuzzle: puzzleId, phase: 'puzzle' });
  },

  solvePuzzle: (answer: string) => {
    const puzzleId = get().currentPuzzle;
    if (!puzzleId) return;
    const puzzle = (puzzlesData as Record<string, any>)[puzzleId];
    if (!puzzle) return;

    if (answer.toLowerCase().trim() === puzzle.answer.toLowerCase().trim()) {
      if (puzzle.reward) {
        get().applyTrigger(puzzle.reward);
      }
      set({ currentPuzzle: null, phase: 'story', currentNode: puzzle.successNode });
    } else {
      set({ currentPuzzle: null, phase: 'story', currentNode: puzzle.failNode });
    }
  },

  closePuzzle: () => {
    const room = get().currentRoom;
    set({ currentPuzzle: null, phase: room ? 'topdown' : 'story' });
  },

  addItem: (itemId: string) => {
    const inv = get().inventory;
    if (!inv.includes(itemId)) {
      const item = (itemsData as Record<string, { name: string }>)[itemId];
      set({
        inventory: [...inv, itemId],
        message: `获得物品：${item?.name || itemId}`,
      });
    }
  },

  removeItem: (itemId: string) => {
    set({ inventory: get().inventory.filter(i => i !== itemId) });
  },

  hasItem: (itemId: string) => {
    return get().inventory.includes(itemId);
  },

  hasFlag: (flag: string) => {
    return get().flags.includes(flag);
  },

  applyTrigger: (trigger: StoryTrigger) => {
    const s = get();
    const updates: Partial<GameState> = {};

    if (trigger.addItem) {
      const inv = [...s.inventory];
      if (!inv.includes(trigger.addItem)) {
        inv.push(trigger.addItem);
        const item = (itemsData as Record<string, { name: string }>)[trigger.addItem];
        updates.message = `获得物品：${item?.name || trigger.addItem}`;
      }
      updates.inventory = inv;
    }
    if (trigger.removeItem) {
      updates.inventory = (updates.inventory || [...s.inventory]).filter(i => i !== trigger.removeItem);
    }
    if (trigger.evidence) {
      updates.evidence = s.evidence + trigger.evidence;
    }
    if (trigger.alert) {
      updates.alert = clamp100(s.alert + trigger.alert);
    }
    if (trigger.trust_medusa) {
      updates.trust_medusa = clamp100(s.trust_medusa + trigger.trust_medusa);
    }
    if (trigger.trust_xuheng) {
      updates.trust_xuheng = clamp100(s.trust_xuheng + trigger.trust_xuheng);
    }
    if (trigger.trust_qiaoqing) {
      updates.trust_qiaoqing = clamp100(s.trust_qiaoqing + trigger.trust_qiaoqing);
    }
    if (trigger.setFlag) {
      const flags = [...(updates.flags || s.flags)];
      if (!flags.includes(trigger.setFlag)) flags.push(trigger.setFlag);
      updates.flags = flags;
    }
    if (trigger.setFlags) {
      const flags = [...(updates.flags || s.flags)];
      for (const f of trigger.setFlags) {
        if (!flags.includes(f)) flags.push(f);
      }
      updates.flags = flags;
    }
    if (trigger.removeFlag) {
      const flags = (updates.flags || [...s.flags]).filter(f => f !== trigger.removeFlag);
      updates.flags = flags;
    }

    set(updates as any);

    // 记忆碎片
    if (trigger.addMemory) {
      get().addMemoryFragment(trigger.addMemory);
    }

    // SugarEcho 触发（需要在 set 之后，因为引擎读最新状态）
    if (trigger.triggerSugarEcho) {
      setTimeout(() => get().triggerSugarEcho(), 300);
    }
    // 传单隐写触发
    if (trigger.triggerLeaflet) {
      setTimeout(() => {
        if (!get().flags.includes('leaflet_completed')) {
          set({ phase: 'leaflet' });
        }
      }, 300);
    }
  },

  useHotspot: (hotspotId: string) => {
    const used = get().usedHotspots;
    if (!used.includes(hotspotId)) {
      set({ usedHotspots: [...used, hotspotId] });
    }
  },

  isHotspotUsed: (hotspotId: string) => {
    return get().usedHotspots.includes(hotspotId);
  },

  getHotspotExamineCount: (hotspotId: string) => {
    return get().hotspotExamineCount[hotspotId] || 0;
  },

  incrementExamineCount: (hotspotId: string) => {
    const counts = { ...get().hotspotExamineCount };
    counts[hotspotId] = (counts[hotspotId] || 0) + 1;
    set({ hotspotExamineCount: counts });
  },

  // ===== 背包组合系统 =====
  toggleCombineMode: () => {
    const mode = get().combineMode;
    set({ combineMode: !mode, combineSlots: [] });
  },

  selectForCombine: (itemId: string) => {
    const slots = [...get().combineSlots];
    const idx = slots.indexOf(itemId);
    if (idx >= 0) {
      slots.splice(idx, 1);
    } else if (slots.length < 2) {
      slots.push(itemId);
    }
    set({ combineSlots: slots });
    // 自动尝试组合
    if (slots.length === 2) {
      setTimeout(() => get().tryCombine(), 100);
    }
  },

  clearCombineSlots: () => {
    set({ combineSlots: [] });
  },

  tryCombine: () => {
    const s = get();
    const [a, b] = s.combineSlots;
    if (!a || !b) return;

    const recipes = recipesData as CraftRecipe[];
    const recipe = recipes.find(r =>
      (r.materials[0] === a && r.materials[1] === b) ||
      (r.materials[0] === b && r.materials[1] === a)
    );

    if (recipe) {
      // 移除材料
      const inv = s.inventory.filter(id => id !== a && id !== b);
      // 添加产物
      inv.push(recipe.result);
      const item = (itemsData as Record<string, { name: string }>)[recipe.result];
      set({
        inventory: inv,
        combineSlots: [],
        combineMode: false,
        message: `组合成功！获得：${item?.name || recipe.result}`,
      });
      // 应用触发器
      if (recipe.trigger) {
        get().applyTrigger(recipe.trigger);
      }
    } else {
      set({
        combineSlots: [],
        message: '这两样东西似乎无法组合……',
      });
    }
  },

  getAvailableRecipes: () => {
    const inv = get().inventory;
    const recipes = recipesData as CraftRecipe[];
    return recipes.filter(r =>
      inv.includes(r.materials[0]) && inv.includes(r.materials[1])
    );
  },

  // ===== 统一交互入口 =====
  getHotspotById: (roomId: string, hotspotId: string) => {
    const room = (roomsData as Record<string, Room>)[roomId];
    if (!room) return null;
    return room.hotspots.find(h => h.id === hotspotId) || null;
  },

  triggerInteraction: (interactionId: string) => {
    const s = get();
    const roomId = s.currentRoom;
    if (!roomId) return { handled: false, reason: 'not_in_room' };

    const room = (roomsData as Record<string, Room>)[roomId];
    if (!room) return { handled: false, reason: 'room_not_found' };

    const hotspot = room.hotspots.find(h => h.id === interactionId);
    if (!hotspot) return { handled: false, reason: 'hotspot_not_found' };

    // 警戒值限制检查
    if (hotspot.maxAlert !== undefined && s.alert > hotspot.maxAlert) {
      // 高羁绊NPC可以抵消：任一NPC ≥ 70 时放宽限制 +15
      const bondBonus = get().getHighBondCount() > 0 ? 15 : 0;
      if (s.alert > hotspot.maxAlert + bondBonus) {
        get().showMessage('⚠️ 警戒太高了，这里已经被加强监控……无法操作。');
        return { handled: false, reason: 'alert_too_high' };
      } else {
        get().showMessage('🐍 多亏了同伴的掩护，你勉强可以操作这里。');
      }
    }

    // 前置条件检查
    if (hotspot.requireFlag && !s.flags.includes(hotspot.requireFlag)) {
      get().showMessage('还不能操作这里……也许需要先完成其他事情。');
      return { handled: false, reason: 'flag_required' };
    }
    if (hotspot.requireItem && !s.inventory.includes(hotspot.requireItem)) {
      get().showMessage('需要特定物品才能操作');
      return { handled: false, reason: 'item_required' };
    }
    if (hotspot.requireItems) {
      for (const id of hotspot.requireItems) {
        if (!s.inventory.includes(id)) {
          get().showMessage('还缺少一些必要的物品……');
          return { handled: false, reason: 'items_required' };
        }
      }
    }

    // 谜题
    if (hotspot.puzzleId) {
      get().openPuzzle(hotspot.puzzleId);
      return { handled: true };
    }

    // 剧情跳转（跳转前先标记已使用 + 触发 trigger）
    if (hotspot.storyJump || hotspot.dialogueId) {
      if (hotspot.trigger && (!hotspot.usedFlag || !s.usedHotspots.includes(hotspot.usedFlag))) {
        get().applyTrigger(hotspot.trigger);
      }
      if (hotspot.usedFlag && !s.usedHotspots.includes(hotspot.usedFlag)) {
        get().useHotspot(hotspot.usedFlag);
      }
      get().goToNode(hotspot.storyJump || hotspot.dialogueId!);
      return { handled: true };
    }

    // 拾取物品
    if (hotspot.itemId && hotspot.usedFlag && !s.usedHotspots.includes(hotspot.usedFlag)) {
      get().addItem(hotspot.itemId);
      get().useHotspot(hotspot.usedFlag);
    }

    // 触发效果
    if (hotspot.trigger && (!hotspot.usedFlag || !s.usedHotspots.includes(hotspot.usedFlag))) {
      get().applyTrigger(hotspot.trigger);
      if (hotspot.usedFlag) {
        get().useHotspot(hotspot.usedFlag);
      }
    }

    // 调查计数
    get().incrementExamineCount(interactionId);

    return { handled: true };
  },

  // ===== SugarEcho AI 替身消息系统 =====
  triggerSugarEcho: () => {
    const s = get();
    // 检查本章是否已经触发过
    if (s.fakeMessageHistory.some(h => h.chapter === s.chapter)) return;

    // 高警戒时，SugarEcho 反制：删除一点弱证据
    if (s.alert >= 70) {
      const loss = get().getHighBondCount() > 0 ? 1 : 2; // 有高羁绊NPC则减轻损失
      const newEvidence = Math.max(0, s.evidence - loss);
      if (newEvidence < s.evidence) {
        set({ evidence: newEvidence });
        get().showMessage(`🛡️ SugarEcho 反制：系统自动清除了部分可疑记录。证据 -${s.evidence - newEvidence}`);
      }
    }

    // 重新读取最新状态（可能被上面的证据删除修改过）
    const latest = get();
    const detectedCount = latest.fakeMessageHistory.filter(h => h.detected).length;

    const msg = selectFakeMessage({
      chapter: latest.chapter,
      evidence: latest.evidence,
      alert: latest.alert,
      trust_medusa: latest.trust_medusa,
      trust_xuheng: latest.trust_xuheng,
      trust_qiaoqing: latest.trust_qiaoqing,
      flags: latest.flags,
      inventory: latest.inventory,
      memoryFragments: latest.memoryFragments,
      detectedCount,
    });

    const options = generateFlawOptions(msg.flaw, msg.difficulty ?? 1);

    set({
      currentFakeMessage: msg,
      sugarEchoFlawOptions: options,
      phase: 'sugarecho',
    });
  },

  judgeFlaw: (flawType: string) => {
    const s = get();
    if (!s.currentFakeMessage) return;

    const correct = flawType === s.currentFakeMessage.flaw;
    const history = [...s.fakeMessageHistory, {
      chapter: s.chapter,
      messageId: s.currentFakeMessage.id,
      detected: correct,
    }];

    if (correct) {
      const reward = getDetectionReward(s.currentFakeMessage, history.filter(h => h.detected).length);
      const newEvidence = s.evidence + reward.evidence;
      const flags = [...s.flags];
      const flagKey = `detected_echo_ch${s.chapter}`;
      if (!flags.includes(flagKey)) flags.push(flagKey);
      if (!flags.includes('sugar_echo_aware')) flags.push('sugar_echo_aware');

      set({
        evidence: newEvidence,
        flags,
        fakeMessageHistory: history,
        message: `🔍 识破成功！${reward.bonusText}`,
      });

      // 识破后获得记忆碎片
      if (reward.memoryId) {
        setTimeout(() => get().addMemoryFragment(reward.memoryId!), 500);
      }
    } else {
      // 判断错误：+alert（难度越高惩罚越轻）
      const difficulty = s.currentFakeMessage.difficulty ?? 1;
      const alertPenalty = difficulty >= 3 ? 1 : 2;
      const newAlert = clamp100(s.alert + alertPenalty);
      set({
        alert: newAlert,
        fakeMessageHistory: history,
        message: `⚠️ 判断失误。SugarEcho 注意到了你的审查行为。警戒 +${alertPenalty}`,
      });
    }
  },

  dismissSugarEcho: () => {
    const s = get();
    // 选择不审查：记录但无奖惩
    if (s.currentFakeMessage) {
      const history = [...s.fakeMessageHistory, {
        chapter: s.chapter,
        messageId: s.currentFakeMessage.id,
        detected: false,
      }];
      set({ fakeMessageHistory: history });
    }
    set({
      currentFakeMessage: null,
      sugarEchoFlawOptions: [],
      phase: 'story',
    });
  },

  checkEnding: () => {
    const s = get();
    // 按 priority 排序，高优先级先匹配
    const endings = (Object.values(endingsData) as Ending[])
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const ending of endings) {
      const c: EndingCondition = ending.condition;
      let match = true;

      if (c.minEvidence !== undefined && s.evidence < c.minEvidence) match = false;
      if (c.maxEvidence !== undefined && s.evidence > c.maxEvidence) match = false;
      if (c.minAlert !== undefined && s.alert < c.minAlert) match = false;
      if (c.maxAlert !== undefined && s.alert > c.maxAlert) match = false;
      if (c.minTrustMedusa !== undefined && s.trust_medusa < c.minTrustMedusa) match = false;
      if (c.maxTrustMedusa !== undefined && s.trust_medusa > c.maxTrustMedusa) match = false;
      if (c.minTrustXuheng !== undefined && s.trust_xuheng < c.minTrustXuheng) match = false;
      if (c.maxTrustXuheng !== undefined && s.trust_xuheng > c.maxTrustXuheng) match = false;
      if (c.minTrustQiaoqing !== undefined && s.trust_qiaoqing < c.minTrustQiaoqing) match = false;
      if (c.maxTrustQiaoqing !== undefined && s.trust_qiaoqing > c.maxTrustQiaoqing) match = false;
      if (c.hasFlag && !s.flags.includes(c.hasFlag)) match = false;
      if (c.hasFlags) {
        for (const f of c.hasFlags) {
          if (!s.flags.includes(f)) match = false;
        }
      }
      if (c.hasItem && !s.inventory.includes(c.hasItem)) match = false;
      if (c.minMemoryFragments !== undefined && s.memoryFragments.length < c.minMemoryFragments) match = false;
      if (c.minHighBondCount !== undefined && get().getHighBondCount() < c.minHighBondCount) match = false;

      if (match) {
        set({ currentEnding: ending.id, phase: 'ending' });
        return;
      }
    }

    set({ currentEnding: 'ending_perfect_double', phase: 'ending' });
  },

  showMessage: (msg: string) => set({ message: msg }),
  clearMessage: () => set({ message: null }),

  getStoryNode: (id: string) => {
    return (storyData as Record<string, StoryNode>)[id] || null;
  },

  getCurrentNode: () => {
    return (storyData as Record<string, StoryNode>)[get().currentNode] || null;
  },

  getBondLevels: () => {
    const s = get();
    return {
      medusa: getBondLevel(s.trust_medusa),
      xuheng: getBondLevel(s.trust_xuheng),
      qiaoqing: getBondLevel(s.trust_qiaoqing),
    };
  },

  getHighBondCount: () => {
    const s = get();
    let count = 0;
    if (s.trust_medusa >= 70) count++;
    if (s.trust_xuheng >= 70) count++;
    if (s.trust_qiaoqing >= 70) count++;
    return count;
  },

  getAlertLevel: () => {
    return getAlertLevel(get().alert);
  },
}));
