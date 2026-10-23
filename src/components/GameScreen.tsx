// ============================================================
// Partida
// ============================================================
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RECENT_SIZE } from '../lib/config';
import { answerOf, isCorrect } from '../lib/questions';
import { nextQuestion, record } from '../lib/raffle';
import { fmtNum, fmtQ, fmtSec } from '../lib/format';
import type { Question, Raffle, Round, Settings, Stats } from '../lib/types';
import Timer from './Timer';
import RafflePanel from './RafflePanel';

interface Current { q: Question; key: string; note: number; raffle: Raffle; startedAt: number }
interface Feedback { cls: '' | 'ok' | 'err'; text: string }

function askNext(settings: Settings, stats: Stats, recent: string[]): Current {
  const raffle = nextQuestion(settings, stats, recent);
  const c = raffle.cands[raffle.chosen];
  return { q: c.q, key: c.key, note: c.note, raffle, startedAt: performance.now() };
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [current]);

  const { q } = current;
  const qText = fmtQ(q);
  // Encolhe a fonte para a conta inteira caber na largura do quadro (cada caractere mono ≈ 0,62 em)
  const chars = (qText + ' = ?').length;
  const fontSize = `min(4rem, calc(92cqi / ${(chars * 0.62).toFixed(2)}))`;
  const qLabel = q.rd && q.rd > 0
    ? `Quanto é (arredonde para ${q.rd} ${q.rd === 1 ? 'casa' : 'casas'})`
    : 'Quanto é';

  const done = round.rights + round.wrongs;
  const len = round.roundSettings.roundLength;
  const progress = len ? `${Math.min(done + 1, len)}/${len}` : String(done + 1);

  function toggleSign() {
    setAnswer(v => v.startsWith('-') ? v.slice(1) : '-' + v);
    inputRef.current?.focus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const raw = answer.trim().replace(',', '.').replace('−', '-');
    if (raw === '' || raw === '-' || Number.isNaN(Number(raw))) { inputRef.current?.focus(); return; }

    const ms = performance.now() - current.startedAt;
    const given = Number(raw);
    const correct = isCorrect(q, given);
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

    if (len && nextRound.rights + nextRound.wrongs >= len) { onEnd(nextRound); return; }
    setRound(nextRound);
    setRecent(nextRecent);
    setAnswer('');
    setCurrent(askNext(settings, nextStats, nextRecent));
  }

  return (
    <section id="screen-game" className="wrap" style={{ gap: 16 }}>
      <div className="scorebar">
        <div className="chip"><span className="eyebrow">Conta</span><b id="s-progress">{progress}</b></div>
        <div className="chip ok"><span className="eyebrow">Acertos</span><b id="s-rights">{round.rights}</b></div>
        <div className="chip err"><span className="eyebrow">Erros</span><b id="s-wrongs">{round.wrongs}</b></div>
        <div className="chip score"><span className="eyebrow">Pontos</span><b id="s-score">{round.score}</b></div>
        <div className="spacer"></div>
        <button id="btn-stop" onClick={() => onEnd(round)}>Encerrar partida</button>
      </div>

      <div className="game">
        <div className="panel board">
          <span className="eyebrow" id="q-label">{qLabel}</span>
          <div className="question" id="question" style={{ fontSize }}>{qText} <span className="eq">=</span> ?</div>
          <form className="answer-row" id="answer-form" autoComplete="off" onSubmit={submit}>
            <button type="button" className="sign" id="btn-sign" title="Trocar sinal" aria-label="Trocar sinal" onClick={toggleSign}>±</button>
            <input ref={inputRef} type="text" id="answer" inputMode="decimal" enterKeyHint="send" autoCorrect="off" spellCheck={false}
              aria-label="Sua resposta" value={answer} onChange={e => setAnswer(e.target.value)} />
            <button type="submit" className="primary">OK</button>
          </form>
          <Timer key={current.startedAt} startedAt={current.startedAt} />
          <div className={'feedback ' + feedback.cls} id="feedback">{feedback.text}</div>
        </div>

        <RafflePanel raffle={current.raffle} recent={recent} />
      </div>
    </section>
  );
}
