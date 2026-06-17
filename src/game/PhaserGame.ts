import Phaser from 'phaser';
import RoomScene from './scenes/RoomScene';

/**
 * 创建 Phaser 游戏实例
 * 挂载到指定 DOM 容器，与 React 共存
 */
export function createPhaserGame(parentId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: parentId,
    pixelArt: true,
    backgroundColor: '#1a0a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [RoomScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // 阻止 Phaser 捕获所有键盘事件，让 React UI 也能收到
    input: {
      keyboard: {
        target: undefined,
      },
    },
  };

  return new Phaser.Game(config);
}
