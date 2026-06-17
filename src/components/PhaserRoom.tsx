import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { createPhaserGame } from '../game/PhaserGame';
import { useGameStore } from '../store/gameStore';
import type { Hotspot } from '../types/game';

/**
 * PhaserRoom — Phaser 画布 + React 交互浮层
 *
 * Phaser 负责：顶视角房间渲染、角色移动、实体靠近检测
 * React 负责：热区弹窗、物品拾取确认、谜题弹出、剧情跳转
 */
export default function PhaserRoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const {
    currentRoom, exitRoom, addItem, applyTrigger, openPuzzle, goToNode,
    isHotspotUsed, useHotspot, showMessage, hasItem, hasFlag,
    incrementExamineCount, getHotspotExamineCount
  } = useGameStore();

  // 当前交互中的热区
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // 恢复 Phaser 输入
  const resumeInput = useCallback(() => {
    gameRef.current?.events.emit('resume-input');
  }, []);

  // 初始化 Phaser
  useEffect(() => {
    if (!containerRef.current || !currentRoom) return;

    const game = createPhaserGame('phaser-container');
    gameRef.current = game;

    // 等 Phaser 就绪后启动房间场景
    game.events.once('ready', () => {
      const scene = game.scene.getScene('RoomScene');
      if (scene) {
        scene.scene.restart({ roomId: currentRoom });
      }
    });

    // 监听实体交互事件
    game.events.on('entity-interact', (hotspot: Hotspot) => {
      incrementExamineCount(hotspot.id);
      setActiveHotspot(hotspot);
    });

    return () => {
      game.events.off('entity-interact');
      game.destroy(true);
      gameRef.current = null;
    };
  }, [currentRoom]);

  // 房间切换时重启场景
  useEffect(() => {
    if (!gameRef.current || !currentRoom) return;
    const scene = gameRef.current.scene.getScene('RoomScene');
    if (scene && scene.scene.isActive()) {
      (scene as any).switchRoom(currentRoom);
    }
  }, [currentRoom]);

  // 处理热区操作（复用原 RoomExplorer 的逻辑）
  const handleHotspotAction = (hotspot: Hotspot) => {
    if (hotspot.requireItem && !hasItem(hotspot.requireItem)) {
      showMessage('需要特定物品才能操作');
      closePopup();
      return;
    }
    if (hotspot.requireFlag && !hasFlag(hotspot.requireFlag)) {
      showMessage('还不能操作这里……也许需要先完成其他事情。');
      closePopup();
      return;
    }

    if (hotspot.puzzleId) {
      closePopup();
      openPuzzle(hotspot.puzzleId);
      return;
    }
    if (hotspot.storyJump) {
      closePopup();
      goToNode(hotspot.storyJump);
      return;
    }
    if (hotspot.dialogueId) {
      closePopup();
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
    closePopup();
  };

  const closePopup = () => {
    setActiveHotspot(null);
    resumeInput();
  };

  const isUsed = (h: Hotspot) => h.usedFlag ? isHotspotUsed(h.usedFlag) : false;

  const canInteract = (h: Hotspot): boolean => {
    if (h.puzzleId) return true;
    if (h.usedFlag && isHotspotUsed(h.usedFlag)) return false;
    return true;
  };

  const getActionLabel = (h: Hotspot): string => {
    if (h.puzzleId) return '🧩 尝试解谜';
    if (h.storyJump || h.dialogueId) return '💬 查看详情';
    if (h.itemId) return '📥 拾取物品';
    return '🔍 调查';
  };

  return (
    <div className="phaser-room-wrapper">
      {/* Phaser 画布容器 */}
      <div id="phaser-container" ref={containerRef} className="phaser-canvas-container" />

      {/* 房间顶栏（React 浮层） */}
      <div className="phaser-room-header">
        <span className="phaser-room-controls">
          WASD / 方向键移动 ｜ E 交互 ｜ ESC 离开
        </span>
        <button className="pixel-btn btn-small" onClick={exitRoom}>
          ✕ 离开房间
        </button>
      </div>

      {/* 交互弹窗（React 浮层，覆盖在 Phaser 画布上） */}
      {activeHotspot && (
        <>
          <div className="overlay" onClick={closePopup} />
          <div className="hotspot-tooltip">
            <h3>
              🔍 {activeHotspot.label}
              {isUsed(activeHotspot) && (
                <span className="hotspot-status-tag investigated">已调查</span>
              )}
            </h3>
            <p>{activeHotspot.description}</p>
            {activeHotspot.trigger && !isUsed(activeHotspot) && (
              <div className="hotspot-effect-preview">
                {activeHotspot.trigger.evidence && (
                  <span className="effect-tag evidence">+{activeHotspot.trigger.evidence} 证据</span>
                )}
                {activeHotspot.trigger.alert && (
                  <span className="effect-tag alert">+{activeHotspot.trigger.alert} 警戒</span>
                )}
              </div>
            )}
            <div className="hotspot-tooltip-actions">
              <button className="pixel-btn btn-small" onClick={closePopup}>
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
