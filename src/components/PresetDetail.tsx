// ============================================================
// Uma configuração salva: resumo, evolução e ações
// ============================================================
import { useState, type FormEvent } from 'react';
import { OPS } from '../lib/config';
import { fmtNum, fmtSec } from '../lib/format';
import { validateName } from '../lib/presets';
import type { Order, Preset } from '../lib/types';
import ScoreChart from './ScoreChart';

const ORDER_LABEL: Record<Order, string> = { none: 'Qualquer ordem', '>': 'Esquerda ≥ direita', '<': 'Esquerda ≤ direita' };
const fmtDay = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtPct = (n: number) => `${Math.round(n)}%`;

interface Props {
  preset: Preset;
  presets: Preset[];
  onPlay: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function PresetDetail({ preset, presets, onPlay, onRename, onDuplicate, onDelete, onBack }: Props) {
  const [name, setName] = useState(preset.name);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { settings: s, scores } = preset;

  function rename(e: FormEvent) {
    e.preventDefault();
    const err = validateName(presets, name, preset.id);
    setError(err);
    if (!err) onRename(name);
  }

  const best = scores.length ? Math.max(...scores.map(x => x.score)) : null;
  const lastScore = scores.length ? scores[scores.length - 1].score : null;
  const dates = scores.map(x => x.at);

  return (
    <section id="screen-detail" className="wrap" style={{ gap: 16 }}>
      <div className="panel">
        <div className="panel-head">
          <h2>{preset.name}</h2>
          <button className="small" id="btn-back" onClick={onBack}>Voltar</button>
        </div>
        <div className="summary">
          <div className="chip"><span className="eyebrow">Partidas</span><b>{scores.length}</b></div>
          <div className="chip score"><span className="eyebrow">Recorde</span><b>{best ?? '–'}</b></div>
          <div className="chip"><span className="eyebrow">Última</span><b>{lastScore ?? '–'}</b></div>
          <div className="chip"><span className="eyebrow">Contas vistas</span><b>{Object.keys(preset.stats).length}</b></div>
        </div>
        <div className="actions">
          <button className="primary" id="btn-play" onClick={onPlay}>Jogar</button>
          <button id="btn-duplicate" onClick={onDuplicate}>Duplicar e editar</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Evolução</h2></div>
        <ScoreChart title="Pontos por partida" values={scores.map(x => x.score)} dates={dates} fmt={n => fmtNum(Math.round(n))} />
        <ScoreChart title="Aproveitamento" values={scores.map(x => x.rights / x.done * 100)} dates={dates} fmt={fmtPct} max={100} />
        <ScoreChart title="Tempo médio por conta" values={scores.map(x => x.avgMs)} dates={dates} fmt={fmtSec} />
        {scores.length > 0 && (
          <details className="score-table">
            <summary>Ver tabela de partidas</summary>
            <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Data</th><th className="r">Pontos</th><th className="r">Acertos</th><th className="r">Tempo médio</th></tr></thead>
              <tbody>
                {scores.map((x, i) => (
                  <tr key={x.at}>
                    <td>{i + 1}</td><td>{fmtDay(x.at)}</td><td className="r">{x.score}</td>
                    <td className="r">{x.rights}/{x.done}</td><td className="r">{fmtSec(x.avgMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </details>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Configuração</h2></div>
        <form className="field" onSubmit={rename}>
          <label className="eyebrow" htmlFor="preset-name">Nome</label>
          <div className="inline">
            <input type="text" id="preset-name" className="name-input" value={name} maxLength={40}
              onChange={e => { setName(e.target.value); setError(null); }} />
            <button type="submit" className="small" disabled={name.trim() === preset.name}>Renomear</button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </form>
        <ul className="settings-list">
          {s.operator.map(op => {
            const r = s[op];
            const isDiv = op === 'division';
            return (
              <li key={op}>
                <span className="op-sym">{OPS[op].sym}</span>
                <span>
                  <b>{OPS[op].label}</b>: {isDiv ? 'dividendo' : 'esquerda'} <span className="num">{fmtNum(r.leftInitial)}–{fmtNum(r.leftFinal)}</span>,
                  {' '}{isDiv ? 'divisor' : 'direita'} <span className="num">{fmtNum(r.rightInitial)}–{fmtNum(r.rightFinal)}</span>
                  {r.decimals > 0 && <>, {r.decimals} {r.decimals === 1 ? 'casa' : 'casas'}</>}
                  {isDiv && r.resultDecimals ? <>, resultado com {r.resultDecimals} {r.resultDecimals === 1 ? 'casa' : 'casas'}</> : null}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="hint">
          {ORDER_LABEL[s.order]} · {s.roundLength == null ? 'até eu parar' : `${s.roundLength} contas por partida`} · foco nas difíceis: {s.candidates} {s.candidates === 1 ? 'candidata' : 'candidatas'}
        </p>
        <p className="hint">Para treinar com outros números, use “Duplicar e editar”: a cópia começa com caderninho e evolução zerados.</p>
        <div className="actions" id="delete-box">
          {!confirming
            ? <button className="small danger" id="btn-delete" onClick={() => setConfirming(true)}>Apagar configuração</button>
            : <>
                <span className="hint">Apagar “{preset.name}” com o caderninho e a evolução?</span>
                <button className="small danger" id="btn-delete-yes" onClick={onDelete}>Apagar</button>
                <button className="small" id="btn-delete-no" onClick={() => setConfirming(false)}>Cancelar</button>
              </>}
        </div>
      </div>
    </section>
  );
}
