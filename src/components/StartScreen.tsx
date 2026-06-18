import { useGameStore } from '../store/gameStore';

export default function StartScreen() {
  const { loadGame, hasSave } = useGameStore();

  const handleNewGame = () => {
    // 新游戏先播放序章
    useGameStore.setState({ phase: 'prologue' });
  };

  const handleContinue = () => {
    const success = loadGame();
    if (!success) {
      handleNewGame();
    }
  };

  return (
    <div className="start-screen">
      <div className="pixel-candy">🍬</div>
      <h1 className="game-title">糖纸牢笼</h1>
      <p className="game-subtitle">CANDY WRAPPER CAGE</p>
      <div className="start-menu">
        <button className="pixel-btn" onClick={handleNewGame}>
          ▶ 新游戏
        </button>
        {hasSave() && (
          <button className="pixel-btn btn-accent" onClick={handleContinue}>
            ◆ 继续游戏
          </button>
        )}
      </div>
    </div>
  );
}
