// ============================================================
// Sorteio
// ============================================================
import { OPS } from './config';
import type { Op, Order, Question, Range, Settings } from './types';

type Ranges = Pick<Range, 'leftInitial' | 'leftFinal' | 'rightInitial' | 'rightFinal'>;
interface DivOption { b: number; m: number; kMin: number; kMax: number }

function randInt(min: number, max: number): number {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeKey(q: Question): string { return q.op + ':' + q.a + ':' + q.b; }

// Range sempre em ordem crescente: [menor, maior]
function bounds(lo: number, hi: number): [number, number] { return lo <= hi ? [lo, hi] : [hi, lo]; }

const BIG = 200000;   // acima disso, não percorre o range inteiro

// Limites da esquerda para que exista pelo menos uma direita válida
//   '<' (esq ≤ dir): a esquerda não pode passar do maior número da direita
//   '>' (esq ≥ dir): a esquerda não pode ficar abaixo do menor número da direita
function leftLimits(r: Ranges, order: Order): [number, number] {
  const [L1, L2] = bounds(r.leftInitial, r.leftFinal);
  const [R1, R2] = bounds(r.rightInitial, r.rightFinal);
  if (order === '<') return [L1, Math.min(L2, R2)];
  if (order === '>') return [Math.max(L1, R1), L2];
  return [L1, L2];
}

// Limites da direita depois que a esquerda já foi sorteada
function rightLimits(r: Ranges, order: Order, a: number): [number, number] {
  const [R1, R2] = bounds(r.rightInitial, r.rightFinal);
  if (order === '<') return [Math.max(R1, a), R2];
  if (order === '>') return [R1, Math.min(R2, a)];
  return [R1, R2];
}

// Divisão: para cada divisor possível, quais múltiplos dele cabem no range da esquerda
//   resultado: [{ b, m, kMin, kMax }]  ->  dividendo = k * m, com k entre kMin e kMax
function divisionOptions(r: Ranges, order: Order, b: number): DivOption | null {
  const [L1, L2] = bounds(r.leftInitial, r.leftFinal);
  if (b === 0) return null;
  let lo = L1, hi = L2;
  if (order === '<') hi = Math.min(hi, b);   // dividendo ≤ divisor
  if (order === '>') lo = Math.max(lo, b);   // dividendo ≥ divisor
  const m = Math.abs(b);
  const kMin = Math.ceil(lo / m), kMax = Math.floor(hi / m);
  return kMin <= kMax ? { b, m, kMin, kMax } : null;
}

// Guarda só as últimas listas: o formulário recalcula a cada tecla e cada range digitado viraria uma entrada
const DIV_CACHE_SIZE = 20;
const divCache = new Map<string, DivOption[]>();
function divisionList(r: Ranges, order: Order): DivOption[] | null {
  const id = [r.leftInitial, r.leftFinal, r.rightInitial, r.rightFinal, order].join('|');
  const cached = divCache.get(id);
  if (cached) return cached;
  const [R1, R2] = bounds(r.rightInitial, r.rightFinal);
  if (R2 - R1 > BIG) return null;            // range enorme: sorteia sem lista
  const list: DivOption[] = [];
  for (let b = R1; b <= R2; b++) {
    const opt = divisionOptions(r, order, b);
    if (opt) list.push(opt);
  }
  if (divCache.size >= DIV_CACHE_SIZE) divCache.delete(divCache.keys().next().value!);
  divCache.set(id, list);
  return list;
}

// Casas decimais: em vez de sortear 2,5, sorteia o inteiro 25 num range multiplicado por 10
// e divide no final. Assim toda a lógica de ordem e de range continua trabalhando com inteiros.
//   range 0 a 10 com 1 casa  ->  range 0 a 100  ->  sorteia 37  ->  3,7
function scaled(r: Range): Ranges {
  const f = 10 ** (r.decimals || 0);
  return {
    leftInitial:  Math.round(r.leftInitial * f),
    leftFinal:    Math.round(r.leftFinal * f),
    rightInitial: Math.round(r.rightInitial * f),
    rightFinal:   Math.round(r.rightFinal * f),
  };
}

// Sorteio genérico: esquerda limitada pela ordem, depois direita a partir da esquerda
function randomPair(rs: Ranges, order: Order, avoidZeroB: boolean): [number, number] {
  for (let i = 0; i < 200; i++) {
    const [aLo, aHi] = leftLimits(rs, order);
    const a = randInt(aLo, aHi);
    const [bLo, bHi] = rightLimits(rs, order, a);
    const b = randInt(bLo, bHi);
    if (!(avoidZeroB && b === 0)) return [a, b];
  }
  return [1, 1];   // segurança: não achou nenhuma combinação
}

// O sorteio "normal", sem peso nenhum. Cada lado fica sempre dentro do próprio range.
export function randomQuestion(s: Settings): Question {
  const op = s.operator[Math.floor(Math.random() * s.operator.length)];
  const r = s[op];
  const f = 10 ** (r.decimals || 0);
  const rs = scaled(r);

  if (op === 'division') {
    const rd = r.resultDecimals || 0;

    if (rd > 0) {
      // Resultado com casas: qualquer divisão vale, só não pode dividir por zero
      const [a, b] = randomPair(rs, s.order, true);
      return { op, a: a / f, b: b / f, resultDecimals: rd };
    }

    // Resultado inteiro: dividendo no range da esquerda, divisor no range da direita
    let opt: DivOption | null = null;
    const list = divisionList(rs, s.order);
    if (list) {
      opt = list[Math.floor(Math.random() * list.length)];
    } else {
      for (let i = 0; i < 500 && !opt; i++) opt = divisionOptions(rs, s.order, randInt(rs.rightInitial, rs.rightFinal));
    }
    if (!opt) opt = { b: 1, m: 1, kMin: 1, kMax: 1 };
    const k = randInt(opt.kMin, opt.kMax);
    return { op, a: (k * opt.m) / f, b: opt.b / f, resultDecimals: 0 };
  }

  const [a, b] = randomPair(rs, s.order, false);
  return { op, a: a / f, b: b / f };
}

// Resposta certa de uma conta (arredondada quando a divisão pede casas)
export function answerOf(q: Question): number {
  const exact = OPS[q.op].calc(q.a, q.b);
  const rd = q.resultDecimals ?? 0;
  if (rd > 0) return Math.round(exact * 10 ** rd) / 10 ** rd;
  return Math.round(exact * 1e9) / 1e9;   // limpa sujeira de ponto flutuante (0,1 + 0,2)
}

// Na divisão com casas, aceita o valor arredondado certo (ou o valor exato, se a pessoa digitar mais casas)
export function isCorrect(q: Question, given: number): boolean {
  const exact = OPS[q.op].calc(q.a, q.b);
  if (Math.abs(given - exact) < 1e-9) return true;
  const rd = q.resultDecimals ?? 0;
  if (rd > 0) {
    const f = 10 ** rd;
    return Math.abs(Math.round(given * f) / f - answerOf(q)) < 1e-9;
  }
  return false;
}

// Quantas contas diferentes existem com essa configuração (null = grande demais para contar)
export function countPairs(op: Op, r: Range, order: Order): number | null {
  const rs = scaled(r);
  const division = op === 'division';

  if (division && !((r.resultDecimals ?? 0) > 0)) {
    const list = divisionList(rs, order);
    if (!list) return null;
    return list.reduce((s, o) => s + (o.kMax - o.kMin + 1), 0);
  }

  const [aLo, aHi] = leftLimits(rs, order);
  if (aLo > aHi) return 0;
  if (aHi - aLo > BIG) return null;
  let total = 0;
  for (let a = aLo; a <= aHi; a++) {
    const [bLo, bHi] = rightLimits(rs, order, a);
    if (bHi < bLo) continue;
    total += bHi - bLo + 1;
    if (division && bLo <= 0 && bHi >= 0) total -= 1;   // tira a divisão por zero
  }
  return total;
}
