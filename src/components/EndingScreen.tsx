import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Ending } from '../types/game';
import { getBondLevel, getBondLevelLabel } from '../types/game';
import endingsData from '../data/endings.json';

interface EndingWithNpc extends Ending {
  epilogue?: string;
  npcEpilogues?: Record<string, string>;
}

export default function EndingScreen() {
  const { currentEnding, evidence, alert, trust_medusa, trust_xuheng, trust_qiaoqing, deleteSave } = useGameStore();
  const [showEpilogue, setShowEpilogue] = useState(false);
  const [showNpcEpilogue, setShowNpcEpilogue] = useState<string | null>(null);

  if (!currentEnding) return null;
  const ending = (endingsData as Record<string, EndingWithNpc>)[currentEnding];
  if (!ending) return null;

  const bondM = getBondLevel(trust_medusa);
  const bondX = getBondLevel(trust_xuheng);
  const bondQ = getBondLevel(trust_qiaoqing);

  // 根据羁绊等级选择对应的 NPC 后日谈
  const getNpcEpilogue = (npcKey: string): string | null => {
    if (!ending.npcEpilogues) return null;
    const levels = ['high', 'mid', 'low'];
    for (const level of levels) {
      const key = `${npcKey}_${level}`;
      if (ending.npcEpilogues[key]) {
        // 检查当前NPC是否达到该等级
        let currentLevel: string;
        if (npcKey === 'medusa') currentLevel = bondM;
        else if (npcKey === 'xuheng') currentLevel = bondX;
        else currentLevel = bondQ;

        // 匹配最接近的等级（从高到低）
        if (level === currentLevel || 
            (level === 'high' && currentLevel === 'high') ||
            (level === 'mid' && (currentLevel === 'mid' || currentLevel === 'high')) ||
            (level === 'low' && currentLevel === 'low')) {
          return ending.npcEpilogues[key];
        }
      }
    }
    return null;
  };

  // 精确匹配当前等级的后日谈
  const getMatchedNpcEpilogue = (npcKey: string): string | null => {
    if (!ending.npcEpilogues) return null;
    let currentLevel: string;
    if (npcKey === 'medusa') currentLevel = bondM;
    else if (npcKey === 'xuheng') currentLevel = bondX;
    else currentLevel = bondQ;

    // 先精确匹配，再降级匹配
    const key = `${npcKey}_${currentLevel}`;
    if (ending.npcEpilogues[key]) return ending.npcEpilogues[key];
    // 降级匹配
    if (currentLevel === 'high' && ending.npcEpilogues[`${npcKey}_mid`]) return ending.npcEpilogues[`${npcKey}_mid`];
    if (currentLevel === 'mid' && ending.npcEpilogues[`${npcKey}_low`]) return ending.npcEpilogues[`${npcKey}_low`];
    if (ending.npcEpilogues[`${npcKey}_low`]) return ending.npcEpilogues[`${npcKey}_low`];
    return null;
  };

  const npcEpilogues = [
    { key: 'medusa', name: '美杜莎', icon: '🐍', trust: trust_medusa, level: bondM },
    { key: 'xuheng', name: '许珩', icon: '📝', trust: trust_xuheng, level: bondX },
    { key: 'qiaoqing', name: '乔青', icon: '🎙️', trust: trust_qiaoqing, level: bondQ },
  ].map(npc => ({
    ...npc,
    epilogue: getMatchedNpcEpilogue(npc.key),
  })).filter(npc => npc.epilogue);

  const handleRestart = () => {
    deleteSave();
    window.location.reload();
  };

  const BOND_COLORS: Record<string, string> = {
    low: '#888',
    mid: '#ffcc00',
    high: '#ff4488',
  };

  return (
    <div className="ending-screen">
      <div className="pixel-candy" style={{ fontSize: 40, marginBottom: 20 }}>🍬</div>
      <h1 className="ending-title">{ending.title}</h1>
      <p className="ending-description">
        {showNpcEpilogue
          ? npcEpilogues.find(n => n.key === showNpcEpilogue)?.epilogue || ''
          : showEpilogue && ending.epilogue
            ? ending.epilogue
            : ending.description}
      </p>

      <div className="ending-stats">
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: '#00d4ff' }}>{evidence}</div>
          <div className="ending-stat-label">证据</div>
        </div>
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: '#ff4444' }}>{alert}</div>
          <div className="ending-stat-label">警戒</div>
        </div>
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: BOND_COLORS[bondM] }}>{trust_medusa}</div>
          <div className="ending-stat-label">美杜莎 [{getBondLevelLabel(bondM)}]</div>
        </div>
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: BOND_COLORS[bondX] }}>{trust_xuheng}</div>
          <div className="ending-stat-label">许珩 [{getBondLevelLabel(bondX)}]</div>
        </div>
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: BOND_COLORS[bondQ] }}>{trust_qiaoqing}</div>
          <div className="ending-stat-label">乔青 [{getBondLevelLabel(bondQ)}]</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ending.epilogue && !showEpilogue && !showNpcEpilogue && (
          <button className="pixel-btn btn-accent" onClick={() => { setShowEpilogue(true); setShowNpcEpilogue(null); }}>
            📖 后日谈
          </button>
        )}
        {npcEpilogues.map(npc => (
          <button
            key={npc.key}
            className={`pixel-btn ${showNpcEpilogue === npc.key ? 'btn-accent' : 'btn-small'}`}
            onClick={() => { setShowNpcEpilogue(showNpcEpilogue === npc.key ? null : npc.key); setShowEpilogue(false); }}
          >
            {npc.icon} {npc.name}的故事
          </button>
        ))}
        {(showEpilogue || showNpcEpilogue) && (
          <button className="pixel-btn btn-small" onClick={() => { setShowEpilogue(false); setShowNpcEpilogue(null); }}>
            ← 返回
          </button>
        )}
        <button className="pixel-btn" onClick={handleRestart}>
          ▶ 重新开始
        </button>
      </div>
    </div>
  );
}
