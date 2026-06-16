import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import type { StoryNode } from '../types/game';

interface Props {
  node: StoryNode;
}

export default function DialogBox({ node }: Props) {
  const { goToNode } = useGameStore();
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const fullText = node.text;

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
    }
  }, [isTyping, fullText, node, goToNode]);

  return (
    <div className="dialog-container" onClick={handleClick}>
      <div className="dialog-box">
        <div className="dialog-speaker">{node.speaker}</div>
        <div className="dialog-text">
          {displayText}
          {isTyping && <span className="typing-cursor" />}
        </div>
        {!isTyping && !node.choices?.length && node.next && (
          <div className="dialog-next">▼ 点击继续</div>
        )}
      </div>
    </div>
  );
}
