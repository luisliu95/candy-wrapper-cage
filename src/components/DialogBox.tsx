import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { StoryNode } from '../types/game';

interface Props {
  node: StoryNode;
  onTypingDone?: () => void;
}

export default function DialogBox({ node, onTypingDone }: Props) {
  const { goToNode, enterRoom, playbackRate } = useGameStore();
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fullText = node.text;

  // 播放对话音频（支持 wav 和 mp3）
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const tryPlay = (ext: string): Promise<HTMLAudioElement> => {
      const audio = new Audio(`/audio/dialogues/${node.id}.${ext}`);
      audio.volume = 0.8;
      audio.playbackRate = playbackRate;
      return audio.play().then(() => audio);
    };

    // 先尝试 wav，失败则尝试 mp3
    tryPlay('wav').then(audio => {
      audioRef.current = audio;
    }).catch(() => {
      tryPlay('mp3').then(audio => {
        audioRef.current = audio;
      }).catch(() => {});
    });

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
        onTypingDone?.();
      } else {
        setDisplayText(fullText.slice(0, i));
      }
    }, Math.round(40 / playbackRate));
    return () => clearInterval(timer);
  }, [fullText, playbackRate]);

  // 判断是否有可点击的下一步
  const hasNextAction = !!(node.next || node.enterRoom);

  const handleClick = useCallback(() => {
    if (isTyping) {
      // 第一次点击：跳过打字机动画，显示完整文本
      setDisplayText(fullText);
      setIsTyping(false);
      onTypingDone?.();
      return;
    }
    // 第二次点击：停止音频并跳转
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // 有选项时不自动跳转
    if (node.choices && node.choices.length > 0) return;
    // 跳转到下一节点
    if (node.next) {
      goToNode(node.next);
    } else if (node.enterRoom) {
      enterRoom(node.enterRoom);
    }
  }, [isTyping, fullText, node, goToNode, enterRoom]);

  // 立绘匹配
  const getPortrait = (speaker: string | undefined): string | null => {
    if (!speaker) return null;
    const portraitMap = ['莫妮卡', '美杜莎', '乔青', '美空'];
    const match = portraitMap.find(name => speaker.includes(name));
    return match ? `/sprites/portraits/${match}.png` : null;
  };

  const portrait = getPortrait(node.speaker);

  return (
    <div className="dialog-container" onClick={handleClick}>
      {portrait && (
        <img className="dialog-portrait" src={portrait} alt={node.speaker || ''} />
      )}
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
