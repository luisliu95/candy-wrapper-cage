import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import type { Room, Hotspot } from '../../types/game';
import roomsData from '../../data/scenes.json';

/** 房间背景色 → 数值 */
const ROOM_COLORS: Record<string, number> = {
  ch1_dorm: 0x4a1942,
  ch2_workshop: 0x1e3a1e,
  ch3_broadcast: 0x1e1e5a,
  ch4_server: 0x0d0d2a,
};

/** 实体emoji → 像素色块颜色 */
const ENTITY_COLORS: Record<string, number> = {
  bed: 0xff9999,
  desk: 0xaa8855,
  wardrobe: 0x8b6914,
  window: 0x88ccff,
  door: 0xcc8844,
  printer: 0x555555,
  shelf: 0x997744,
  locker: 0x666666,
  safe: 0x444444,
  photo: 0xddddaa,
  console: 0x336633,
  tape: 0x553333,
  schedule: 0xcccc99,
  drawer: 0x665533,
  terminal: 0x003300,
  rack: 0x222233,
  notebook: 0x884422,
  breaker: 0x888888,
  exit: 0x44aa44,
  default: 0x997755,
};

/**
 * 将 hotspot 百分比坐标转为场景像素坐标
 * 画布固定 800×500
 */
function hotspotToPixel(h: Hotspot, canvasW: number, canvasH: number) {
  return {
    x: (h.x / 100) * canvasW + ((h.w / 100) * canvasW) / 2,
    y: (h.y / 100) * canvasH + ((h.h / 100) * canvasH) / 2,
    w: (h.w / 100) * canvasW,
    h: (h.h / 100) * canvasH,
  };
}

/** 猜一个实体颜色 */
function guessColor(id: string): number {
  for (const [key, color] of Object.entries(ENTITY_COLORS)) {
    if (id.toLowerCase().includes(key)) return color;
  }
  return ENTITY_COLORS.default;
}

