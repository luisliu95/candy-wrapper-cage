import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Item } from '../types/game';
import itemsData from '../data/items.json';

const CATEGORY_LABEL: Record<string, string> = {
  key: '🗝️ 钥匙',
  evidence: '🔍 证据',
  tool: '🔧 工具',
  document: '📄 文档',
  personal: '💝 私人物品',
};

export default function Inventory() {
  const { inventory } = useGameStore();
  const [open, setOpen] = useState(false);

  const items = inventory
    .map(id => (itemsData as Record<string, Item>)[id])
    .filter(Boolean);

  return (
    <>
      <button
        className="pixel-btn inventory-toggle"
        onClick={() => setOpen(!open)}
        title="背包"
      >
        🎒{inventory.length > 0 && <sup style={{ fontSize: 10, color: '#ff6b9d' }}>{inventory.length}</sup>}
      </button>

      {open && (
        <div className="inventory-panel">
          <div className="inventory-title">🎒 背包 ({items.length})</div>
          {items.length === 0 ? (
            <div className="inventory-empty">背包是空的</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="inventory-item">
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
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
