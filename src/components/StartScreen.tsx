import { useGameStore } from '../store/gameStore';

export default function StartScreen() {
  const { startGame, loadGame, hasSave, explorationMode, setExplorationMode } = useGameStore();

  const handleContinue = () => {
    const success = loadGame();
    if (!success) {
      startGame();
    }
  };

  return (
    <div className="start-screen">
      <div className="pixel-candy">🍬</div>
      <h1 className="game-title">糖纸牢笼</h1>
      <p className="game-subtitle">CANDY WRAPPER CAGE</p>
      <div className="start-menu">
        <button className="pixel-btn" onClick={startGame}>
          ▶ 新游戏
        </button>
        {hasSave() && (
          <button className="pixel-btn btn-accent" onClick={handleContinue}>
            ◆ 继续游戏
          </button>
        )}
        <div className="mode-switcher">
          <span className="mode-label">探索模式</span>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${explorationMode === 'control' ? 'active' : ''}`}
              onClick={() => setExplorationMode('control')}
            >
              🎮 操纵
            </button>
            <button
              className={`mode-btn ${explorationMode === 'click' ? 'active' : ''}`}
              onClick={() => setExplorationMode('click')}
            >
              🖱️ 点击
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
