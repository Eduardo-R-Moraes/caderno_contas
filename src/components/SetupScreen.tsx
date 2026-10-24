// ============================================================
// Tela de configuração
// ============================================================
import { useState } from 'react';
import { OP_KEYS } from '../lib/config';
import { validateName } from '../lib/presets';
import { readSetupForm, toDraft, type Draft, type OpDraft } from '../lib/setupForm';
import type { Op, Order, Preset, Settings } from '../lib/types';
import OpCard from './OpCard';

const ORDERS: { value: Order; id: string; label: string }[] = [
  { value: 'none', id: 'order-none', label: 'Qualquer' },
  { value: '>', id: 'order-gt', label: 'Esq. ≥ dir.' },
  { value: '<', id: 'order-lt', label: 'Esq. ≤ dir.' },
];

interface Props {
  settings: Settings;
  initialName: string;
  presets: Preset[];   // para não repetir nome
  onSave: (name: string, s: Settings) => void;
  onCancel: () => void;
}

export default function SetupScreen({ settings, initialName, presets, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings));
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const setOp = (op: Op, patch: Partial<OpDraft>) =>
    setDraft(d => ({ ...d, ops: { ...d.ops, [op]: { ...d.ops[op], ...patch } } }));
  const toggleOp = (op: Op, on: boolean) =>
    setDraft(d => ({ ...d, operator: on ? [...d.operator, op] : d.operator.filter(o => o !== op) }));

  function save() {
    const nameError = validateName(presets, name);
    if (nameError) { setError(nameError); return; }
    const res = readSetupForm(draft, settings);
    if ('error' in res) { setError(res.error); return; }
    setError(null);
    onSave(name, res.settings);
  }

  return (
    <section id="screen-setup" className="wrap" style={{ gap: 16 }}>
      <div className="panel">
        <div className="panel-head"><h2>Nova configuração</h2></div>
        <div className="field">
          <label className="eyebrow" htmlFor="preset-name">Nome</label>
          <input type="text" id="preset-name" className="name-input" value={name} maxLength={40} placeholder="Ex.: Tabuada do 6 ao 9"
            onChange={e => setName(e.target.value)} />
          <p className="hint">Depois de salva, só o nome pode mudar. Assim os pontos dela sempre podem ser comparados entre si.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Operações</h2>
          <span className="eyebrow">settings.operator</span>
        </div>
        <div className="ops" id="ops">
          {OP_KEYS.map(op => (
            <OpCard
              key={op}
              op={op}
              on={draft.operator.includes(op)}
              draft={draft.ops[op]}
              order={draft.order}
              onToggle={on => toggleOp(op, on)}
              onChange={patch => setOp(op, patch)}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Partida</h2></div>
        <div className="row-settings">
          <div className="field">
            <span className="eyebrow">Ordem dos números</span>
            <div className="seg" role="radiogroup" aria-label="Ordem dos números">
              {ORDERS.map(o => (
                <label key={o.id}>
                  <input type="radio" name="order" id={o.id} value={o.value} checked={draft.order === o.value} onChange={() => set({ order: o.value })} />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="eyebrow">Duração (roundLength)</span>
            <div className="seg" role="radiogroup" aria-label="Duração">
              <label><input type="radio" name="length" id="length-free" value="free" checked={draft.lengthFree} onChange={() => set({ lengthFree: true })} /><span>Até eu parar</span></label>
              <label><input type="radio" name="length" id="length-fixed" value="fixed" checked={!draft.lengthFree} onChange={() => set({ lengthFree: false })} /><span>Fixa</span></label>
            </div>
            <div className="inline" id="length-box" hidden={draft.lengthFree}>
              <input type="number" id="length-n" min="1" max="500" value={draft.lengthN} onChange={e => set({ lengthN: e.target.value })} aria-label="Quantidade de contas" />
              <span className="hint">contas</span>
            </div>
          </div>
          <div className="field">
            <span className="eyebrow">Foco nas difíceis: <b className="num" id="k-val">{draft.candidates}</b> candidatas</span>
            <input type="range" id="k" min="1" max="10" value={draft.candidates} onChange={e => set({ candidates: parseInt(e.target.value, 10) })} aria-label="Quantidade de candidatas por sorteio" />
            <p className="hint">1 = sorteio comum. Quanto maior, mais o app insiste no que você erra.</p>
          </div>
        </div>
        <div className="actions">
          <button className="primary" id="btn-save" onClick={save}>Salvar configuração</button>
          <button id="btn-cancel" onClick={onCancel}>Cancelar</button>
          <p className="error-msg" id="setup-error" hidden={!error}>{error}</p>
        </div>
      </div>
    </section>
  );
}
