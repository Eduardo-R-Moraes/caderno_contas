import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './config';
import { answerOf, countPairs, isCorrect, makeKey, randomQuestion } from './questions';
import type { Range, Settings } from './types';

const D = DEFAULT_SETTINGS;
const R = (l1: number, l2: number, r1: number, r2: number, extra: Partial<Range> = {}): Range =>
  ({ leftInitial: l1, leftFinal: l2, rightInitial: r1, rightFinal: r2, decimals: 0, ...extra });

describe('countPairs', () => {
  it('conta os defaults de cada operação', () => {
    expect(countPairs('sum', D.sum, 'none')).toBe(121);
    expect(countPairs('subtraction', D.subtraction, 'none')).toBe(231);
    expect(countPairs('multiplication', D.multiplication, 'none')).toBe(100);
    expect(countPairs('division', D.division, 'none')).toBe(291);
  });
  it('respeita a ordem', () => {
    expect(countPairs('subtraction', D.subtraction, '>')).toBe(176);
    expect(countPairs('sum', R(0, 2, 0, 2), '<')).toBe(6);
  });
  it('devolve 0 quando nenhuma conta é possível', () => {
    expect(countPairs('sum', R(5, 6, 0, 2), '<')).toBe(0);
  });
  it('divisão com casas no resultado exclui divisor zero', () => {
    expect(countPairs('division', R(1, 3, -1, 1, { resultDecimals: 1 }), 'none')).toBe(6);
  });
  it('devolve null para ranges enormes', () => {
    expect(countPairs('sum', R(0, 1e7, 0, 1), 'none')).toBeNull();
  });
});

describe('randomQuestion', () => {
  const base: Settings = structuredClone(D);
  it('fica dentro dos ranges e respeita a ordem', () => {
    for (const order of ['none', '>', '<'] as const) {
      const s: Settings = { ...base, operator: ['subtraction'], order };
      for (let i = 0; i < 300; i++) {
        const q = randomQuestion(s);
        expect(q.a).toBeGreaterThanOrEqual(0); expect(q.a).toBeLessThanOrEqual(20);
        expect(q.b).toBeGreaterThanOrEqual(0); expect(q.b).toBeLessThanOrEqual(10);
        if (order === '>') expect(q.a).toBeGreaterThanOrEqual(q.b);
        if (order === '<') expect(q.a).toBeLessThanOrEqual(q.b);
      }
    }
  });
  it('divisão inteira é sempre exata e nunca divide por zero', () => {
    const s: Settings = { ...base, operator: ['division'], division: R(-20, 50, -5, 5, { resultDecimals: 0 }) };
    for (let i = 0; i < 300; i++) {
      const q = randomQuestion(s);
      expect(q.b).not.toBe(0);
      expect(Number.isInteger(q.a / q.b)).toBe(true);
    }
  });
  it('divisão com casas nunca divide por zero', () => {
    const s: Settings = { ...base, operator: ['division'], division: R(0, 10, -1, 1, { resultDecimals: 2 }) };
    for (let i = 0; i < 300; i++) expect(randomQuestion(s).b).not.toBe(0);
  });
  it('gera números com as casas decimais pedidas', () => {
    const s: Settings = { ...base, operator: ['sum'], sum: R(0, 1, 0, 1, { decimals: 1 }) };
    for (let i = 0; i < 100; i++) {
      const q = randomQuestion(s);
      expect(Math.round(q.a * 10) / 10).toBe(q.a);
    }
  });
});

describe('answerOf / isCorrect', () => {
  it('limpa sujeira de ponto flutuante', () => {
    expect(answerOf({ op: 'sum', a: 0.1, b: 0.2 })).toBe(0.3);
    expect(isCorrect({ op: 'sum', a: 0.1, b: 0.2 }, 0.3)).toBe(true);
  });
  it('arredonda a divisão com casas e aceita o valor exato', () => {
    const q = { op: 'division' as const, a: 10, b: 3, rd: 2 };
    expect(answerOf(q)).toBe(3.33);
    expect(isCorrect(q, 3.33)).toBe(true);
    expect(isCorrect(q, 3.333)).toBe(true);
    expect(isCorrect(q, 3.3)).toBe(false);
  });
  it('makeKey', () => { expect(makeKey({ op: 'sum', a: 7, b: 8 })).toBe('sum:7:8'); });
});
