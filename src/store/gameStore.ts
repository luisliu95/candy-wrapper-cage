import { create } from 'zustand';
import type { GamePhase, SaveData, StoryNode, StoryTrigger, Ending, EndingCondition } from '../types/game';
import storyData from '../data/dialogues.json';
import roomsData from '../data/scenes.json';
import itemsData from '../data/items.json';
import puzzlesData from '../data/puzzles.json';
import endingsData from '../data/endings.json';

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
  message: string | null;

  // Actions
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

  checkEnding: () => void;
  showMessage: (msg: string) => void;
  clearMessage: () => void;

  getStoryNode: (id: string) => StoryNode | null;
  getCurrentNode: () => StoryNode | null;
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
  message: null,

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
      message: null,
    });
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const save: SaveData = JSON.parse(raw);
      set({
        phase: save.currentRoom ? 'room' : 'story',
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
        message: '存档读取成功！',
      });
      return true;
    } catch {
      return false;
    }
  },

  saveGame: () => {
    const s = get();
    const save: SaveData = {
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

    // 进入房间
    if (node.enterRoom) {
      set({ currentNode: nodeId, phase: 'room', currentRoom: node.enterRoom, ...chapterUpdate });
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
    set({ currentRoom: roomId, phase: 'room' });
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
    set({ currentPuzzle: null, phase: room ? 'room' : 'story' });
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
      updates.alert = s.alert + trigger.alert;
    }
    if (trigger.trust_medusa) {
      updates.trust_medusa = s.trust_medusa + trigger.trust_medusa;
    }
    if (trigger.trust_xuheng) {
      updates.trust_xuheng = s.trust_xuheng + trigger.trust_xuheng;
    }
    if (trigger.trust_qiaoqing) {
      updates.trust_qiaoqing = s.trust_qiaoqing + trigger.trust_qiaoqing;
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

      if (match) {
        set({ currentEnding: ending.id, phase: 'ending' });
        return;
      }
    }

    set({ currentEnding: 'ending_trapped', phase: 'ending' });
  },

  showMessage: (msg: string) => set({ message: msg }),
  clearMessage: () => set({ message: null }),

  getStoryNode: (id: string) => {
    return (storyData as Record<string, StoryNode>)[id] || null;
  },

  getCurrentNode: () => {
    return (storyData as Record<string, StoryNode>)[get().currentNode] || null;
  },
}));
