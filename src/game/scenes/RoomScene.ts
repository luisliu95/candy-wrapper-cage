import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import type { Room, Hotspot, InteractionType } from '../../types/game';
import roomsData from '../../data/scenes.json';

const ROOM_COLORS: Record<string, number> = {
  ch1_dorm: 0x4a1942,
  ch2_workshop: 0x1e3a1e,
  ch3_broadcast: 0x1e1e5a,
  ch4_server: 0x0d0d2a,
};

/** 交互类型 → 提示前缀和图标 */
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

export default class RoomScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private entities: EntityObj[] = [];
  private nearbyEntity: Hotspot | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private speed = 160;
  private roomId = '';
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private playerHead!: Phaser.GameObjects.Rectangle;
  private playerEyeL!: Phaser.GameObjects.Rectangle;
  private playerEyeR!: Phaser.GameObjects.Rectangle;
  private playerHair!: Phaser.GameObjects.Rectangle;
  private collisionRects: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'RoomScene' });
  }

  init(data: { roomId: string }) {
    this.roomId = data.roomId || 'ch1_dorm';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const bgColor = ROOM_COLORS[this.roomId] || 0x1a0a2e;
    this.cameras.main.setBackgroundColor(bgColor);

    // 地板网格
    const gridG = this.add.graphics();
    gridG.lineStyle(1, 0xffffff, 0.04);
    for (let x = 0; x <= W; x += 40) gridG.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 40) gridG.lineBetween(0, y, W, y);

    // 加载交互实体
    const room = (roomsData as Record<string, Room>)[this.roomId];
    this.entities = [];
    this.collisionRects = [];
    const store = useGameStore.getState();

    if (room) {
      for (const hs of room.hotspots) {
        const pos = hotspotToPixel(hs, W, H);
        const color = hs.spriteColor ?? DEFAULT_SPRITE_COLOR;
        const isUsed = hs.usedFlag ? store.usedHotspots.includes(hs.usedFlag) : false;

        // 实体矩形
        const alpha = isUsed ? 0.3 : 0.6;
        const rect = this.add.rectangle(pos.x, pos.y, pos.w, pos.h, color, alpha);
        rect.setStrokeStyle(2, 0xffd700, isUsed ? 0.15 : 0.5);

        // 碰撞体
        if (hs.blocked) {
          this.physics.world.enable(rect);
          const rbody = rect.body as Phaser.Physics.Arcade.Body;
          rbody.setImmovable(true);
          rbody.moves = false;
          this.collisionRects.push(rect);
        }

        // 图标
        const iconText = this.add.text(pos.x, pos.y, hs.icon || '', {
          fontSize: '18px',
        }).setOrigin(0.5).setDepth(3);

        // 标签
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

    // 莫妮卡（使用 playerSpawn 或默认居中偏下）
    const spawn = (room as any)?.playerSpawn;
    const spawnX = spawn ? (spawn.x / 100) * W : W / 2;
    const spawnY = spawn ? (spawn.y / 100) * H : H * 0.6;
    this.player = this.add.container(spawnX, spawnY);
    this.playerBody = this.add.rectangle(0, 4, 16, 20, 0xff6b9d);
    this.playerHead = this.add.rectangle(0, -10, 14, 14, 0xffddbb);
    this.playerHair = this.add.rectangle(0, -16, 16, 6, 0x553322);
    this.playerEyeL = this.add.rectangle(-3, -10, 3, 3, 0x222222);
    this.playerEyeR = this.add.rectangle(3, -10, 3, 3, 0x222222);
    this.player.add([this.playerBody, this.playerHead, this.playerHair, this.playerEyeL, this.playerEyeR]);
    this.player.setSize(16, 28).setDepth(10);

    this.physics.world.enable(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(16, 20);
    body.setOffset(-8, -10);

    // 碰撞
    for (const cr of this.collisionRects) {
      this.physics.add.collider(this.player, cr);
    }

    // 键盘
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // E 键提示（底部）
    this.promptText = this.add.text(W / 2, H - 28, '', {
      fontSize: '13px',
      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: 'rgba(26,10,46,0.9)',
      padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setDepth(20);

    // E 键交互 —— 分两条路径
    this.interactKey.on('down', () => {
      if (!this.nearbyEntity) return;
      const hs = this.nearbyEntity;

      // 需要弹 React 弹窗的类型：investigate（显示描述）+ 有多次调查文本
      // 直接走 triggerInteraction 的类型：pickup / use / puzzle / exit / talk
      const needPopup = hs.interactionType === 'investigate' || hs.multiDescriptions;

      if (needPopup) {
        this.game.events.emit('pause-input');
        this.game.events.emit('entity-interact', hs);
      } else {
        // 直接调用统一入口
        const result = useGameStore.getState().triggerInteraction(hs.id);
        if (result.handled) {
          // 刷新实体外观
          this.refreshEntityVisual(hs.id);
        }
      }
    });

    // ESC 退出
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      useGameStore.getState().exitRoom();
    });

    // 暂停/恢复输入
    this.game.events.on('pause-input', () => { this.input.keyboard!.enabled = false; });
    this.game.events.on('resume-input', () => { this.input.keyboard!.enabled = true; });
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -this.speed; this.facing = 'left'; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = this.speed; this.facing = 'right'; }
    if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -this.speed; this.facing = 'up'; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = this.speed; this.facing = 'down'; }

    body.setVelocity(vx, vy);

    // 朝向
    const eo = this.facing === 'left' ? -2 : this.facing === 'right' ? 2 : 0;
    this.playerEyeL.setPosition(-3 + eo, -10);
    this.playerEyeR.setPosition(3 + eo, -10);
    if (vx || vy) {
      this.playerBody.setPosition(0, 4 + Math.sin(this.time.now / 80) * 1.5);
    } else {
      this.playerBody.setPosition(0, 4);
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
      // 锁定检测
      const isLocked = (e.hotspot.requireFlag && !store.flags.includes(e.hotspot.requireFlag))
                     || (e.hotspot.requireItem && !store.inventory.includes(e.hotspot.requireItem));

      if (dist < triggerDist && dist < closestDist) {
        closestDist = dist;
        this.nearbyEntity = e.hotspot;
        // 高亮
        e.rect.setStrokeStyle(3, isLocked ? 0xff4444 : 0xffd700, 1);
        e.label.setColor(isUsed ? '#888888' : '#ffffff');
      } else {
        e.rect.setStrokeStyle(2, 0xffd700, isUsed ? 0.15 : 0.3);
        e.label.setColor(isUsed ? '#666666' : '#ffd700');
      }
    }

    // 提示文字
    if (this.nearbyEntity) {
      const hs = this.nearbyEntity;
      const type = hs.interactionType || 'investigate';
      const conf = PROMPT_CONFIG[type] || PROMPT_CONFIG.investigate;
      const text = hs.promptText || conf.prefix;
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

  /** 交互后刷新单个实体外观 */
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
    this.scene.restart({ roomId });
  }
}
