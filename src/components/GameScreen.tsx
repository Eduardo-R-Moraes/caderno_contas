// ============================================================
// Partida
// ============================================================
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RECENT_SIZE } from '../lib/config';
import { answerOf, isCorrect } from '../lib/questions';
import { nextQuestion, record } from '../lib/raffle';
import { fmtNum, fmtQ, fmtSec, plural } from '../lib/format';
import { answered } from '../lib/presets';
import { isMuted, play, setMuted } from '../lib/sounds';
import type { Question, Round, Settings, Stats } from '../lib/types';
import Timer from './Timer';

interface Current { q: Question; key: string; note: number; startedAt: number }
interface Feedback { cls: '' | 'ok' | 'err'; text: string }

function askNext(settings: Settings, stats: Stats, recent: string[]): Current {
  const raffle = nextQuestion(settings, stats, recent);
  const c = raffle.cands[raffle.chosen];
  return { q: c.q, key: c.key, note: c.note, startedAt: performance.now() };
}

interface Props {
  settings: Settings;
  stats: Stats;
  onStats: (s: Stats) => void;
  onEnd: (round: Round) => void;
}

export default function GameScreen({ settings, stats, onStats, onEnd }: Props) {
  const [round, setRound] = useState<Round>(() => ({ rights: 0, wrongs: 0, score: 0, roundSettings: structuredClone(settings), history: [] }));
  const [recent, setRecent] = useState<string[]>([]);
  const [current, setCurrent] = useState<Current>(() => askNext(settings, stats, []));
  const [feedback, setFeedback] = useState<Feedback>({ cls: '', text: 'Digite a resposta e aperte Enter.' });
  const [answer, setAnswer] = useState('');
  const [muted, setMutedState] = useState(isMuted);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [current]);

  const { q } = current;
  const qText = fmtQ(q);
  // Encolhe a fonte para a conta inteira caber na largura do quadro (cada caractere da fonte pixel = 1 em)
  const chars = (qText + ' = ?').length;
  const fontSize = `min(3.2rem, calc(92cqi / ${chars}))`;
  const rd = q.resultDecimals ?? 0;
  const qLabel = rd > 0
    ? `Quanto é (arredonde para ${rd} ${plural(rd, 'casa', 'casas')})`
    : 'Quanto é';

  const done = answered(round);
  const len = round.roundSettings.roundLength;
  const progress = len ? `${Math.min(done + 1, len)}/${len}` : String(done + 1);

  function toggleSign() {
    setAnswer(v => v.startsWith('-') ? v.slice(1) : '-' + v);
    inputRef.current?.focus();
  }

  function toggleMute() {
    setMuted(!muted);
    setMutedState(!muted);
    inputRef.current?.focus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const raw = answer.trim().replace(',', '.').replace('−', '-');
    if (raw === '' || raw === '-' || Number.isNaN(Number(raw))) { inputRef.current?.focus(); return; }

    const ms = performance.now() - current.startedAt;
    const given = Number(raw);
    const correct = isCorrect(q, given);
    play(correct ? 'rightAnswer' : 'wrongAnswer');
    const points = Math.max(1, Math.round(current.note));

    const nextStats = record(stats, q, correct, ms);
    onStats(nextStats);
    const nextRound: Round = {
      ...round,
      rights: round.rights + (correct ? 1 : 0),
      wrongs: round.wrongs + (correct ? 0 : 1),
      score: round.score + (correct ? points : 0),
      history: [...round.history, { q, correct, ms, given }],
    };

    const nextRecent = [...recent, current.key];
    if (nextRecent.length > RECENT_SIZE) nextRecent.shift();

    setFeedback(correct
      ? { cls: 'ok', text: `✓ ${qText} = ${fmtNum(answerOf(q))} · ${fmtSec(ms)} · +${points} pts` }
      : { cls: 'err', text: `✗ ${qText} = ${fmtNum(answerOf(q))} (você: ${fmtNum(given)}) · ${fmtSec(ms)}` });

    if (len && answered(nextRound) >= len) { onEnd(nextRound); return; }
    setRound(nextRound);
    setRecent(nextRecent);
    setAnswer('');
    setCurrent(askNext(settings, nextStats, nextRecent));
  }

  return (
    <section className="wrap screen">
      <div className="scorebar">
        <div className="chip"><span className="eyebrow">Conta</span><b>{progress}</b></div>
        <div className="chip ok"><span className="eyebrow">Acertos</span><b>{round.rights}</b></div>
        <div className="chip err"><span className="eyebrow">Erros</span><b>{round.wrongs}</b></div>
        <div className="chip score"><span className="eyebrow">Pontos</span><b>{round.score}</b></div>
        <div className="spacer"></div>
        <button id="btn-sound" title={muted ? 'Ligar som' : 'Desligar som'} aria-label="Som" aria-pressed={!muted}
          onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
        <button id="btn-stop" onClick={() => onEnd(round)}>Encerrar partida</button>
      </div>

      <div className="panel board">
        <span className="eyebrow">{qLabel}</span>
        <div className="question" style={{ fontSize }}>{qText} <span className="eq">=</span> ?</div>
        <form className="answer-row" autoComplete="off" onSubmit={submit}>
          <button type="button" className="sign" title="Trocar sinal" aria-label="Trocar sinal" onClick={toggleSign}>±</button>
          <input ref={inputRef} type="text" inputMode="decimal" enterKeyHint="send" autoCorrect="off" spellCheck={false}
            aria-label="Sua resposta" value={answer} onChange={e => setAnswer(e.target.value)} />
          <button type="submit" className="primary">OK</button>
        </form>
        <Timer key={current.startedAt} startedAt={current.startedAt} />
        <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
      </div>
    </section>
  );
}
