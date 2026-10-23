// ============================================================
// Constantes (as mesmas do pseudocódigo)
// ============================================================
import type { Op, Settings } from './types';

export const FAST_MS = 2000;      // até 2 s: resposta "no automático"
export const SLOW_MS = 8000;      // 8 s ou mais: resposta lenta
export const NEVER_SEEN = 5.0;    // nota de quem nunca apareceu
export const JUST_SEEN = 0.1;     // nota de quem acabou de aparecer
export const RECENT_SIZE = 3;     // quantas contas ficam na lista de recentes

export const OPS: Record<Op, { label: string; sym: string; calc: (a: number, b: number) => number }> = {
  sum:            { label: 'Soma',          sym: '+', calc: (a, b) => a + b },
  subtraction:    { label: 'Subtração',     sym: '−', calc: (a, b) => a - b },
  multiplication: { label: 'Multiplicação', sym: '×', calc: (a, b) => a * b },
  division:       { label: 'Divisão',       sym: '÷', calc: (a, b) => a / b },
};

export const OP_KEYS = Object.keys(OPS) as Op[];

export const DEFAULT_SETTINGS: Settings = {
  operator: ['sum', 'multiplication'],
  order: 'none',
  roundLength: 20,          // null = até o usuário parar
  candidates: 4,
  sum:            { leftInitial: 0, leftFinal: 10, rightInitial: 0, rightFinal: 10, decimals: 0 },
  subtraction:    { leftInitial: 0, leftFinal: 20, rightInitial: 0, rightFinal: 10, decimals: 0 },
  multiplication: { leftInitial: 1, leftFinal: 10, rightInitial: 1, rightFinal: 10, decimals: 0 },
  division:       { leftInitial: 1, leftFinal: 100, rightInitial: 1, rightFinal: 10, decimals: 0, resultDecimals: 0 },
};
