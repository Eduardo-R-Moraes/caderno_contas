// ============================================================
// Formatação
// ============================================================
import { OPS } from './config';
import type { Question } from './types';

export function fmtNum(n: number): string { return String(n).replace('.', ',').replace('-', '−'); }
export function fmtQ(q: Question): string { return `${fmtNum(q.a)} ${OPS[q.op].sym} ${fmtNum(q.b)}`; }
export function fmtSec(ms: number): string { return (ms / 1000).toFixed(1).replace('.', ',') + ' s'; }
export function fmtDay(t: number): string { return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }); }

// Só a palavra: plural(2, 'casa', 'casas') -> 'casas'
export function plural(n: number, one: string, many: string): string { return n === 1 ? one : many; }
