import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Item } from '../types/game';
import itemsData from '../data/items.json';

const CATEGORY_LABEL: Record<string, string> = {
  key: '🗝️ 钥匙',
  evidence: '🔍 证据',
  tool: '🔧 工具',
  document: '📄 文档',
  personal: '💝 私人',
};

export default function Inventory() {
  const {
    inventory, combineMode, combineSlots,
    toggleCombineMode, selectForCombine, clearCombineSlots,
    getAvailableRecipes
  } = useGameStore();
  const [open, setOpen] = useState(false);

  const items = inventory
    .map(id => (itemsData as Record<string, Item>)[id])
    .filter(Boolean);

  const availableRecipes = getAvailableRecipes();
  const hasRecipes = availableRecipes.length > 0;

  return (
    <>
      {/* 背包按钮 */}
      <button
        className="pixel-btn inventory-toggle"
        onClick={() => { setOpen(!open); if (open) { clearCombineSlots(); } }}
        title="背包"
      >
        🎒{inventory.length > 0 && (
          <sup style={{ fontSize: 10, color: '#ff6b9d' }}>{inventory.length}</sup>
        )}
      </button>

      {open && (
        <div className="inventory-panel">
          {/* 标题栏 */}
          <div className="inventory-title">
            <span>🎒 背包 ({items.length})</span>
            {items.length >= 2 && (
              <button
                className={`combine-toggle-btn ${combineMode ? 'active' : ''} ${hasRecipes && !combineMode ? 'has-recipe' : ''}`}
                onClick={toggleCombineMode}
                title={combineMode ? '退出组合模式' : '进入组合模式'}
              >
                {combineMode ? '✕ 取消' : '⚗️ 组合'}
              </button>
            )}
          </div>

          {/* 组合模式提示 */}
          {combineMode && (
            <div className="combine-hint">
              <div className="combine-slots">
                <span className={`combine-slot ${combineSlots[0] ? 'filled' : ''}`}>
                  {combineSlots[0]
                    ? (itemsData as Record<string, Item>)[combineSlots[0]]?.icon || '?'
                    : '?'}
                </span>
                <span className="combine-plus">+</span>
                <span className={`combine-slot ${combineSlots[1] ? 'filled' : ''}`}>
                  {combineSlots[1]
                    ? (itemsData as Record<string, Item>)[combineSlots[1]]?.icon || '?'
                    : '?'}
                </span>
                <span className="combine-equals">=</span>
                <span className="combine-slot result">?</span>
              </div>
              <div className="combine-tip">选择两个物品进行组合</div>
            </div>
          )}

          {/* 物品列表 */}
          {items.length === 0 ? (
            <div className="inventory-empty">背包是空的</div>
          ) : (
            items.map(item => {
              const isSelected = combineSlots.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`inventory-item ${combineMode ? 'combine-mode' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => combineMode && selectForCombine(item.id)}
                >
                  <span className="inventory-item-icon">{item.icon}</span>
                  <div className="inventory-item-info">
                    <div className="inventory-item-name">
                      {item.name}
                      <span style={{ fontSize: 9, color: '#8b7eaa', marginLeft: 6 }}>
                        {CATEGORY_LABEL[item.category] || ''}
                      </span>
                    </div>
                    <div className="inventory-item-desc">{item.description}</div>
                  </div>
                  {combineMode && (
                    <span className="combine-check">
                      {isSelected ? '✓' : '○'}
                    </span>
                  )}
                </div>
              );
            })
          )}

          {/* 可用配方提示 */}
          {!combineMode && hasRecipes && (
            <div className="recipe-hint">
              ⚗️ 有 {availableRecipes.length} 个可用组合
            </div>
          )}
        </div>
      )}
    </>
  );
}
