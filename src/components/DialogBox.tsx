import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { StoryNode } from '../types/game';

interface Props {
  node: StoryNode;
}

export default function DialogBox({ node }: Props) {
  const { goToNode, enterRoom } = useGameStore();
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fullText = node.text;

  // 播放对话音频
  useEffect(() => {
    // 停止上一段音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audioPath = `/audio/dialogues/${node.id}.wav`;
    const audio = new Audio(audioPath);
    audio.volume = 0.8;
    audio.play().catch(() => {
      // 音频文件不存在或无法播放，静默忽略
    });
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [node.id]);

  useEffect(() => {
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= fullText.length) {
        setDisplayText(fullText);
        setIsTyping(false);
        clearInterval(timer);
      } else {
        setDisplayText(fullText.slice(0, i));
      }
    }, 40);
    return () => clearInterval(timer);
  }, [fullText]);

  // 判断是否有可点击的下一步
  const hasNextAction = !!(node.next || node.enterRoom);

  const handleClick = useCallback(() => {
    if (isTyping) {
      setDisplayText(fullText);
      setIsTyping(false);
      return;
    }
    // 有选项时不自动跳转
    if (node.choices && node.choices.length > 0) return;
    // 跳转到下一节点
    if (node.next) {
      goToNode(node.next);
    } else if (node.enterRoom) {
      // 没有 next 但有 enterRoom —— 直接进入房间
      enterRoom(node.enterRoom);
    }
  }, [isTyping, fullText, node, goToNode, enterRoom]);

  return (
    <div className="dialog-container" onClick={handleClick}>
      <div className="dialog-box">
        <div className="dialog-speaker">{node.speaker}</div>
        <div className="dialog-text">
          {displayText}
          {isTyping && <span className="typing-cursor" />}
        </div>
        {!isTyping && !node.choices?.length && hasNextAction && (
          <div className="dialog-next">▼ 点击继续</div>
        )}
      </div>
    </div>
  );
}
