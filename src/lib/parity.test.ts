// TEMPORÁRIO: compara o port com o js/questions.js original. Removido junto com js/.
import { expect, it } from 'vitest';
// @ts-expect-error módulo JS sem tipos
import * as old from '../../js/questions.js';
import { countPairs } from './questions';
import type { Op, Order, Range } from './types';

it('countPairs igual ao original em configurações aleatórias', () => {
  const ops: Op[] = ['sum', 'subtraction', 'multiplication', 'division'];
  const orders: Order[] = ['none', '>', '<'];
  const n = () => Math.floor(Math.random() * 41) - 10;
  for (let i = 0; i < 2000; i++) {
    const op = ops[i % 4];
    const r: Range = { leftInitial: n(), leftFinal: n(), rightInitial: n(), rightFinal: n(),
      decimals: Math.floor(Math.random() * 2), resultDecimals: Math.floor(Math.random() * 2) };
    const order = orders[i % 3];
    expect(countPairs(op, r, order)).toBe(old.countPairs(op, r, order));
  }
});
