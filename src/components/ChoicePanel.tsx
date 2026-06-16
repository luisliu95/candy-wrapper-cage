import { useGameStore } from '../store/gameStore';
import type { StoryChoice } from '../types/game';

interface Props {
  choices: StoryChoice[];
}

export default function ChoicePanel({ choices }: Props) {
  const { goToNode, hasItem, hasFlag, applyTrigger } = useGameStore();

  const handleChoice = (choice: StoryChoice) => {
    if (choice.require && !hasItem(choice.require)) return;
    if (choice.requireFlag && !hasFlag(choice.requireFlag)) return;
    if (choice.trigger) {
      applyTrigger(choice.trigger);
    }
    goToNode(choice.next);
  };

  return (
    <div className="choice-panel">
      {choices.map((choice, idx) => {
        const itemLocked = choice.require ? !hasItem(choice.require) : false;
        const flagLocked = choice.requireFlag ? !hasFlag(choice.requireFlag) : false;
        const locked = itemLocked || flagLocked;
        return (
          <button
            key={idx}
            className="choice-btn"
            disabled={locked}
            onClick={() => handleChoice(choice)}
          >
            {'>'} {choice.text}
            {itemLocked && (
              <span className="choice-require">（需要特定物品）</span>
            )}
            {flagLocked && !itemLocked && (
              <span className="choice-require">（条件未满足）</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
