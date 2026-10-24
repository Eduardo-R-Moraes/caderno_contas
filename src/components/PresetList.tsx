// ============================================================
// Tela inicial: configurações salvas
// ============================================================
import { describeSettings } from '../lib/presets';
import type { Preset } from '../lib/types';

interface Props {
  presets: Preset[];
  onPlay: (id: string) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
}

const fmtDay = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export default function PresetList({ presets, onPlay, onOpen, onNew }: Props) {
  // As jogadas mais recentemente aparecem primeiro
  const sorted = [...presets].sort((a, b) => (b.lastPlayedAt ?? b.createdAt) - (a.lastPlayedAt ?? a.createdAt));

  return (
    <section id="screen-list" className="wrap" style={{ gap: 16 }}>
      <div className="panel">
        <div className="panel-head">
          <h2>Configurações</h2>
          <button className="small primary" id="btn-new" onClick={onNew}>+ Nova</button>
        </div>
        {sorted.length === 0
          ? <p className="hint">Nenhuma configuração ainda. Crie uma com as operações que você quer treinar: cada configuração guarda o próprio caderninho e a evolução dos seus pontos.</p>
          : <div className="preset-list">
              {sorted.map(p => {
                const best = p.scores.length ? Math.max(...p.scores.map(s => s.score)) : null;
                return (
                  <div key={p.id} className="preset-card">
                    <div className="preset-info">
                      <b className="preset-name">{p.name}</b>
                      <span className="hint">{describeSettings(p.settings)}</span>
                      <span className="hint">
                        {p.scores.length} {p.scores.length === 1 ? 'partida' : 'partidas'}
                        {best !== null && <> · recorde <span className="num">{best}</span></>}
                        {p.lastPlayedAt && <> · jogada em <span className="num">{fmtDay(p.lastPlayedAt)}</span></>}
                      </span>
                    </div>
                    <div className="actions">
                      <button className="small" onClick={() => onOpen(p.id)}>Ver</button>
                      <button className="small primary" onClick={() => onPlay(p.id)}>Jogar</button>
                    </div>
                  </div>
                );
              })}
            </div>}
      </div>
    </section>
  );
}
