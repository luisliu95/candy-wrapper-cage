import { useState, useEffect, useCallback, useRef } from 'react';
import prologueData from '../data/prologue.json';

interface PrologueFrame {
  id: string;
  bg: string;
  bgColor: string;
  icon: string;
  speaker: string | null;
  text: string;
  subtext: string | null;
  duration: number;
}

const frames = prologueData as PrologueFrame[];

interface Props {
  onComplete: () => void;
}

export default function Prologue({ onComplete }: Props) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showSubtext, setShowSubtext] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [fadeState, setFadeState] = useState<'in' | 'visible' | 'out'>('in');
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // 序章 BGM
  useEffect(() => {
    const audio = new Audio('/audio/bgm_story.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    audio.play().catch(() => {});
    bgmRef.current = audio;
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  const frame = frames[currentFrame];
  const isLastFrame = currentFrame >= frames.length - 1;

  // 打字机效果
  useEffect(() => {
    if (!frame) return;
    setDisplayText('');
    setShowSubtext(false);
    setIsTyping(true);
    setFadeState('in');

    // 淡入
    const fadeInTimer = setTimeout(() => setFadeState('visible'), 100);

    let i = 0;
    const typeTimer = setInterval(() => {
      i++;
      if (i >= frame.text.length) {
        setDisplayText(frame.text);
        setIsTyping(false);
        clearInterval(typeTimer);
        // 显示副文本
        if (frame.subtext) {
          setTimeout(() => setShowSubtext(true), 300);
        }
      } else {
        setDisplayText(frame.text.slice(0, i));
      }
    }, 45);

    return () => {
      clearTimeout(fadeInTimer);
      clearInterval(typeTimer);
    };
  }, [currentFrame]);

  const nextFrame = useCallback(() => {
    if (isTyping) {
      // 跳过打字，直接显示完整文本
      setDisplayText(frame.text);
      setIsTyping(false);
      if (frame.subtext) setShowSubtext(true);
      return;
    }

    if (isLastFrame) {
      setFadeState('out');
      setTimeout(onComplete, 800);
      return;
    }

    // 淡出后切换下一帧
    setFadeState('out');
    setTimeout(() => {
      setCurrentFrame(prev => prev + 1);
    }, 400);
  }, [isTyping, isLastFrame, frame, onComplete]);

  // 点击/空格/回车 推进
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextFrame();
      }
      if (e.key === 'Escape') {
        onComplete(); // 跳过序章
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextFrame, onComplete]);

  if (!frame) return null;

  return (
    <div
      className="prologue-screen"
      onClick={nextFrame}
      style={{ background: frame.bgColor }}
    >
      {/* 背景装饰 */}
      <div className={`prologue-bg-effect ${frame.bg}`} />

      {/* 帧内容 */}
      <div className={`prologue-frame prologue-fade-${fadeState}`}>
        {/* 图标 */}
        <div className="prologue-icon">{frame.icon}</div>

        {/* 说话人 */}
        {frame.speaker && (
          <div className="prologue-speaker">{frame.speaker}</div>
        )}

        {/* 正文 */}
        <div className="prologue-text">
          {displayText}
          {isTyping && <span className="typing-cursor" />}
        </div>

        {/* 副文本（引用/UI截图模拟） */}
        {frame.subtext && showSubtext && (
          <div className="prologue-subtext">
            {frame.subtext}
          </div>
        )}
      </div>

      {/* 底部控制 */}
      <div className="prologue-controls">
        <span className="prologue-progress">
          {currentFrame + 1} / {frames.length}
        </span>
        <span className="prologue-hint">
          {isTyping ? '点击加速' : isLastFrame ? '点击开始游戏' : '点击继续'}
        </span>
        <button
          className="prologue-skip-btn"
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
        >
          ESC 跳过序章 ▸
        </button>
      </div>

      <div className="scanlines" />
    </div>
  );
}
