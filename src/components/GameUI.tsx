import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import StatusBar from './StatusBar';
import DialogBox from './DialogBox';
import ChoicePanel from './ChoicePanel';
import PhaserRoom from './PhaserRoom';
import Inventory from './Inventory';
import PuzzleModal from './PuzzleModal';
import EndingScreen from './EndingScreen';
import SugarEchoScreen from './SugarEchoScreen';
import LeafletGame from './LeafletGame';
import MemoryPanel from './MemoryPanel';

// BGM 路径映射
const BGM_ROOM: Record<number, string> = {
  1: '/audio/bgm_ch1.mp3',
  2: '/audio/bgm_ch2.mp3',
  3: '/audio/bgm_ch3.mp3',
  4: '/audio/bgm_ch4.mp3',
};
const BGM_STORY = '/audio/bgm_story.mp3';

const BG_MAP: Record<string, string> = {
  // 第1章房间探索用的渐变（有背景图时被Phaser覆盖）
  ch1_dorm: 'linear-gradient(180deg, #3d1f3f 0%, #6b2d5b 50%, #2a0e2e 100%)',
  ch2_workshop: 'linear-gradient(180deg, #1a2a1a 0%, #2d4a2d 50%, #0a1a0a 100%)',
  ch3_broadcast: 'linear-gradient(180deg, #1a1a3e 0%, #2d2d6b 50%, #0a0a2e 100%)',
  ch4_server: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #050510 100%)',
  // 剧情对话背景图
  part1_background: 'url(/assets/backgrounds/part1_background.png) center/cover no-repeat',
  corridor: 'url(/assets/backgrounds/corridor.png) center/cover no-repeat',
  basement: 'url(/assets/backgrounds/basement.png) center/cover no-repeat',
  broadcasting_room: 'url(/assets/backgrounds/broadcasting_room.png) center/cover no-repeat',
  server: 'url(/assets/backgrounds/server.png) center/cover no-repeat',
};

export default function GameUI() {
  const {
    phase, currentPuzzle, alert, currentRoom,
    message, clearMessage, getCurrentNode, chapter
  } = useGameStore();

  const node = getCurrentNode();
  const [typingDone, setTypingDone] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmPathRef = useRef<string>('');

  // 节点切换时重置
  useEffect(() => {
    setTypingDone(false);
  }, [node?.id]);

  // BGM 管理
  useEffect(() => {
    // 确定当前应播放的 BGM
    let targetBgm = '';
    if (phase === 'topdown') {
      targetBgm = BGM_ROOM[chapter] || '';
    } else if (phase === 'story' || phase === 'sugarecho' || phase === 'leaflet') {
      targetBgm = BGM_STORY;
    }
    // ending 时不播放

    // 如果目标和当前一致，不切换
    if (targetBgm === bgmPathRef.current) return;

    // 停止当前 BGM
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
    bgmPathRef.current = targetBgm;

    // 播放新 BGM
    if (targetBgm) {
      const audio = new Audio(targetBgm);
      audio.loop = true;
      audio.volume = 0.4;
      audio.play().catch(() => {});
      bgmRef.current = audio;
    }

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
        bgmPathRef.current = '';
      }
    };
  }, [phase, chapter]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(clearMessage, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

  // 章节默认背景图映射
  const CHAPTER_DEFAULT_BG: Record<number, string> = {
    1: 'part1_background',
    2: 'basement',
    3: 'broadcasting_room',
    4: 'server',
  };
  const bgKey = node?.background || CHAPTER_DEFAULT_BG[chapter] || 'part1_background';
  const bg = BG_MAP[bgKey] || BG_MAP['part1_background'];

  if (phase === 'ending') return <EndingScreen />;
  if (phase === 'sugarecho') return <SugarEchoScreen />;
  if (phase === 'leaflet') return <LeafletGame />;

  const alertClass = alert >= 70 ? 'alert-high' : alert >= 40 ? 'alert-mid' : '';

  return (
    <div className={`game-container ${alertClass}`}>
      <StatusBar />
      <div className="scene-area">
        <div className="scene-background" style={{ background: bg }} />
        {currentRoom && (
          <div style={{ display: phase === 'topdown' ? 'block' : 'none' }}>
            <PhaserRoom />
          </div>
        )}
        {phase === 'story' && node && (
          <>
            <DialogBox node={node} onTypingDone={() => setTypingDone(true)} />
            {typingDone && node.choices && node.choices.length > 0 && (
              <ChoicePanel choices={node.choices} />
            )}
          </>
        )}
      </div>
      {currentPuzzle && <PuzzleModal />}
      {phase !== 'story' && <MemoryPanel />}
      {phase !== 'story' && <Inventory />}
      {message && <div className="message-toast">{message}</div>}
      <div className="scanlines" />
    </div>
  );
}
