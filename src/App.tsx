// ============================================================
// Ponto de entrada: liga as telas
// ============================================================
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from './lib/config';
import { load, save } from './lib/storage';
import type { Round, Settings, Stats } from './lib/types';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

type Screen = 'setup' | 'game' | 'end';

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => Object.assign(structuredClone(DEFAULT_SETTINGS), load('cc.settings', {})));
  const [stats, setStats] = useState<Stats>(() => load('cc.stats', {}));   // o caderninho
  const [screen, setScreen] = useState<Screen>('setup');
  const [roundId, setRoundId] = useState(0);   // muda a cada partida para recomeçar a tela de jogo do zero
  const [lastRound, setLastRound] = useState<Round | null>(null);

  useEffect(() => {
    document.body.classList.toggle('in-game', screen === 'game');
    window.scrollTo(0, 0);
  }, [screen, roundId]);

  function updateStats(next: Stats) {
    setStats(next);
    save('cc.stats', next);
  }

  function startRound() {
    setRoundId(id => id + 1);
    setScreen('game');
  }

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Caderno de <span>Contas</span></h1>
          <p className="sub">Treino de contas que sorteia com mais frequência o que você ainda erra ou demora.</p>
        </div>
      </header>

      {screen === 'setup' && (
        <SetupScreen
          settings={settings}
          onStart={s => { setSettings(s); save('cc.settings', s); startRound(); }}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          key={roundId}
          settings={settings}
          stats={stats}
          onStats={updateStats}
          onEnd={round => { setLastRound(round); setScreen('end'); }}
        />
      )}
      {screen === 'end' && lastRound && (
        <EndScreen round={lastRound} onAgain={startRound} onConfig={() => setScreen('setup')} />
      )}
    </div>
  );
}
