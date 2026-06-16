import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Room, Hotspot } from '../types/game';
import roomsData from '../data/scenes.json';

export default function RoomExplorer() {
  const {
    currentRoom, exitRoom, addItem, applyTrigger, openPuzzle, goToNode,
    isHotspotUsed, useHotspot, showMessage, hasItem, hasFlag
  } = useGameStore();
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  if (!currentRoom) return null;
  const room = (roomsData as Record<string, Room>)[currentRoom];
  if (!room) return null;

  const handleHotspotClick = (hotspot: Hotspot) => {
    // 检查前置条件
    if (hotspot.requireFlag && !hasFlag(hotspot.requireFlag)) {
      showMessage('还不能操作这里……也许需要先完成其他事情。');
      return;
    }
    setActiveHotspot(hotspot);
  };

  const handleHotspotAction = (hotspot: Hotspot) => {
    if (hotspot.requireItem && !hasItem(hotspot.requireItem)) {
      showMessage('需要特定物品才能操作');
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

        {room.hotspots.map(hotspot => (
          <div
            key={hotspot.id}
            className={`hotspot ${isUsed(hotspot) ? 'used' : ''}`}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.w}%`,
              height: `${hotspot.h}%`,
            }}
            onClick={() => handleHotspotClick(hotspot)}
          >
            <span className="hotspot-label">{hotspot.label}</span>
            {!isUsed(hotspot) && <span className="hotspot-pulse" />}
          </div>
        ))}
      </div>

      {activeHotspot && (
        <>
          <div className="overlay" onClick={() => setActiveHotspot(null)} />
          <div className="hotspot-tooltip">
            <h3>🔍 {activeHotspot.label}</h3>
            <p>{activeHotspot.description}</p>
            <div className="hotspot-tooltip-actions">
              <button className="pixel-btn btn-small" onClick={() => setActiveHotspot(null)}>
                关闭
              </button>
              {(!activeHotspot.usedFlag || !isHotspotUsed(activeHotspot.usedFlag) || activeHotspot.puzzleId) && (
                <button
                  className="pixel-btn btn-small btn-accent"
                  onClick={() => handleHotspotAction(activeHotspot)}
                >
                  {activeHotspot.puzzleId ? '尝试解谜' :
                   activeHotspot.storyJump || activeHotspot.dialogueId ? '查看详情' :
                   activeHotspot.itemId ? '拾取物品' : '调查'}
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
