import { expect, it } from 'vitest';
import { fmtNum, fmtQ, fmtSec, plural } from './format';

it('formata no padrão brasileiro', () => {
  expect(fmtNum(-2.5)).toBe('−2,5');
  expect(fmtQ({ op: 'multiplication', a: 7, b: 8 })).toBe('7 × 8');
  expect(fmtSec(1234)).toBe('1,2 s');
  expect(plural(1, 'casa', 'casas')).toBe('casa');
  expect(plural(2, 'casa', 'casas')).toBe('casas');
});
