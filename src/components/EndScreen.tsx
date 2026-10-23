// ============================================================
// Fim da partida
// ============================================================
import { answerOf } from '../lib/questions';
import { fmtNum, fmtQ, fmtSec } from '../lib/format';
import type { Round, Stats } from '../lib/types';
import Notebook from './Notebook';

interface Props { round: Round; stats: Stats; onAgain: () => void; onConfig: () => void }

export default function EndScreen({ round, stats, onAgain, onConfig }: Props) {
  const done = round.rights + round.wrongs;
  const avg = done ? round.history.reduce((s, h) => s + h.ms, 0) / done : 0;
  const acc = done ? Math.round(round.rights / done * 100) : 0;
  const misses = round.history.filter(h => !h.correct);

  return (
    <section id="screen-end" className="wrap" style={{ gap: 16 }}>
      <div className="panel">
        <div className="panel-head"><h2>Fim da partida</h2></div>
        <div className="summary" id="summary">
          <div className="chip"><span className="eyebrow">Contas</span><b>{done}</b></div>
          <div className="chip ok"><span className="eyebrow">Acertos</span><b>{round.rights}</b></div>
          <div className="chip err"><span className="eyebrow">Erros</span><b>{round.wrongs}</b></div>
          <div className="chip"><span className="eyebrow">Aproveitamento</span><b>{acc}%</b></div>
          <div className="chip"><span className="eyebrow">Tempo médio</span><b>{fmtSec(avg)}</b></div>
          <div className="chip score"><span className="eyebrow">Pontos</span><b>{round.score}</b></div>
        </div>
        <div id="misses-box">
          {misses.length > 0
            ? <div className="field"><span className="eyebrow">Para treinar mais</span><div className="misses">{misses.map((h, i) => <code key={i}>{fmtQ(h.q)} = {fmtNum(answerOf(h.q))}</code>)}</div></div>
            : done > 0 && <p className="hint">Nenhum erro nesta partida.</p>}
        </div>
        <div className="actions">
          <button className="primary" id="btn-again" onClick={onAgain}>Jogar de novo</button>
          <button id="btn-config" onClick={onConfig}>Mudar configurações</button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>O caderninho</h2></div>
        <Notebook stats={stats} />
      </div>
    </section>
  );
}
