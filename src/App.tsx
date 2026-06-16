import { useGameStore } from './store/gameStore';
import StartScreen from './components/StartScreen';
import GameUI from './components/GameUI';
import './styles/pixel.css';

function App() {
  const phase = useGameStore(s => s.phase);

  return phase === 'start' ? <StartScreen /> : <GameUI />;
}

export default App;
