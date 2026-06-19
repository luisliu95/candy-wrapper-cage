import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import type { Room, Hotspot, InteractionType } from '../../types/game';
import roomsData from '../../data/scenes.json';

// ===== 常量 =====

const ROOM_COLORS: Record<string, number> = {
  ch1_dorm: 0x4a1942,
  ch2_workshop: 0x1e3a1e,
  ch3_broadcast: 0x1e1e5a,
  ch4_server: 0x0d0d2a,
};

const PROMPT_CONFIG: Record<InteractionType, { prefix: string; color: string }> = {
  investigate: { prefix: 'E：调查', color: '#00d4ff' },
  pickup:      { prefix: 'E：拾取', color: '#00ff88' },
  talk:        { prefix: 'E：对话', color: '#ffaa00' },
  use:         { prefix: 'E：使用', color: '#ffd700' },
  puzzle:      { prefix: 'E：解谜', color: '#ff6b9d' },
  exit:        { prefix: 'E：前往', color: '#44aa44' },
};

const DEFAULT_INTERACTION_RADIUS = 50;
const DEFAULT_SPRITE_COLOR = 0x997755;
const SPRITE_W = 140;
const SPRITE_H = 260;
const PLAYER_SCALE = 0.18; // 140*0.18≈25px 宽，260*0.18≈47px 高
const FRAME_COUNT = 4; // 每方向4帧

interface EntityObj {
  rect: Phaser.GameObjects.Rectangle;
  hotspot: Hotspot;
  label: Phaser.GameObjects.Text;
  iconText: Phaser.GameObjects.Text;
  radius: number;
}

function hotspotToPixel(h: Hotspot, cw: number, ch: number) {
  return {
    x: (h.x / 100) * cw + ((h.w / 100) * cw) / 2,
    y: (h.y / 100) * ch + ((h.h / 100) * ch) / 2,
    w: (h.w / 100) * cw,
    h: (h.h / 100) * ch,
  };
}

// ===== 精灵图片路径在 public/sprites/ 目录 =====
// 命名：monika_{down|left|right|up}_{0|1|2|3}.jpg
// 每帧尺寸：140×260，通过 PLAYER_SCALE 缩放到画布适配大小

// ===== 房间背景图路径 =====

const ROOM_BG_PATHS: Record<string, string> = {
  ch1_dorm:      '/assets/rooms/ch1_dorm.png',
  ch2_workshop:  '/assets/rooms/ch2_workshop.png',
  ch3_broadcast: '/assets/rooms/ch3_broadcast.png',
  ch4_server:    '/assets/rooms/ch4_server.png',
};

// ===== RoomScene =====

