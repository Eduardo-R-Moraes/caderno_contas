// ============================================================
// Formulário de configuração (rascunho e validação)
// ============================================================
import { OPS, OP_KEYS } from './config';
import { countPairs } from './questions';
import type { Op, Order, Range, Settings } from './types';

// Os números ficam como texto para o campo poder ficar vazio enquanto a pessoa digita
export interface OpDraft {
  leftInitial: string; leftFinal: string; rightInitial: string; rightFinal: string;
  decimals: number;
  resultDecimals?: number;
}
export interface Draft {
  operator: Op[];
  order: Order;
  lengthFree: boolean;
  lengthN: string;
  candidates: number;
  ops: Record<Op, OpDraft>;
}

const FIELDS = ['leftInitial', 'leftFinal', 'rightInitial', 'rightFinal'] as const;

export function toDraft(s: Settings): Draft {
  const ops = {} as Record<Op, OpDraft>;
  for (const op of OP_KEYS) {
    const r = s[op];
    ops[op] = {
      leftInitial: String(r.leftInitial), leftFinal: String(r.leftFinal),
      rightInitial: String(r.rightInitial), rightFinal: String(r.rightFinal),
      decimals: r.decimals || 0,
    };
    if (op === 'division') ops[op].resultDecimals = r.resultDecimals || 0;
  }
  return {
    operator: [...s.operator],
    order: s.order,
    lengthFree: s.roundLength == null,
    lengthN: String(s.roundLength ?? 20),
    candidates: s.candidates,
    ops,
  };
}

// Lê os campos de uma operação (null se algum número estiver vazio)
export function readOp(op: Op, d: OpDraft): Range | null {
  const r = {} as Range;
  for (const f of FIELDS) {
    const v = parseFloat(d[f]);
    if (Number.isNaN(v)) return null;
    r[f] = v;
  }
  r.decimals = d.decimals;
  if (op === 'division') r.resultDecimals = d.resultDecimals;
  return r;
}

export function readSetupForm(d: Draft, base: Settings): { error: string } | { settings: Settings } {
  const s = structuredClone(base);
  s.operator = OP_KEYS.filter(op => d.operator.includes(op));
  if (!s.operator.length) return { error: 'Escolha pelo menos uma operação.' };
  for (const op of OP_KEYS) {
    const r = readOp(op, d.ops[op]);
    if (!r) return { error: `Preencha todos os números de ${OPS[op].label}.` };
    s[op] = r;
  }
  s.order = d.order;
  if (d.lengthFree) s.roundLength = null;
  else {
    const n = parseInt(d.lengthN, 10);
    if (!(n >= 1)) return { error: 'A duração precisa ser de pelo menos 1 conta.' };
    s.roundLength = n;
  }
  s.candidates = d.candidates;
  for (const op of s.operator) {
    if (countPairs(op, s[op], s.order) === 0) {
      return { error: `${OPS[op].label}: nenhuma conta possível com esses ranges e essa ordem.` };
    }
  }
  return { settings: s };
}
