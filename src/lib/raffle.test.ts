import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, JUST_SEEN, NEVER_SEEN } from './config';
import { difficulty, nextQuestion, record } from './raffle';
import type { Settings, Stats } from './types';

describe('difficulty', () => {
  it('nunca vista vale NEVER_SEEN', () => { expect(difficulty(undefined)).toBe(NEVER_SEEN); });
  it('rápida e sempre certa fica perto de 1', () => {
    expect(difficulty({ attempts: 98, wrongs: 0, avgMs: 1000 })).toBeCloseTo(1 + 6 / 100);
  });
  it('lenta e sempre errada fica perto de 10', () => {
    expect(difficulty({ attempts: 98, wrongs: 98, avgMs: 9000 })).toBeCloseTo(1 + 6 * 99 / 100 + 3);
  });
});

describe('record', () => {
  it('cria a entrada e não muta o original', () => {
    const stats: Stats = {};
    const out = record(stats, { op: 'sum', a: 1, b: 2 }, false, 3000);
    expect(stats).toEqual({});
    expect(out['sum:1:2']).toEqual({ attempts: 1, wrongs: 1, avgMs: 3000 });
  });
  it('média móvel 0,7 / 0,3', () => {
    const stats: Stats = { 'sum:1:2': { attempts: 1, wrongs: 0, avgMs: 1000 } };
    const out = record(stats, { op: 'sum', a: 1, b: 2 }, true, 2000);
    expect(out['sum:1:2']).toEqual({ attempts: 2, wrongs: 0, avgMs: 1300 });
    expect(stats['sum:1:2'].avgMs).toBe(1000);
  });
});

describe('nextQuestion', () => {
  const s: Settings = { ...structuredClone(DEFAULT_SETTINGS), operator: ['sum'], candidates: 5,
    sum: { leftInitial: 1, leftFinal: 1, rightInitial: 1, rightFinal: 2, decimals: 0 } };
  it('marca nova / vista / recente e escolhe um índice válido', () => {
    const stats: Stats = { 'sum:1:2': { attempts: 1, wrongs: 0, avgMs: 1000 } };
    for (let i = 0; i < 50; i++) {
      const r = nextQuestion(s, stats, ['sum:1:1']);
      expect(r.cands).toHaveLength(5);
      expect(r.chosen).toBeGreaterThanOrEqual(0); expect(r.chosen).toBeLessThan(5);
      for (const c of r.cands) {
        if (c.key === 'sum:1:1') expect([c.tag, c.note]).toEqual(['recent', JUST_SEEN]);
        else expect(c.tag).toBe('seen');
      }
      expect(r.total).toBeCloseTo(r.cands.reduce((t, c) => t + c.note, 0));
    }
    expect(nextQuestion(s, {}, []).cands.every(c => c.tag === 'new' && c.note === NEVER_SEEN)).toBe(true);
  });
});
