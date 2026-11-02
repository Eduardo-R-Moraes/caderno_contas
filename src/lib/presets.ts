// ============================================================
// Configurações salvas (cada uma com caderninho e histórico próprios)
// ============================================================
import { DEFAULT_SETTINGS, OPS } from './config';
import { plural } from './format';
import type { Preset, Round, Settings, Stats } from './types';

// Todas devolvem uma lista nova; quem chama salva

export function createPreset(list: Preset[], name: string, settings: Settings, now = Date.now()): Preset[] {
  const p: Preset = { id: crypto.randomUUID(), name: name.trim(), createdAt: now, settings: structuredClone(settings), stats: {}, scores: [] };
  return [...list, p];
}

export function renamePreset(list: Preset[], id: string, name: string): Preset[] {
  return list.map(p => p.id === id ? { ...p, name: name.trim() } : p);
}

// Mantém caderninho e evolução; só registra a edição se as settings mudaram de fato
export function editPreset(list: Preset[], id: string, name: string, settings: Settings, now = Date.now()): Preset[] {
  return list.map(p => {
    if (p.id !== id) return p;
    const changed = JSON.stringify(p.settings) !== JSON.stringify(settings);
    return { ...p, name: name.trim(), settings: structuredClone(settings), ...(changed && { edits: [...(p.edits ?? []), now] }) };
  });
}

export function deletePreset(list: Preset[], id: string): Preset[] {
  return list.filter(p => p.id !== id);
}

export function duplicateDraftName(name: string): string { return `${name} (cópia)`; }

// Cada resposta atualiza o caderninho da configuração, mesmo se a partida for encerrada antes do fim
export function setStats(list: Preset[], id: string, stats: Stats): Preset[] {
  return list.map(p => p.id === id ? { ...p, stats } : p);
}

// Quantas contas a partida já respondeu
export function answered(round: Round): number {
  return round.rights + round.wrongs;
}

// Duração fixa: completa só se chegou ao fim. "Até eu parar": completa se respondeu ao menos uma
export function isComplete(round: Round): boolean {
  const done = answered(round);
  const len = round.roundSettings.roundLength;
  return len == null ? done > 0 : done >= len;
}

// Só partidas completas entram no histórico, para a comparação ser justa.
// Partida encerrada sem nenhuma resposta não conta como jogada.
export function finishRound(list: Preset[], id: string, round: Round, now = Date.now()): Preset[] {
  const done = answered(round);
  if (done === 0) return list;
  return list.map(p => {
    if (p.id !== id) return p;
    if (!isComplete(round)) return { ...p, lastPlayedAt: now };
    const avgMs = round.history.reduce((s, h) => s + h.ms, 0) / done;
    return { ...p, lastPlayedAt: now, scores: [...p.scores, { at: now, done, rights: round.rights, score: round.score, avgMs }] };
  });
}

export function validateName(list: Preset[], name: string, exceptId?: string): string | null {
  const n = name.trim();
  if (!n) return 'Dê um nome para a configuração.';
  if (list.some(p => p.id !== exceptId && p.name.toLowerCase() === n.toLowerCase())) return 'Já existe uma configuração com esse nome.';
  return null;
}

// Resumo curto para os cards: "+ × · 20 contas"
export function describeSettings(s: Settings): string {
  const syms = s.operator.map(op => OPS[op].sym).join(' ');
  return `${syms} · ${s.roundLength == null ? 'até parar' : `${s.roundLength} ${plural(s.roundLength, 'conta', 'contas')}`}`;
}

export function bestScore(p: Preset): number | null {
  return p.scores.length ? Math.max(...p.scores.map(x => x.score)) : null;
}

// Antes havia uma configuração e um caderninho só: viram a primeira configuração salva
export function migrateLegacy(oldSettings: Partial<Settings> | null, oldStats: Stats | null, now = Date.now()): Preset[] {
  if (!oldSettings && !oldStats) return [];
  const list = createPreset([], 'Minha configuração', Object.assign(structuredClone(DEFAULT_SETTINGS), oldSettings ?? {}), now);
  list[0].stats = oldStats ?? {};
  return list;
}
