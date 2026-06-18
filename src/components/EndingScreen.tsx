import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Ending } from '../types/game';
import { getBondLevel, getBondLevelLabel } from '../types/game';
import endingsData from '../data/endings.json';

interface EndingWithNpc extends Ending {
  subtitle?: string;
  epilogue?: string;
  lastMessage?: string;
  npcEpilogues?: Record<string, string>;
}

type ViewMode = 'scene' | 'epilogue' | 'npc' | 'message';

export default function EndingScreen() {
  const { currentEnding, evidence, alert, trust_medusa, trust_xuheng, trust_qiaoqing, memoryFragments, deleteSave } = useGameStore();
  const [viewMode, setViewMode] = useState<ViewMode>('scene');
  const [activeNpc, setActiveNpc] = useState<string | null>(null);

  if (!currentEnding) return null;
  const ending = (endingsData as Record<string, EndingWithNpc>)[currentEnding];
  if (!ending) return null;

  const bondM = getBondLevel(trust_medusa);
  const bondX = getBondLevel(trust_xuheng);
  const bondQ = getBondLevel(trust_qiaoqing);

  const getMatchedNpcEpilogue = (npcKey: string): string | null => {
    if (!ending.npcEpilogues) return null;
    let currentLevel: string;
    if (npcKey === 'medusa') currentLevel = bondM;
    else if (npcKey === 'xuheng') currentLevel = bondX;
    else currentLevel = bondQ;

    const key = `${npcKey}_${currentLevel}`;
    if (ending.npcEpilogues[key]) return ending.npcEpilogues[key];
    if (currentLevel === 'high' && ending.npcEpilogues[`${npcKey}_mid`]) return ending.npcEpilogues[`${npcKey}_mid`];
    if ((currentLevel === 'high' || currentLevel === 'mid') && ending.npcEpilogues[`${npcKey}_low`]) return ending.npcEpilogues[`${npcKey}_low`];
    if (ending.npcEpilogues[`${npcKey}_low`]) return ending.npcEpilogues[`${npcKey}_low`];
    return null;
  };

  const npcList = [
    { key: 'medusa', name: '美杜莎', icon: '🐍', trust: trust_medusa, level: bondM },
    { key: 'xuheng', name: '许珩', icon: '📝', trust: trust_xuheng, level: bondX },
    { key: 'qiaoqing', name: '乔青', icon: '🎙️', trust: trust_qiaoqing, level: bondQ },
  ].map(npc => ({ ...npc, epilogue: getMatchedNpcEpilogue(npc.key) })).filter(npc => npc.epilogue);

  const handleRestart = () => { deleteSave(); window.location.reload(); };

  const BOND_COLORS: Record<string, string> = { low: '#888', mid: '#ffcc00', high: '#ff4488' };

  // 根据结局选择顶部 emoji
  const topIcon = currentEnding === 'ending_true_echo' ? '🕊️'
    : currentEnding === 'ending_paper_door' ? '🚪' : '🍬';

  // 当前显示文本
  let displayText = ending.description;
  if (viewMode === 'epilogue') displayText = ending.epilogue || '';
  if (viewMode === 'npc' && activeNpc) displayText = npcList.find(n => n.key === activeNpc)?.epilogue || '';
  if (viewMode === 'message') displayText = '';

  return (
    <div className="ending-screen">
      <div className="pixel-candy" style={{ fontSize: 40, marginBottom: 12 }}>{topIcon}</div>
      <h1 className="ending-title">{ending.title}</h1>
      {ending.subtitle && viewMode === 'scene' && (
        <div className="ending-subtitle">{ending.subtitle}</div>
      )}

      {/* 最后一条消息视图 */}
      {viewMode === 'message' && ending.lastMessage ? (
        <div className="ending-last-message">
          <div className="last-msg-phone">
            <div className="last-msg-header">💬 消息</div>
            <div className="last-msg-bubble">
              <div className="last-msg-sender">莫妮卡</div>
              <div className="last-msg-text">{ending.lastMessage}</div>
              <div className="last-msg-time">刚刚 ✓✓</div>
            </div>
            <div className="last-msg-note">
              {currentEnding === 'ending_true_echo'
                ? '这一次，是你自己发的。'
                : currentEnding === 'ending_paper_door'
                  ? '你不确定这条消息够不够真实。'
                  : '这条消息不是你发的。但你已经分不清了。'}
            </div>
          </div>
        </div>
      ) : (
        <p className="ending-description">{displayText}</p>
      )}

      {/* 数据统计 */}
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
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: '#aa88ff' }}>{memoryFragments.length}</div>
          <div className="ending-stat-label">记忆碎片</div>
        </div>
      </div>

      {/* 按钮区 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {viewMode === 'scene' && ending.epilogue && (
          <button className="pixel-btn btn-accent" onClick={() => setViewMode('epilogue')}>
            📖 后日谈
          </button>
        )}
        {viewMode === 'scene' && ending.lastMessage && (
          <button className="pixel-btn btn-small" onClick={() => setViewMode('message')}>
            📱 最后一条消息
          </button>
        )}
        {(viewMode === 'scene' || viewMode === 'epilogue') && npcList.map(npc => (
          <button
            key={npc.key}
            className={`pixel-btn btn-small ${viewMode === 'npc' && activeNpc === npc.key ? 'btn-accent' : ''}`}
            onClick={() => { setViewMode('npc'); setActiveNpc(npc.key); }}
          >
            {npc.icon} {npc.name}
          </button>
        ))}
        {viewMode !== 'scene' && (
          <button className="pixel-btn btn-small" onClick={() => { setViewMode('scene'); setActiveNpc(null); }}>
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
