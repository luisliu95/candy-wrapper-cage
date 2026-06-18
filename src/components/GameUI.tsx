import { useEffect } from 'react';
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

const BG_MAP: Record<string, string> = {
  ch1_dorm: 'linear-gradient(180deg, #3d1f3f 0%, #6b2d5b 50%, #2a0e2e 100%)',
  ch2_workshop: 'linear-gradient(180deg, #1a2a1a 0%, #2d4a2d 50%, #0a1a0a 100%)',
  ch3_broadcast: 'linear-gradient(180deg, #1a1a3e 0%, #2d2d6b 50%, #0a0a2e 100%)',
  ch4_server: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #050510 100%)',
};

export default function GameUI() {
  const {
    phase, currentPuzzle,
    message, clearMessage, getCurrentNode, chapter
  } = useGameStore();

  const node = getCurrentNode();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(clearMessage, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

  const bgKey = node?.background || `ch${chapter}_dorm`;
  const bg = BG_MAP[bgKey] || BG_MAP[`ch${chapter}_dorm`] || BG_MAP['ch1_dorm'];

  if (phase === 'ending') return <EndingScreen />;
  if (phase === 'sugarecho') return <SugarEchoScreen />;
  if (phase === 'leaflet') return <LeafletGame />;

  return (
    <div className="game-container">
      <StatusBar />
      <div className="scene-area">
        <div className="scene-background" style={{ background: bg }} />
        {phase === 'topdown' && <PhaserRoom />}
        {phase === 'story' && node && (
          <>
            <DialogBox node={node} />
            {node.choices && node.choices.length > 0 && (
              <ChoicePanel choices={node.choices} />
            )}
          </>
        )}
      </div>
      {currentPuzzle && <PuzzleModal />}
      <Inventory />
      {message && <div className="message-toast">{message}</div>}
      <div className="scanlines" />
    </div>
  );
}
