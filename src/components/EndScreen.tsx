// ============================================================
// Fim da partida
// ============================================================
import { answerOf } from '../lib/questions';
import { fmtNum, fmtQ, fmtSec } from '../lib/format';
import { answered, isComplete } from '../lib/presets';
import type { Round } from '../lib/types';

interface Props {
  round: Round;
  onAgain: () => void;
  onDetail: () => void;
  onList: () => void;
}

export default function EndScreen({ round, onAgain, onDetail, onList }: Props) {
  const done = answered(round);
  const avg = done ? round.history.reduce((s, h) => s + h.ms, 0) / done : 0;
  const acc = done ? Math.round(round.rights / done * 100) : 0;
  const misses = round.history.filter(h => !h.correct);

  return (
    <section className="wrap screen">
      <div className="panel">
        <div className="panel-head"><h2>Fim da partida</h2></div>
        <div className="summary">
          <div className="chip"><span className="eyebrow">Contas</span><b>{done}</b></div>
          <div className="chip ok"><span className="eyebrow">Acertos</span><b>{round.rights}</b></div>
          <div className="chip err"><span className="eyebrow">Erros</span><b>{round.wrongs}</b></div>
          <div className="chip"><span className="eyebrow">Aproveitamento</span><b>{acc}%</b></div>
          <div className="chip"><span className="eyebrow">Tempo médio</span><b>{fmtSec(avg)}</b></div>
          <div className="chip score"><span className="eyebrow">Pontos</span><b>{round.score}</b></div>
        </div>
        <div>
          {misses.length > 0
            ? <div className="field"><span className="eyebrow">Para treinar mais</span><div className="misses">{misses.map((h, i) => <code key={i}>{fmtQ(h.q)} = {fmtNum(answerOf(h.q))}</code>)}</div></div>
            : done > 0 && <p className="hint">Nenhum erro nesta partida.</p>}
        </div>
        {!isComplete(round) && <p className="hint">Partida encerrada antes do fim: as respostas foram para o caderninho, mas os pontos não entram na evolução.</p>}
        <div className="actions">
          <button className="primary" onClick={onAgain}>Jogar de novo</button>
          <button onClick={onDetail}>Ver evolução</button>
          <button onClick={onList}>Configurações</button>
        </div>
      </div>
    </section>
  );
}
