export type Op = 'sum' | 'subtraction' | 'multiplication' | 'division';
export type Order = 'none' | '>' | '<';

export interface Range {
  leftInitial: number;
  leftFinal: number;
  rightInitial: number;
  rightFinal: number;
  decimals: number;          // casas decimais dos números sorteados (0 a 3)
  resultDecimals?: number;   // só divisão: 0 = resultado inteiro; 1 a 3 = resposta arredondada
}

export interface Settings {
  operator: Op[];
  order: Order;
  roundLength: number | null;   // null = até o usuário parar
  candidates: number;
  sum: Range;
  subtraction: Range;
  multiplication: Range;
  division: Range;
}

export interface Question { op: Op; a: number; b: number; rd?: number }

export interface Stat { attempts: number; wrongs: number; avgMs: number }
export type Stats = Record<string, Stat>;   // o caderninho: { "sum:7:8": { attempts, wrongs, avgMs } }

export type Tag = 'nova' | 'vista' | 'recente';
export interface Cand { q: Question; key: string; note: number; tag: Tag }
export interface Raffle { cands: Cand[]; total: number; chosen: number }

export interface HistoryItem { q: Question; correct: boolean; ms: number; given: number }
export interface Round { rights: number; wrongs: number; score: number; roundSettings: Settings; history: HistoryItem[] }