export default class RoomScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private entities: { rect: Phaser.GameObjects.Rectangle; hotspot: Hotspot; label: Phaser.GameObjects.Text }[] = [];
  private nearbyEntity: Hotspot | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private speed = 160;
  private roomId: string = '';
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  // 像素角色小人的各部分
  private playerHead!: Phaser.GameObjects.Rectangle;
  private playerEyeL!: Phaser.GameObjects.Rectangle;
  private playerEyeR!: Phaser.GameObjects.Rectangle;
  private playerHair!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'RoomScene' });
  }

  init(data: { roomId: string }) {
    this.roomId = data.roomId || 'ch1_dorm';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 房间背景
    const bgColor = ROOM_COLORS[this.roomId] || 0x1a0a2e;
    this.cameras.main.setBackgroundColor(bgColor);

    // 地板网格
    const gridG = this.add.graphics();
    gridG.lineStyle(1, 0xffffff, 0.04);
    const tileSize = 40;
    for (let x = 0; x <= W; x += tileSize) {
      gridG.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y <= H; y += tileSize) {
      gridG.lineBetween(0, y, W, y);
    }

    // 加载房间实体
    const room = (roomsData as Record<string, Room>)[this.roomId];
    this.entities = [];
    if (room) {
      for (const hs of room.hotspots) {
        const pos = hotspotToPixel(hs, W, H);
        const color = guessColor(hs.id);

        // 实体矩形
        const rect = this.add.rectangle(pos.x, pos.y, pos.w, pos.h, color, 0.6);
        rect.setStrokeStyle(2, 0xffd700, 0.5);

        // 标签
        const label = this.add.text(pos.x, pos.y - pos.h / 2 - 10, hs.label, {
          fontSize: '11px',
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
          color: '#ffd700',
          stroke: '#000',
          strokeThickness: 2,
        }).setOrigin(0.5);

        this.entities.push({ rect, hotspot: hs, label });
      }
    }

    // 创建莫妮卡角色（像素小人 Container）
    this.player = this.add.container(W / 2, H / 2);

    // 身体
    this.playerBody = this.add.rectangle(0, 4, 16, 20, 0xff6b9d);
    // 头
    this.playerHead = this.add.rectangle(0, -10, 14, 14, 0xffddbb);
    // 头发
    this.playerHair = this.add.rectangle(0, -16, 16, 6, 0x553322);
    // 左眼
    this.playerEyeL = this.add.rectangle(-3, -10, 3, 3, 0x222222);
    // 右眼
    this.playerEyeR = this.add.rectangle(3, -10, 3, 3, 0x222222);

    this.player.add([this.playerBody, this.playerHead, this.playerHair, this.playerEyeL, this.playerEyeR]);
    this.player.setSize(16, 28);
    this.player.setDepth(10);

    // 物理
    this.physics.world.enable(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(16, 28);
    body.setOffset(-8, -14);

    // 键盘
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // 交互提示
    this.promptText = this.add.text(W / 2, H - 30, '', {
      fontSize: '13px',
      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
      backgroundColor: 'rgba(26,10,46,0.85)',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(20);

    // E键交互
    this.interactKey.on('down', () => {
      if (this.nearbyEntity) {
        this.handleInteract(this.nearbyEntity);
      }
    });

    // ESC退出房间
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      useGameStore.getState().exitRoom();
    });

    // 监听 phase 变化 —— 当 React 层弹出对话/谜题时暂停输入
    this.game.events.on('pause-input', () => {
      this.input.keyboard!.enabled = false;
    });
    this.game.events.on('resume-input', () => {
      this.input.keyboard!.enabled = true;
    });
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    // WASD + 方向键
    if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -this.speed; this.facing = 'left'; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = this.speed; this.facing = 'right'; }
    if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -this.speed; this.facing = 'up'; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = this.speed; this.facing = 'down'; }

    body.setVelocity(vx, vy);

    // 简单朝向视觉 —— 眼睛位置微调
    const eyeOffset = this.facing === 'left' ? -2 : this.facing === 'right' ? 2 : 0;
    this.playerEyeL.setPosition(-3 + eyeOffset, -10);
    this.playerEyeR.setPosition(3 + eyeOffset, -10);

    // 走路时身体微微晃动
    if (vx !== 0 || vy !== 0) {
      this.playerBody.setPosition(0, 4 + Math.sin(this.time.now / 80) * 1.5);
    } else {
      this.playerBody.setPosition(0, 4);
    }

    // 检测附近实体
    this.nearbyEntity = null;
    const px = this.player.x;
    const py = this.player.y;
    const interactDist = 50;

    for (const e of this.entities) {
      const dist = Phaser.Math.Distance.Between(px, py, e.rect.x, e.rect.y);
      if (dist < interactDist + Math.max(e.rect.width, e.rect.height) / 2) {
        this.nearbyEntity = e.hotspot;
        // 高亮
        e.rect.setStrokeStyle(3, 0xffd700, 1);
        e.label.setColor('#ffffff');
      } else {
        e.rect.setStrokeStyle(2, 0xffd700, 0.3);
        e.label.setColor('#ffd700');
      }
    }

    // 更新提示文字
    if (this.nearbyEntity) {
      this.promptText.setText(`按 E 交互：${this.nearbyEntity.label}`);
      this.promptText.setVisible(true);
    } else {
      this.promptText.setText('');
      this.promptText.setVisible(false);
    }
  }

  /** 处理实体交互 —— 桥接到 React/Zustand */
  private handleInteract(hotspot: Hotspot) {
    const store = useGameStore.getState();

    // 暂停 Phaser 输入，让 React 接管
    this.game.events.emit('pause-input');

    // 发出事件让 React 层处理（热区弹窗/拾取/谜题/剧情跳转）
    this.game.events.emit('entity-interact', hotspot);
  }

  /** 外部调用：切换到新房间 */
  switchRoom(roomId: string) {
    this.roomId = roomId;
    this.scene.restart({ roomId });
  }
}
