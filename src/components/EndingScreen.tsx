import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Ending } from '../types/game';
import endingsData from '../data/endings.json';

export default function EndingScreen() {
  const { currentEnding, evidence, alert, trust_medusa, trust_xuheng, trust_qiaoqing, deleteSave } = useGameStore();
  const [showEpilogue, setShowEpilogue] = useState(false);

  if (!currentEnding) return null;
  const ending = (endingsData as Record<string, Ending & { epilogue?: string }>)[currentEnding];
  if (!ending) return null;

  const handleRestart = () => {
    deleteSave();
    window.location.reload();
  };

  return (
    <div className="ending-screen">
      <div className="pixel-candy" style={{ fontSize: 40, marginBottom: 20 }}>🍬</div>
      <h1 className="ending-title">{ending.title}</h1>
      <p className="ending-description">
        {showEpilogue && ending.epilogue ? ending.epilogue : ending.description}
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
          <div className="ending-stat-value" style={{ color: '#ff6b9d' }}>{trust_medusa}</div>
          <div className="ending-stat-label">美杜莎</div>
        </div>
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: '#ffaa00' }}>{trust_xuheng}</div>
          <div className="ending-stat-label">许珩</div>
        </div>
        <div className="ending-stat">
          <div className="ending-stat-value" style={{ color: '#00ff88' }}>{trust_qiaoqing}</div>
          <div className="ending-stat-label">乔青</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {ending.epilogue && !showEpilogue && (
          <button className="pixel-btn btn-accent" onClick={() => setShowEpilogue(true)}>
            📖 后日谈
          </button>
        )}
        <button className="pixel-btn" onClick={handleRestart}>
          ▶ 重新开始
        </button>
      </div>
    </div>
  );
}
