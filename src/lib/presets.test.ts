import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './config';
import { createPreset, deletePreset, describeSettings, editPreset, finishRound, migrateLegacy, renamePreset, setStats, validateName } from './presets';
import type { Preset, Round, Settings } from './types';

const S = (patch: Partial<Settings> = {}): Settings => ({ ...structuredClone(DEFAULT_SETTINGS), ...patch });
const two = (): Preset[] => createPreset(createPreset([], 'A', S()), ' B ', S({ roundLength: null }));
const round = (rights: number, wrongs: number, roundLength: number | null): Round => ({
  rights, wrongs, score: rights * 5, roundSettings: S({ roundLength }),
  history: Array.from({ length: rights + wrongs }, (_, i) => ({ q: { op: 'sum', a: 1, b: i }, correct: i < rights, ms: 2000, given: 0 })),
});

describe('CRUD', () => {
  it('cria com dados zerados, renomeia e apaga', () => {
    let list = two();
    expect(list.map(p => p.name)).toEqual(['A', 'B']);
    expect(list[0]).toMatchObject({ stats: {}, scores: [] });
    expect(list[0].id).not.toBe(list[1].id);
    list = renamePreset(list, list[0].id, '  Tabuada ');
    expect(list[0].name).toBe('Tabuada');
    expect(deletePreset(list, list[0].id).map(p => p.name)).toEqual(['B']);
  });
  it('valida nome vazio e repetido', () => {
    const list = two();
    expect(validateName(list, '   ')).not.toBeNull();
    expect(validateName(list, 'a')).not.toBeNull();
    expect(validateName(list, 'A', list[0].id)).toBeNull();
    expect(validateName(list, 'C')).toBeNull();
  });
  it('resume a configuração', () => {
    expect(describeSettings(S())).toBe('+ × · 20 contas');
    expect(describeSettings(S({ operator: ['division'], roundLength: null }))).toBe('÷ · até parar');
  });
});

describe('dados por configuração', () => {
  it('o caderninho muda só na configuração jogada', () => {
    const list = two();
    const out = setStats(list, list[0].id, { 'sum:1:2': { attempts: 1, wrongs: 1, avgMs: 3000 } });
    expect(out[0].stats['sum:1:2']).toEqual({ attempts: 1, wrongs: 1, avgMs: 3000 });
    expect(out[1].stats).toEqual({});
    expect(list[0].stats).toEqual({});
  });
  it('só partida completa entra no histórico', () => {
    const list = two();
    let out = finishRound(list, list[0].id, round(3, 1, 20), 100);   // encerrada no meio
    expect(out[0].scores).toEqual([]);
    expect(out[0].lastPlayedAt).toBe(100);
    out = finishRound(out, out[0].id, round(15, 5, 20), 200);
    expect(out[0].scores).toEqual([{ at: 200, done: 20, rights: 15, score: 75, avgMs: 2000 }]);
    expect(out[1].scores).toEqual([]);
  });
  it('"até eu parar" entra se respondeu ao menos uma', () => {
    const list = two();
    expect(finishRound(list, list[1].id, round(0, 0, null))[1].scores).toEqual([]);
    expect(finishRound(list, list[1].id, round(2, 0, null))[1].scores).toHaveLength(1);
  });
});

describe('editPreset', () => {
  it('troca nome e settings e mantém caderninho e evolução', () => {
    let list = two();
    list = setStats(list, list[0].id, { 'sum:1:2': { attempts: 1, wrongs: 0, avgMs: 1000 } });
    list = finishRound(list, list[0].id, round(20, 0, 20), 100);
    const out = editPreset(list, list[0].id, ' A2 ', S({ candidates: 9 }), 200);
    expect(out[0]).toMatchObject({ name: 'A2', stats: list[0].stats, scores: list[0].scores, edits: [200] });
    expect(out[0].settings.candidates).toBe(9);
    expect(out[1]).toBe(list[1]);
    expect(list[0].settings.candidates).toBe(DEFAULT_SETTINGS.candidates);
  });
  it('só registra a edição quando as settings mudam', () => {
    const list = two();
    expect(editPreset(list, list[0].id, 'Outro', S(), 200)[0].edits).toBeUndefined();
    const once = editPreset(list, list[0].id, 'A', S({ order: '>' }), 200);
    expect(editPreset(once, once[0].id, 'A', S({ order: '<' }), 300)[0].edits).toEqual([200, 300]);
  });
});

describe('migrateLegacy', () => {
  it('sem dados antigos não cria nada', () => { expect(migrateLegacy(null, null)).toEqual([]); });
  it('configuração e caderninho antigos viram a primeira configuração', () => {
    const stats = { 'sum:1:2': { attempts: 1, wrongs: 0, avgMs: 1000 } };
    const [p, ...rest] = migrateLegacy({ candidates: 7 }, stats);
    expect(rest).toEqual([]);
    expect(p).toMatchObject({ name: 'Minha configuração', stats, scores: [] });
    expect(p.settings.candidates).toBe(7);
    expect(p.settings.sum).toEqual(DEFAULT_SETTINGS.sum);
  });
});
