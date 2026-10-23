// ============================================================
// Formatação
// ============================================================
import { OPS } from './config';
import type { Op, Question } from './types';

export const fmtNum = (n: number) => String(n).replace('.', ',').replace('-', '−');
export const fmtQ = (q: Question) => `${fmtNum(q.a)} ${OPS[q.op].sym} ${fmtNum(q.b)}`;
export const fmtSec = (ms: number) => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
export const fmtNote = (n: number) => n.toFixed(1).replace('.', ',');
export const parseKey = (key: string): Question => { const [op, a, b] = key.split(':'); return { op: op as Op, a: +a, b: +b }; };
