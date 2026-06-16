/**
 * SugarEcho AI 替身消息引擎
 * 根据游戏状态从模板池中选择最合适的伪造消息
 */
import type { FakeMessage, ChapterMessages } from '../types/game';
import fakeMessagesData from '../data/fakeMessages.json';

interface GameSnapshot {
  chapter: number;
  evidence: number;
  alert: number;
  trust_medusa: number;
  trust_xuheng: number;
  trust_qiaoqing: number;
  flags: string[];
  inventory: string[];
}

/** 条件阈值 */
const THRESHOLDS = {
  HIGH_EVIDENCE: 5,
  HIGH_ALERT: 3,
  HIGH_TRUST_MEDUSA: 3,
};

/** 根据当前游戏状态选择本章的伪造消息 */
export function selectFakeMessage(snapshot: GameSnapshot): FakeMessage {
  const chapterKey = `chapter_${snapshot.chapter}` as keyof typeof fakeMessagesData;
  const pool = fakeMessagesData[chapterKey] as unknown as ChapterMessages;

  if (!pool) {
    // fallback
    return {
      id: 'fallback',
      sender: '莫妮卡',
      text: '一切都好，不用担心我。',
      timestamp: '20:00',
      flaw: 'tone',
      flawHint: '这条消息太简短了，不像莫妮卡的风格。',
      flawDetail: 'SugarEcho 在没有可用模板时生成了最低限度的安抚消息。',
    };
  }

  // 按优先级收集候选消息
  const candidates: { msg: FakeMessage; priority: number }[] = [];

  // 1. 基于特定物品/标记的条件消息（最高优先级）
  const conditionChecks: { key: string; check: () => boolean; priority: number }[] = [
    {
      key: 'broadcast_fully_ready',
      check: () => snapshot.flags.includes('broadcast_fully_ready'),
      priority: 10,
    },
    {
      key: 'found_xuheng_backup',
      check: () => snapshot.flags.includes('found_xuheng_backup'),
      priority: 9,
    },
    {
      key: 'has_broadcast_tape',
      check: () => snapshot.inventory.includes('broadcast_tape') || snapshot.flags.includes('has_broadcast_tape'),
      priority: 8,
    },
    {
      key: 'crafted_door_code',
      check: () => snapshot.flags.includes('crafted_door_code'),
      priority: 7,
    },
    {
      key: 'has_sticky_note',
      check: () => snapshot.inventory.includes('sticky_note_m'),
      priority: 6,
    },
    {
      key: 'high_trust_medusa',
      check: () => snapshot.trust_medusa >= THRESHOLDS.HIGH_TRUST_MEDUSA,
      priority: 5,
    },
    {
      key: 'high_evidence',
      check: () => snapshot.evidence >= THRESHOLDS.HIGH_EVIDENCE,
      priority: 4,
    },
    {
      key: 'high_alert',
      check: () => snapshot.alert >= THRESHOLDS.HIGH_ALERT,
      priority: 3,
    },
  ];

  for (const { key, check, priority } of conditionChecks) {
    if (check() && pool[key]) {
      const msgs = pool[key] as FakeMessage[];
      for (const msg of msgs) {
        candidates.push({ msg, priority });
      }
    }
  }

  // 2. 基础消息池（最低优先级）
  if (pool.base) {
    for (const msg of pool.base) {
      candidates.push({ msg, priority: 1 });
    }
  }

  if (candidates.length === 0) {
    return pool.base[0];
  }

  // 按优先级排序，取最高优先级中随机一条
  candidates.sort((a, b) => b.priority - a.priority);
  const topPriority = candidates[0].priority;
  const topCandidates = candidates.filter(c => c.priority === topPriority);

  // 根据章节做伪随机选择（保证同一状态下结果稳定）
  const seed = snapshot.chapter * 1000 + snapshot.evidence * 100 + snapshot.alert * 10 + snapshot.trust_medusa;
  const idx = seed % topCandidates.length;

  return topCandidates[idx].msg;
}

/** 生成审查选项（正确答案 + 干扰项） */
export function generateFlawOptions(correctFlaw: string): { type: string; label: string }[] {
  const flawTypes = (fakeMessagesData as any).flaw_types as Record<string, string>;

  // 正确选项
  const correct = { type: correctFlaw, label: flawTypes[correctFlaw] || correctFlaw };

  // 从其他类型中随机选3个干扰项
  const otherKeys = Object.keys(flawTypes).filter(k => k !== correctFlaw);
  const shuffled = otherKeys.sort(() => 0.5 - Math.random());
  const distractors = shuffled.slice(0, 3).map(k => ({
    type: k,
    label: flawTypes[k],
  }));

  // 混合并打乱
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}
