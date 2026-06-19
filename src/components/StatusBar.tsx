import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getBondLevel, getBondLevelLabel, getAlertLevel, getAlertLevelLabel, getMeikongBroadcast } from '../types/game';

const CHAPTER_NAMES = ['', '第一章 粉色宿舍', '第二章 传单工坊', '第三章 广播室', '第四章 服务器雨夜'];

const BOND_COLORS: Record<string, string> = {
  low: '#888',
  mid: '#ffcc00',
  high: '#ff4488',
};

const ALERT_COLORS: Record<string, string> = {
  low: '#00ff88',
  mid: '#ffaa00',
  high: '#ff4444',
};

const SPEED_OPTIONS = [
  { label: '正常', value: 1.0 },
  { label: '1.1倍', value: 1.1 },
  { label: '1.2倍', value: 1.2 },
  { label: '1.5倍', value: 1.5 },
];

export default function StatusBar() {
  const { evidence, alert, trust_medusa, trust_xuheng, trust_qiaoqing, chapter, saveGame, playbackRate, setPlaybackRate } = useGameStore();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [lastAlertLevel, setLastAlertLevel] = useState(() => getAlertLevel(alert));

  const bondM = getBondLevel(trust_medusa);
  const bondX = getBondLevel(trust_xuheng);
  const bondQ = getBondLevel(trust_qiaoqing);
  const alertLevel = getAlertLevel(alert);

  // 当警戒等级变化时，显示美空广播
  useEffect(() => {
    if (alertLevel !== lastAlertLevel) {
      setLastAlertLevel(alertLevel);
      if (alertLevel !== 'low') {
        setShowBroadcast(true);
        const timer = setTimeout(() => setShowBroadcast(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [alertLevel, lastAlertLevel]);

  return (
    <>
      <div className={`status-bar alert-level-${alertLevel}`}>
        <div className="status-chapter">
          {CHAPTER_NAMES[chapter] || ''}
        </div>
        <div className="status-values">
          <div className="status-item" title="证据值">
            <span className="status-label">🔍</span>
            <span className="status-name">证据</span>
            <span className="status-value evidence">{evidence}</span>
          </div>
          <div className="status-item" title={`警戒 ${alert}/100 [${getAlertLevelLabel(alertLevel)}]`}>
            <span className="status-label">⚠️</span>
            <span className="status-name">警戒</span>
            <span className="status-value" style={{ color: ALERT_COLORS[alertLevel] }}>{alert}</span>
            {alertLevel !== 'low' && (
              <span className="alert-level-tag" data-level={alertLevel}>
                {getAlertLevelLabel(alertLevel)}
              </span>
            )}
          </div>
          <div className="status-item" title={`美杜莎羁绊 ${trust_medusa}/100 [${getBondLevelLabel(bondM)}]`}>
            <span className="status-label">🐍</span>
            <span className="status-name">羁绊·美杜莎</span>
            <span className="status-value" style={{ color: BOND_COLORS[bondM] }}>{trust_medusa}</span>
          </div>
          <div className="status-item" title={`许珩羁绊 ${trust_xuheng}/100 [${getBondLevelLabel(bondX)}]`}>
            <span className="status-label">📝</span>
            <span className="status-name">羁绊·许珩</span>
            <span className="status-value" style={{ color: BOND_COLORS[bondX] }}>{trust_xuheng}</span>
          </div>
          <div className="status-item" title={`乔青羁绊 ${trust_qiaoqing}/100 [${getBondLevelLabel(bondQ)}]`}>
            <span className="status-label">🎙️</span>
            <span className="status-name">羁绊·乔青</span>
            <span className="status-value" style={{ color: BOND_COLORS[bondQ] }}>{trust_qiaoqing}</span>
          </div>
        </div>
        <div className="status-actions">
          <button
            className="pixel-btn btn-small"
            onClick={() => {
              const idx = SPEED_OPTIONS.findIndex(s => s.value === playbackRate);
              const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
              setPlaybackRate(next.value);
            }}
            title="对白语速"
          >
            ⏩ {SPEED_OPTIONS.find(s => s.value === playbackRate)?.label || '正常'}
          </button>
          <button className="pixel-btn btn-small" onClick={saveGame}>
            💾 存档
          </button>
        </div>
      </div>

      {/* 美空广播条 */}
      {showBroadcast && (
        <div className={`meikong-broadcast alert-${alertLevel}`} onClick={() => setShowBroadcast(false)}>
          <span className="broadcast-icon">📢</span>
          <span className="broadcast-speaker">美空</span>
          <span className="broadcast-text">{getMeikongBroadcast(alertLevel)}</span>
        </div>
      )}
    </>
  );
}
