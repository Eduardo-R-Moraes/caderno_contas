import { expect, it } from 'vitest';
import { fmtNote, fmtNum, fmtQ, fmtSec, parseKey } from './format';

it('formata no padrão brasileiro', () => {
  expect(fmtNum(-2.5)).toBe('−2,5');
  expect(fmtQ({ op: 'multiplication', a: 7, b: 8 })).toBe('7 × 8');
  expect(fmtSec(1234)).toBe('1,2 s');
  expect(fmtNote(5)).toBe('5,0');
  expect(parseKey('division:-1.5:3')).toEqual({ op: 'division', a: -1.5, b: 3 });
});