export default class RoomScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private entities: EntityObj[] = [];
  private nearbyEntity: Hotspot | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private speed = 160;
  private roomId = '';
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private collisionRects: Phaser.GameObjects.Rectangle[] = [];
  private hasRoomBg = false;

  constructor() {
    super({ key: 'RoomScene' });
  }

  init(data: { roomId: string }) {
    this.roomId = data.roomId || 'ch1_dorm';
  }

  preload() {
    // 加载 16 张莫妮卡精灵帧图（每方向4帧）
    const directions = ['down', 'left', 'right', 'up'];
    for (const dir of directions) {
      for (let i = 0; i < 4; i++) {
        const key = `monika_${dir}_${i}`;
        if (!this.textures.exists(key)) {
          this.load.image(key, `/sprites/monika_${dir}_${i}.jpg`);
        }
      }
    }
    // 尝试加载房间背景
    const bgPath = ROOM_BG_PATHS[this.roomId];
    const bgKey = `room_bg_${this.roomId}`;
    if (bgPath && !this.textures.exists(bgKey)) {
      this.load.image(bgKey, bgPath);
      this.load.once(`filecomplete-image-${bgKey}`, () => {
        this.hasRoomBg = true;
      });
    } else if (this.textures.exists(bgKey)) {
      this.hasRoomBg = true;
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ===== 房间背景 =====
    const bgKey = `room_bg_${this.roomId}`;
    if (this.hasRoomBg && this.textures.exists(bgKey)) {
      const bg = this.add.image(W / 2, H / 2, bgKey);
      bg.setDisplaySize(W, H);
      bg.setDepth(0);
    } else {
      // 纯色 + 网格 fallback
      const bgColor = ROOM_COLORS[this.roomId] || 0x1a0a2e;
      this.cameras.main.setBackgroundColor(bgColor);
      const gridG = this.add.graphics();
      gridG.lineStyle(1, 0xffffff, 0.04);
      for (let x = 0; x <= W; x += 40) gridG.lineBetween(x, 0, x, H);
      for (let y = 0; y <= H; y += 40) gridG.lineBetween(0, y, W, y);
    }

    // ===== 交互实体 =====
    const room = (roomsData as Record<string, Room>)[this.roomId];
    this.entities = [];
    this.collisionRects = [];
    const store = useGameStore.getState();

    if (room) {
      for (const hs of room.hotspots) {
        const pos = hotspotToPixel(hs, W, H);
        const color = hs.spriteColor ?? DEFAULT_SPRITE_COLOR;
        const isUsed = hs.usedFlag ? store.usedHotspots.includes(hs.usedFlag) : false;

        const alpha = isUsed ? 0.3 : 0.6;
        const rect = this.add.rectangle(pos.x, pos.y, pos.w, pos.h, color, alpha);
        rect.setStrokeStyle(2, 0xffd700, isUsed ? 0.15 : 0.5);
        rect.setDepth(1);

        if (hs.blocked) {
          this.physics.world.enable(rect);
          const rbody = rect.body as Phaser.Physics.Arcade.Body;
          rbody.setImmovable(true);
          rbody.moves = false;
          this.collisionRects.push(rect);
        }

        const iconText = this.add.text(pos.x, pos.y, hs.icon || '', {
          fontSize: '18px',
        }).setOrigin(0.5).setDepth(3);

        const label = this.add.text(pos.x, pos.y - pos.h / 2 - 12, hs.label, {
          fontSize: '10px',
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          color: isUsed ? '#666666' : '#ffd700',
          stroke: '#000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(3);

        const radius = hs.interactionRadius ?? DEFAULT_INTERACTION_RADIUS;
        this.entities.push({ rect, hotspot: hs, label, iconText, radius });
      }
    }

    // ===== 莫妮卡角色 =====
    const spawn = (room as any)?.playerSpawn;
    const spawnX = spawn ? (spawn.x / 100) * W : W / 2;
    const spawnY = spawn ? (spawn.y / 100) * H : H * 0.6;

    // 创建动画（使用16张单独纹理）
    this.createAnimations();

    // 创建 Sprite（使用 down_0 作为初始帧）
    this.player = this.add.sprite(spawnX, spawnY, 'monika_down_0');
    this.player.setScale(PLAYER_SCALE);
    this.player.setDepth(10);

    // 物理
    this.physics.world.enable(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // 碰撞体 = 角色下半身区域（脚部）
    body.setSize(SPRITE_W * 0.6, SPRITE_H * 0.4);
    body.setOffset(SPRITE_W * 0.2, SPRITE_H * 0.55);

    // 碰撞
    for (const cr of this.collisionRects) {
      this.physics.add.collider(this.player, cr);
    }

    // ===== 键盘 =====
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // E 键提示
    this.promptText = this.add.text(W / 2, H - 28, '', {
      fontSize: '13px',
      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: 'rgba(26,10,46,0.9)',
      padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setDepth(20);

    // E 键交互
    this.interactKey.on('down', () => {
      if (!this.nearbyEntity) return;
      const hs = this.nearbyEntity;
      const needPopup = hs.interactionType === 'investigate' || hs.multiDescriptions;
      if (needPopup) {
        this.game.events.emit('pause-input');
        this.game.events.emit('entity-interact', hs);
      } else {
        const result = useGameStore.getState().triggerInteraction(hs.id);
        if (result.handled) this.refreshEntityVisual(hs.id);
      }
    });

    // ESC 退出
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      useGameStore.getState().exitRoom();
    });

    // 暂停/恢复
    this.game.events.on('pause-input', () => { this.input.keyboard!.enabled = false; });
    this.game.events.on('resume-input', () => { this.input.keyboard!.enabled = true; });
  }

  /** 创建 4 方向 × 4 帧动画（使用 16 张独立纹理） */
  private createAnimations() {
    const anims = this.anims;
    const directions = ['down', 'left', 'right', 'up'];

    for (const dir of directions) {
      // idle 动画：只用第 0 帧
      const idleKey = `monika_${dir}_idle`;
      if (!anims.exists(idleKey)) {
        anims.create({
          key: idleKey,
          frames: [{ key: `monika_${dir}_0` }],
          frameRate: 1,
          repeat: 0,
        });
      }

      // walk 动画：4 帧循环
      const walkKey = `monika_${dir}_walk`;
      if (!anims.exists(walkKey)) {
        anims.create({
          key: walkKey,
          frames: [
            { key: `monika_${dir}_0` },
            { key: `monika_${dir}_1` },
            { key: `monika_${dir}_2` },
            { key: `monika_${dir}_3` },
          ],
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -this.speed; this.facing = 'left'; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = this.speed; this.facing = 'right'; }
    if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -this.speed; this.facing = 'up'; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = this.speed; this.facing = 'down'; }

    body.setVelocity(vx, vy);

    // 播放动画
    const isMoving = vx !== 0 || vy !== 0;
    const animKey = `monika_${this.facing}_${isMoving ? 'walk' : 'idle'}`;
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey, true);
    }

    // 靠近检测
    this.nearbyEntity = null;
    const px = this.player.x, py = this.player.y;
    let closestDist = Infinity;
    const store = useGameStore.getState();

    for (const e of this.entities) {
      const dist = Phaser.Math.Distance.Between(px, py, e.rect.x, e.rect.y);
      const triggerDist = e.radius + Math.max(e.rect.width, e.rect.height) / 2;
      const isUsed = e.hotspot.usedFlag ? store.usedHotspots.includes(e.hotspot.usedFlag) : false;
      const isLocked = (e.hotspot.requireFlag && !store.flags.includes(e.hotspot.requireFlag))
                     || (e.hotspot.requireItem && !store.inventory.includes(e.hotspot.requireItem));

      if (dist < triggerDist && dist < closestDist) {
        closestDist = dist;
        this.nearbyEntity = e.hotspot;
        e.rect.setStrokeStyle(3, isLocked ? 0xff4444 : 0xffd700, 1);
        e.label.setColor(isUsed ? '#888888' : '#ffffff');
      } else {
        e.rect.setStrokeStyle(2, 0xffd700, isUsed ? 0.15 : 0.3);
        e.label.setColor(isUsed ? '#666666' : '#ffd700');
      }
    }

    // 提示
    if (this.nearbyEntity) {
      const hs = this.nearbyEntity;
      const type = hs.interactionType || 'investigate';
      const conf = PROMPT_CONFIG[type] || PROMPT_CONFIG.investigate;
      const isUsed = hs.usedFlag ? store.usedHotspots.includes(hs.usedFlag) : false;

      if (isUsed && !hs.puzzleId) {
        this.promptText.setText(`${hs.label}（已调查）`);
        this.promptText.setColor('#666666');
      } else {
        this.promptText.setText(`${conf.prefix}：${hs.label}`);
        this.promptText.setColor(conf.color);
      }
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private refreshEntityVisual(hotspotId: string) {
    const entity = this.entities.find(e => e.hotspot.id === hotspotId);
    if (!entity) return;
    const store = useGameStore.getState();
    const isUsed = entity.hotspot.usedFlag ? store.usedHotspots.includes(entity.hotspot.usedFlag) : false;
    if (isUsed) {
      entity.rect.setAlpha(0.3);
      entity.rect.setStrokeStyle(2, 0xffd700, 0.15);
      entity.label.setColor('#666666');
    }
  }

  switchRoom(roomId: string) {
    this.roomId = roomId;
    this.hasRoomBg = false;
    this.scene.restart({ roomId });
  }
}
