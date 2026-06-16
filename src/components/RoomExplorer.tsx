import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Room, Hotspot } from '../types/game';
import roomsData from '../data/scenes.json';

export default function RoomExplorer() {
  const {
    currentRoom, exitRoom, addItem, applyTrigger, openPuzzle, goToNode,
    isHotspotUsed, useHotspot, showMessage, hasItem, hasFlag,
    getHotspotExamineCount, incrementExamineCount, inventory
  } = useGameStore();
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  if (!currentRoom) return null;
  const room = (roomsData as Record<string, Room>)[currentRoom];
  if (!room) return null;

  const getDescription = (hotspot: Hotspot) => {
    if (hotspot.multiDescriptions && hotspot.multiDescriptions.length > 0) {
      const count = getHotspotExamineCount(hotspot.id);
      const idx = Math.min(count, hotspot.multiDescriptions.length - 1);
      return hotspot.multiDescriptions[idx];
    }
    return hotspot.description;
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.requireFlag && !hasFlag(hotspot.requireFlag)) {
      showMessage('还不能操作这里……也许需要先完成其他事情。');
      return;
    }
    incrementExamineCount(hotspot.id);
    setActiveHotspot(hotspot);
  };

  const checkMultiItems = (hotspot: Hotspot): boolean => {
    if (!hotspot.requireItems) return true;
    return hotspot.requireItems.every(id => inventory.includes(id));
  };

  const handleHotspotAction = (hotspot: Hotspot) => {
    // 单物品需求
    if (hotspot.requireItem && !hasItem(hotspot.requireItem)) {
      showMessage('需要特定物品才能操作');
      setActiveHotspot(null);
      return;
    }
    // 多物品需求
    if (!checkMultiItems(hotspot)) {
      showMessage('还缺少一些必要的物品……');
      setActiveHotspot(null);
      return;
    }

    if (hotspot.puzzleId) {
      setActiveHotspot(null);
      openPuzzle(hotspot.puzzleId);
      return;
    }
    if (hotspot.storyJump) {
      setActiveHotspot(null);
      goToNode(hotspot.storyJump);
      return;
    }
    if (hotspot.dialogueId) {
      setActiveHotspot(null);
      goToNode(hotspot.dialogueId);
      return;
    }

    if (hotspot.itemId && hotspot.usedFlag && !isHotspotUsed(hotspot.usedFlag)) {
      addItem(hotspot.itemId);
      useHotspot(hotspot.usedFlag);
    }
    if (hotspot.trigger && (!hotspot.usedFlag || !isHotspotUsed(hotspot.usedFlag))) {
      applyTrigger(hotspot.trigger);
      if (hotspot.usedFlag) {
        useHotspot(hotspot.usedFlag);
      }
    }
    setActiveHotspot(null);
  };

  const isUsed = (hotspot: Hotspot) => {
    return hotspot.usedFlag ? isHotspotUsed(hotspot.usedFlag) : false;
  };

  const canInteract = (hotspot: Hotspot): boolean => {
    if (hotspot.puzzleId) return true;
    if (hotspot.usedFlag && isHotspotUsed(hotspot.usedFlag)) return false;
    return true;
  };

  const getActionLabel = (hotspot: Hotspot): string => {
    if (hotspot.puzzleId) return '🧩 尝试解谜';
    if (hotspot.storyJump || hotspot.dialogueId) return '💬 查看详情';
    if (hotspot.itemId) return '📥 拾取物品';
    return '🔍 调查';
  };

  return (
    <div className="room-explorer">
      <div className="room-background" style={{ background: room.background }}>
        <RoomDecoration roomId={room.id} />

        <div className="room-header">
          <div>
            <span className="room-name">📍 {room.name}</span>
            <span className="room-desc" style={{ marginLeft: 12 }}>{room.description}</span>
          </div>
          <button className="pixel-btn btn-small" onClick={exitRoom}>
            ✕ 离开房间
          </button>
        </div>

        {/* 热区网格 */}
        {room.hotspots.map(hotspot => {
          const used = isUsed(hotspot);
          const locked = (hotspot.requireFlag && !hasFlag(hotspot.requireFlag));
          return (
            <div
              key={hotspot.id}
              className={`hotspot ${used ? 'used' : ''} ${locked ? 'locked' : ''}`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.w}%`,
                height: `${hotspot.h}%`,
              }}
              onClick={() => handleHotspotClick(hotspot)}
            >
              <span className="hotspot-label">
                {hotspot.icon || ''}{hotspot.icon ? ' ' : ''}{hotspot.label}
              </span>
              {!used && !locked && <span className="hotspot-pulse" />}
              {locked && <span className="hotspot-lock">🔒</span>}
            </div>
          );
        })}
      </div>

      {/* 热区交互弹窗 */}
      {activeHotspot && (
        <>
          <div className="overlay" onClick={() => setActiveHotspot(null)} />
          <div className="hotspot-tooltip">
            <h3>
              {activeHotspot.icon || '🔍'} {activeHotspot.label}
              {isUsed(activeHotspot) && (
                <span className="hotspot-status-tag investigated">已调查</span>
              )}
            </h3>
            <p>{getDescription(activeHotspot)}</p>

            {/* 触发效果预览 */}
            {activeHotspot.trigger && !isUsed(activeHotspot) && (
              <div className="hotspot-effect-preview">
                {activeHotspot.trigger.evidence && (
                  <span className="effect-tag evidence">+{activeHotspot.trigger.evidence} 证据</span>
                )}
                {activeHotspot.trigger.alert && (
                  <span className="effect-tag alert">+{activeHotspot.trigger.alert} 警戒</span>
                )}
                {activeHotspot.trigger.trust_medusa && (
                  <span className="effect-tag trust">+{activeHotspot.trigger.trust_medusa} 美杜莎</span>
                )}
                {activeHotspot.trigger.trust_xuheng && (
                  <span className="effect-tag trust">+{activeHotspot.trigger.trust_xuheng} 许珩</span>
                )}
                {activeHotspot.trigger.trust_qiaoqing && (
                  <span className="effect-tag trust">+{activeHotspot.trigger.trust_qiaoqing} 乔青</span>
                )}
              </div>
            )}

            <div className="hotspot-tooltip-actions">
              <button className="pixel-btn btn-small" onClick={() => setActiveHotspot(null)}>
                关闭
              </button>
              {canInteract(activeHotspot) && (
                <button
                  className="pixel-btn btn-small btn-accent"
                  onClick={() => handleHotspotAction(activeHotspot)}
                >
                  {getActionLabel(activeHotspot)}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RoomDecoration({ roomId }: { roomId: string }) {
  const configs: Record<string, { emojis: string[]; count: number; opacity: number }> = {
    ch1_dorm: { emojis: ['🍬', '🎀', '🌸', '🧸'], count: 10, opacity: 0.25 },
    ch2_workshop: { emojis: ['📄', '🖨️', '📰', '✏️'], count: 8, opacity: 0.2 },
    ch3_broadcast: { emojis: ['🎙️', '📻', '🎵', '📼'], count: 8, opacity: 0.2 },
    ch4_server: { emojis: ['💻', '🖥️', '⚡', '🔌'], count: 10, opacity: 0.15 },
  };
  const config = configs[roomId];
  if (!config) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[...Array(config.count)].map((_, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${8 + (i * 9) % 85}%`,
          top: `${15 + (i * 13) % 70}%`,
          fontSize: `${14 + (i % 3) * 6}px`,
          opacity: config.opacity,
          transform: `rotate(${i * 25}deg)`,
        }}>
          {config.emojis[i % config.emojis.length]}
        </span>
      ))}
    </div>
  );
}
