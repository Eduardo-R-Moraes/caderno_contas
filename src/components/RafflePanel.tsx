// Como a conta atual foi sorteada (rifa + recentes)
import { fmtNote, fmtQ, parseKey } from '../lib/format';
import type { Raffle, Tag } from '../lib/types';

const TAG_LABEL: Record<Tag, string> = { nova: 'nunca vista', vista: 'já vista', recente: 'acabou de sair' };

export default function RafflePanel({ raffle, recent }: { raffle: Raffle; recent: string[] }) {
  const { cands, total, chosen } = raffle;
  const n = cands.length;
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Como esta conta foi sorteada</h2>
      </div>
      <p className="hint" id="raffle-intro">
        {n === 1
          ? 'Com 1 candidata, o sorteio é comum: não há rifa.'
          : `O app sorteou ${n} contas ao acaso. Cada nota virou bilhetes de rifa (${fmtNote(total)} no total) e um bilhete foi tirado.`}
      </p>
      <div className="raffle-list" id="raffle">
        {cands.map((c, i) => {
          const pct = c.note / total * 100;
          return (
            <div key={i} className={`cand ${i === chosen ? 'chosen' : ''}`}>
              <span className="q">{fmtQ(c.q)}<span className={`tag ${c.tag}`}>{TAG_LABEL[c.tag]}</span>{i === chosen && <span className="tag sorteada">sorteada</span>}</span>
              <span className="meta num">nota {fmtNote(c.note)} · {pct.toFixed(0)}%</span>
              <span className="bar"><i style={{ width: `${pct}%` }}></i></span>
            </div>
          );
        })}
      </div>
      <div className="recent" id="recent">
        {recent.length > 0 && <>Recentes (quase sem bilhetes): {recent.map((k, i) => <code key={i}>{fmtQ(parseKey(k))}</code>)}</>}
      </div>
    </div>
  );
}
