// ============================================================
// Um bloco de operação na configuração
// ============================================================
import { OPS } from '../lib/config';
import { plural } from '../lib/format';
import { countPairs } from '../lib/questions';
import { readOp, type OpDraft } from '../lib/setupForm';
import type { Op, Order } from '../lib/types';

const PLACES = [0, 1, 2, 3];

interface Props {
  op: Op;
  on: boolean;
  draft: OpDraft;
  order: Order;
  onToggle: (on: boolean) => void;
  onChange: (patch: Partial<OpDraft>) => void;
}

export default function OpCard({ op, on, draft, order, onToggle, onChange }: Props) {
  const { label, sym } = OPS[op];
  const isDiv = op === 'division';

  // Quantas contas diferentes a configuração permite
  const r = readOp(op, draft);
  const n = r ? countPairs(op, r, order) : undefined;
  const countText = n === undefined ? ''
    : n === null ? 'Muitas contas possíveis.'
    : n === 0 ? 'Nenhuma conta possível com esses ranges e essa ordem.'
    : `${n.toLocaleString('pt-BR')} ${plural(n, 'conta possível', 'contas possíveis')}.`;

  const num = (field: 'leftInitial' | 'leftFinal' | 'rightInitial' | 'rightFinal', aria: string) => (
    <input type="number" step="any" value={draft[field]}
      onChange={e => onChange({ [field]: e.target.value })} aria-label={`${label}: ${aria}`} />
  );

  return (
    <div className={'op ' + (on ? 'on' : 'off')}>
      <label className="op-title" htmlFor={`op-${op}`}>
        <span className="op-sym">{sym}</span>{label}
        <input type="checkbox" id={`op-${op}`} checked={on} onChange={e => onToggle(e.target.checked)} />
      </label>
      <div className="ranges">
        <span></span><span className="colhead">de</span><span className="colhead">até</span>
        <span className="lbl">{isDiv ? 'Dividendo' : 'Esquerda'}</span>
        {num('leftInitial', 'esquerda, de')}
        {num('leftFinal', 'esquerda, até')}
        <span className="lbl">{isDiv ? 'Divisor' : 'Direita'}</span>
        {num('rightInitial', 'direita, de')}
        {num('rightFinal', 'direita, até')}
      </div>
      <div className="extra">
        <label className="lbl" htmlFor={`${op}-decimals`}>Casas decimais</label>
        <select id={`${op}-decimals`} value={draft.decimals} onChange={e => onChange({ decimals: parseInt(e.target.value, 10) })}>
          {PLACES.map(p => <option key={p} value={p}>{p === 0 ? '0' : p}</option>)}
        </select>
        {isDiv && <>
          <label className="lbl" htmlFor="division-resultDecimals">Resultado</label>
          <select id="division-resultDecimals" value={draft.resultDecimals} onChange={e => onChange({ resultDecimals: parseInt(e.target.value, 10) })}>
            {PLACES.map(p => <option key={p} value={p}>{p === 0 ? 'Só inteiro' : `${p}`}</option>)}
          </select>
        </>}
      </div>
      <p className="hint count" style={{ color: n === 0 ? 'var(--err)' : undefined }}>{countText}</p>
    </div>
  );
}
