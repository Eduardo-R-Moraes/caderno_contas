// ============================================================
// Dificuldade, rifa e caderno
// ============================================================
import { FAST_MS, SLOW_MS, NEVER_SEEN, JUST_SEEN } from './config';
import { randomQuestion, makeKey } from './questions';
import type { Cand, Question, Raffle, Settings, Stat, Stats, Tag } from './types';

// PASSO 2: nota de dificuldade (1 a 10)
export function difficulty(stat: Stat | undefined): number {
  if (!stat) return NEVER_SEEN;
  const errorRate = (stat.wrongs + 1) / (stat.attempts + 2);
  let slowness = (stat.avgMs - FAST_MS) / (SLOW_MS - FAST_MS);
  slowness = Math.min(1, Math.max(0, slowness));
  return 1 + 6 * errorRate + 3 * slowness;
}

// PASSO 3: sorteia k candidatas e faz a rifa
export function nextQuestion(settings: Settings, stats: Stats, recent: string[]): Raffle {
  const cands: Cand[] = [];
  for (let i = 0; i < settings.candidates; i++) {
    const q = randomQuestion(settings);
    const key = makeKey(q);
    let note: number, tag: Tag;
    if (recent.includes(key)) { note = JUST_SEEN; tag = 'recente'; }
    else if (stats[key])      { note = difficulty(stats[key]); tag = 'vista'; }
    else                      { note = NEVER_SEEN; tag = 'nova'; }
    cands.push({ q, key, note, tag });
  }

  const total = cands.reduce((s, c) => s + c.note, 0);
  let drawn = Math.random() * total;
  let chosen = cands.length - 1;
  for (let i = 0; i < cands.length; i++) {
    drawn -= cands[i].note;
    if (drawn <= 0) { chosen = i; break; }
  }
  return { cands, total, chosen };
}

// PASSO 4: atualiza o caderno (devolve um novo objeto; quem chama salva)
export function record(stats: Stats, q: Question, correct: boolean, ms: number): Stats {
  const key = makeKey(q);
  const s = stats[key] ? { ...stats[key] } : { attempts: 0, wrongs: 0, avgMs: ms };
  s.attempts += 1;
  if (!correct) s.wrongs += 1;
  s.avgMs = s.avgMs * 0.7 + ms * 0.3;
  return { ...stats, [key]: s };
}
