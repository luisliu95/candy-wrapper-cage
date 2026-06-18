import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { MemoryFragment } from '../types/game';
import memoryData from '../data/memoryFragments.json';

const allMemories = memoryData as MemoryFragment[];
const TOTAL = allMemories.length;

export default function MemoryPanel() {
  const { memoryFragments } = useGameStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MemoryFragment | null>(null);

  const collected = allMemories.filter(m => memoryFragments.includes(m.id));
  const count = collected.length;

  return (
    <>
      {/* 触发按钮 */}
      <button
        className="pixel-btn memory-toggle"
        onClick={() => { setOpen(!open); setSelected(null); }}
        title={`记忆碎片 ${count}/${TOTAL}`}
      >
        🧠
        {count > 0 && <sup style={{ fontSize: 10, color: '#00d4ff' }}>{count}</sup>}
      </button>

      {open && (
        <div className="memory-panel">
          <div className="memory-panel-title">
            🧠 私人记忆碎片
            <span className="memory-counter">{count} / {TOTAL}</span>
          </div>

          {/* 进度条 */}
          <div className="memory-progress-bar">
            <div
              className="memory-progress-fill"
              style={{ width: `${(count / TOTAL) * 100}%` }}
            />
          </div>
          <div className="memory-progress-hint">
            {count < 3 ? `再收集 ${3 - count} 个碎片可解锁真相结局`
             : count < TOTAL ? `继续探索以收集更多碎片`
             : `所有记忆碎片已收集`}
          </div>

          {/* 碎片网格 */}
          <div className="memory-grid">
            {allMemories.map(mem => {
              const owned = memoryFragments.includes(mem.id);
              return (
                <div
                  key={mem.id}
                  className={`memory-cell ${owned ? 'owned' : 'locked'} ${selected?.id === mem.id ? 'active' : ''}`}
                  onClick={() => owned && setSelected(selected?.id === mem.id ? null : mem)}
                >
                  <span className="memory-cell-icon">{owned ? mem.icon : '？'}</span>
                  <span className="memory-cell-ch">Ch.{mem.chapter}</span>
                </div>
              );
            })}
          </div>

          {/* 详情 */}
          {selected && (
            <div className="memory-detail">
              <div className="memory-detail-title">{selected.icon} {selected.title}</div>
              <p className="memory-detail-desc">{selected.description}</p>
              <blockquote className="memory-detail-quote">{selected.quote}</blockquote>
              <div className="memory-detail-from">来源：{selected.obtainedFrom}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
