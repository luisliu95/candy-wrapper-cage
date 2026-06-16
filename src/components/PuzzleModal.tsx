import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Puzzle } from '../types/game';
import puzzlesData from '../data/puzzles.json';

export default function PuzzleModal() {
  const { currentPuzzle, solvePuzzle, closePuzzle } = useGameStore();
  const [inputValue, setInputValue] = useState('');

  if (!currentPuzzle) return null;
  const puzzle = (puzzlesData as Record<string, Puzzle>)[currentPuzzle];
  if (!puzzle) return null;

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    solvePuzzle(inputValue.trim());
    setInputValue('');
  };

  const handleChoiceSelect = (option: string) => {
    solvePuzzle(option);
  };

  return (
    <>
      <div className="overlay" onClick={closePuzzle} />
      <div className="puzzle-modal">
        <div className="puzzle-title">🧩 {puzzle.title}</div>
        <div className="puzzle-description">{puzzle.description}</div>

        {puzzle.type === 'input' ? (
          <>
            <input
              className="puzzle-input"
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="输入答案..."
              autoFocus
            />
            <div className="puzzle-actions">
              <button className="pixel-btn btn-small" onClick={closePuzzle}>
                返回
              </button>
              <button className="pixel-btn btn-small btn-accent" onClick={handleSubmit}>
                确认
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="puzzle-options">
              {puzzle.options?.map((option, idx) => (
                <button
                  key={idx}
                  className="puzzle-option"
                  onClick={() => handleChoiceSelect(option)}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                </button>
              ))}
            </div>
            <div className="puzzle-actions">
              <button className="pixel-btn btn-small" onClick={closePuzzle}>
                返回
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
