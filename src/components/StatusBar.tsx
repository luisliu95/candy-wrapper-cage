import { useGameStore } from '../store/gameStore';

const CHAPTER_NAMES = ['', '第一章 粉色宿舍', '第二章 传单工坊', '第三章 广播室', '第四章 服务器雨夜'];

export default function StatusBar() {
  const { evidence, alert, trust_medusa, trust_xuheng, trust_qiaoqing, chapter, saveGame } = useGameStore();

  return (
    <div className="status-bar">
      <div className="status-chapter">
        {CHAPTER_NAMES[chapter] || ''}
      </div>
      <div className="status-values">
        <div className="status-item" title="证据值">
          <span className="status-label">🔍</span>
          <span className="status-value evidence">{evidence}</span>
        </div>
        <div className="status-item" title="警戒值">
          <span className="status-label">⚠️</span>
          <span className="status-value alert">{alert}</span>
        </div>
        <div className="status-item" title="美杜莎信任">
          <span className="status-label">🐍</span>
          <span className="status-value trust-m">{trust_medusa}</span>
        </div>
        <div className="status-item" title="许珩信任">
          <span className="status-label">📝</span>
          <span className="status-value trust-x">{trust_xuheng}</span>
        </div>
        <div className="status-item" title="乔青信任">
          <span className="status-label">🎙️</span>
          <span className="status-value trust-q">{trust_qiaoqing}</span>
        </div>
      </div>
      <div className="status-actions">
        <button className="pixel-btn btn-small" onClick={saveGame}>
          💾 存档
        </button>
      </div>
    </div>
  );
}
