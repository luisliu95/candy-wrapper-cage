import { useGameStore } from './store/gameStore';
import StartScreen from './components/StartScreen';
import Prologue from './components/Prologue';
import GameUI from './components/GameUI';
import './styles/pixel.css';

function App() {
  const phase = useGameStore(s => s.phase);
  const startGame = useGameStore(s => s.startGame);

  if (phase === 'start') return <StartScreen />;

  if (phase === 'prologue') {
    return <Prologue onComplete={startGame} />;
  }

  return <GameUI />;
}

export default App;
