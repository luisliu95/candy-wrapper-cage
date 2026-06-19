import { useGameStore } from '../store/gameStore';

const DEV_MODE = import.meta.env.DEV; // Vite 开发环境下为 true

const DEBUG_CHAPTERS = [
  { label: 'Ch1 粉色宿舍', node: 'start', chapter: 1 },
  { label: 'Ch2 传单工坊', node: 'ch2_enter', chapter: 2 },
  { label: 'Ch3 广播室', node: 'ch3_enter', chapter: 3 },
  { label: 'Ch4 服务器', node: 'ch4_enter', chapter: 4 },
];

export default function StartScreen() {
  const { loadGame, hasSave } = useGameStore();

  const handleNewGame = () => {
    useGameStore.setState({ phase: 'prologue' });
  };

  const handleContinue = () => {
    const success = loadGame();
    if (!success) {
      handleNewGame();
    }
  };

  const jumpToChapter = (node: string, chapter: number) => {
    useGameStore.setState({
      phase: 'story',
      currentNode: node,
      chapter,
      currentRoom: null,
      currentPuzzle: null,
    });
  };

  return (
    <div className="start-screen">
      <img className="game-logo" src="/assets/name_logo.png" alt="糖纸牢笼" />
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

      {DEV_MODE && (
        <div style={{ marginTop: '24px', borderTop: '1px dashed #555', paddingTop: '16px' }}>
          <p style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>🛠️ 开发调试（仅开发环境可见）</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {DEBUG_CHAPTERS.map(ch => (
              <button
                key={ch.node}
                className="pixel-btn btn-small"
                onClick={() => jumpToChapter(ch.node, ch.chapter)}
                style={{ fontSize: '11px' }}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
