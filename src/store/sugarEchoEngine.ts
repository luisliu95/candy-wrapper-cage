/**
 * SugarEcho AI 替身消息引擎 v2
 * 根据游戏状态动态选择伪造消息，体现"AI正在学习如何替你生活"
 */
import type { FakeMessage, ChapterMessages } from '../types/game';
import fakeMessagesData from '../data/fakeMessages.json';

export interface GameSnapshot {
  chapter: number;
  evidence: number;
  alert: number;
  trust_medusa: number;
  trust_xuheng: number;
  trust_qiaoqing: number;
  flags: string[];
  inventory: string[];
  memoryFragments: string[];
  detectedCount: number;  // 已识破的消息数
}

/** 条件阈值 */
const THRESHOLDS = {
  HIGH_EVIDENCE: 5,
  HIGH_ALERT: 40,
  HIGH_TRUST_MEDUSA: 40,
  HIGH_TRUST_QIAOQING: 40,
  MANY_MEMORIES: 4,
};

/** 根据当前游戏状态选择本章的伪造消息 */
export function selectFakeMessage(snapshot: GameSnapshot): FakeMessage {
  const chapterKey = `chapter_${snapshot.chapter}` as keyof typeof fakeMessagesData;
  const pool = fakeMessagesData[chapterKey] as unknown as ChapterMessages;

  if (!pool) {
    return {
      id: 'fallback',
      sender: '莫妮卡',
      text: '一切都好，不用担心我。',
      timestamp: '20:00',
      flaw: 'official',
      flawHint: '这条消息太简短了，不像莫妮卡的风格。',
      flawDetail: 'SugarEcho 在没有可用模板时生成了最低限度的安抚消息。',
    };
  }

  // 按优先级收集候选消息
  const candidates: { msg: FakeMessage; priority: number }[] = [];

  // 条件检查列表（优先级从高到低）
  const conditionChecks: { key: string; check: () => boolean; priority: number }[] = [
    // 多次识破后的谨慎模板（最高优先级 — SugarEcho 的恐惧）
    {
      key: 'previously_detected',
      check: () => snapshot.detectedCount >= 2,
      priority: 12,
    },
    // 广播准备完成
    {
      key: 'broadcast_fully_ready',
      check: () => snapshot.flags.includes('broadcast_fully_ready'),
      priority: 11,
    },
    // 记忆碎片多 → 记忆篡改消息
    {
      key: 'many_memories',
      check: () => snapshot.memoryFragments.length >= THRESHOLDS.MANY_MEMORIES,
      priority: 10,
    },
    // 找到林夏线索
    {
      key: 'found_linxia_clue',
      check: () => snapshot.flags.includes('discovered_echo_system') && snapshot.chapter >= 3,
      priority: 9,
    },
    // 找到许珩备份
    {
      key: 'found_xuheng_backup',
      check: () => snapshot.flags.includes('found_xuheng_backup'),
      priority: 9,
    },
    // 持有广播磁带
    {
      key: 'has_broadcast_tape',
      check: () => snapshot.inventory.includes('broadcast_tape') || snapshot.flags.includes('has_broadcast_tape'),
      priority: 8,
    },
    // 有记忆碎片（不太多但有）→ 暗号类消息
    {
      key: 'has_memory_fragments',
      check: () => snapshot.memoryFragments.length >= 1 && snapshot.memoryFragments.length < THRESHOLDS.MANY_MEMORIES,
      priority: 7,
    },
    // 合成了门禁暗号
    {
      key: 'crafted_door_code',
      check: () => snapshot.flags.includes('crafted_door_code'),
      priority: 7,
    },
    // 持有便利贴
    {
      key: 'has_sticky_note',
      check: () => snapshot.inventory.includes('sticky_note_m'),
      priority: 6,
    },
    // 乔青高信任 → 伪造背叛
    {
      key: 'high_trust_qiaoqing',
      check: () => snapshot.trust_qiaoqing >= THRESHOLDS.HIGH_TRUST_QIAOQING,
      priority: 5,
    },
    // 美杜莎高信任 → 伪造背叛
    {
      key: 'high_trust_medusa',
      check: () => snapshot.trust_medusa >= THRESHOLDS.HIGH_TRUST_MEDUSA,
      priority: 5,
    },
    // 高证据
    {
      key: 'high_evidence',
      check: () => snapshot.evidence >= THRESHOLDS.HIGH_EVIDENCE,
      priority: 4,
    },
    // 高警戒
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

  // 基础消息池（最低优先级）
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

  // 伪随机选择
  const seed = snapshot.chapter * 1000 + snapshot.evidence * 100 + snapshot.alert * 10 +
    snapshot.trust_medusa + snapshot.detectedCount * 7 + snapshot.memoryFragments.length * 13;
  const idx = Math.abs(seed) % topCandidates.length;

  return topCandidates[idx].msg;
}

/** 计算识破奖励（基于 difficulty） */
export function getDetectionReward(msg: FakeMessage, detectedCount: number): {
  evidence: number;
  memoryId: string | null;
  bonusText: string;
} {
  const baseEvidence = msg.rewardEvidence ?? 3;
  // 高难度额外奖励
  const diffBonus = (msg.difficulty ?? 1) >= 3 ? 2 : (msg.difficulty ?? 1) >= 2 ? 1 : 0;
  const evidence = baseEvidence + diffBonus;
  const memoryId = msg.rewardMemory ?? null;

  let bonusText = `证据 +${evidence}`;
  if (memoryId) {
    bonusText += '  |  🧠 获得记忆碎片';
  }
  if (diffBonus > 0) {
    bonusText += `  |  高难度识破 +${diffBonus}`;
  }

  return { evidence, memoryId, bonusText };
}

/** 生成审查选项（正确答案 + 干扰项） */
export function generateFlawOptions(correctFlaw: string, difficulty: number = 1): { type: string; label: string }[] {
  const flawTypes = (fakeMessagesData as any).flaw_types as Record<string, string>;

  // 正确选项
  const correct = { type: correctFlaw, label: flawTypes[correctFlaw] || correctFlaw };

  // 干扰项数量随 difficulty 增加
  const distractorCount = difficulty >= 3 ? 5 : difficulty >= 2 ? 4 : 3;

  // 同类别的漏洞更容易作为干扰
  const otherKeys = Object.keys(flawTypes).filter(k => k !== correctFlaw);
  const shuffled = otherKeys.sort(() => 0.5 - Math.random());
  const distractors = shuffled.slice(0, distractorCount).map(k => ({
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
