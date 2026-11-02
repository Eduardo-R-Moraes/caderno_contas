// ============================================================
// Raiz do app: liga as telas
// ============================================================
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from './lib/config';
import { load, save } from './lib/storage';
import { createPreset, deletePreset, duplicateDraftName, editPreset, finishRound, migrateLegacy, renamePreset, setStats } from './lib/presets';
import type { Preset, Round, Settings, Stats } from './lib/types';
import PresetList from './components/PresetList';
import PresetDetail from './components/PresetDetail';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

type Screen = 'list' | 'new' | 'edit' | 'detail' | 'game' | 'end';

// Na primeira vez, a configuração e o caderninho antigos viram a primeira configuração salva
function initialPresets(): Preset[] {
  const saved = load<Preset[] | null>('cc.presets', null);
  if (saved) return saved;
  const migrated = migrateLegacy(load<Partial<Settings> | null>('cc.settings', null), load<Stats | null>('cc.stats', null));
  save('cc.presets', migrated);
  return migrated;
}

export default function App() {
  const [presets, setPresets] = useState<Preset[]>(initialPresets);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; settings: Settings }>({ name: '', settings: DEFAULT_SETTINGS });   // base da tela "nova"
  const [screen, setScreen] = useState<Screen>('list');
  const [roundId, setRoundId] = useState(0);   // muda a cada partida para recomeçar a tela de jogo do zero
  const [lastRound, setLastRound] = useState<Round | null>(null);

  const current = presets.find(p => p.id === currentId) ?? null;

  useEffect(() => {
    document.body.classList.toggle('in-game', screen === 'game');
    window.scrollTo(0, 0);
  }, [screen, roundId]);

  // Sempre a partir da lista mais recente: na última conta, onStats e onEnd chegam no mesmo clique
  function update(change: (list: Preset[]) => Preset[]) {
    setPresets(list => {
      const next = change(list);
      save('cc.presets', next);
      return next;
    });
  }

  function play(id: string) {
    setCurrentId(id);
    setRoundId(n => n + 1);
    setScreen('game');
  }

  function open(id: string) {
    setCurrentId(id);
    setScreen('detail');
  }

  function newPreset(base?: Preset) {
    setDraft(base
      ? { name: duplicateDraftName(base.name), settings: base.settings }
      : { name: '', settings: DEFAULT_SETTINGS });
    setScreen('new');
  }

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Caderno de <span>Contas</span></h1>
          <p className="sub">Treino de contas que sorteia com mais frequência o que você ainda erra ou demora.</p>
        </div>
      </header>

      {screen === 'list' && (
        <PresetList presets={presets} onPlay={play} onOpen={open} onNew={() => newPreset()} />
      )}
      {screen === 'new' && (
        <SetupScreen
          settings={draft.settings}
          initialName={draft.name}
          presets={presets}
          onSave={(name, s) => {
            const next = createPreset(presets, name, s);
            update(() => next);
            open(next[next.length - 1].id);
          }}
          onCancel={() => setScreen(current ? 'detail' : 'list')}
        />
      )}
      {screen === 'edit' && current && (
        <SetupScreen
          settings={current.settings}
          initialName={current.name}
          presets={presets}
          editId={current.id}
          onSave={(name, s) => { update(list => editPreset(list, current.id, name, s)); setScreen('detail'); }}
          onCancel={() => setScreen('detail')}
        />
      )}
      {screen === 'detail' && current && (
        <PresetDetail
          key={current.id}
          preset={current}
          presets={presets}
          onPlay={() => play(current.id)}
          onRename={name => update(list => renamePreset(list, current.id, name))}
          onEdit={() => setScreen('edit')}
          onDuplicate={() => newPreset(current)}
          onDelete={() => { update(list => deletePreset(list, current.id)); setCurrentId(null); setScreen('list'); }}
          onBack={() => setScreen('list')}
        />
      )}
      {screen === 'game' && current && (
        <GameScreen
          key={roundId}
          settings={current.settings}
          stats={current.stats}
          onStats={stats => update(list => setStats(list, current.id, stats))}
          onEnd={round => { update(list => finishRound(list, current.id, round)); setLastRound(round); setScreen('end'); }}
        />
      )}
      {screen === 'end' && lastRound && current && (
        <EndScreen round={lastRound} onAgain={() => play(current.id)} onDetail={() => open(current.id)} onList={() => setScreen('list')} />
      )}
    </div>
  );
}
