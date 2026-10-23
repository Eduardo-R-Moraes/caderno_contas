// ============================================================
// Caderninho (tabela)
// ============================================================
import { difficulty } from '../lib/raffle';
import { fmtNote, fmtQ, fmtSec, parseKey } from '../lib/format';
import type { Stats } from '../lib/types';

export default function Notebook({ stats }: { stats: Stats }) {
  const rows = Object.entries(stats)
    .map(([key, s]) => ({ key, s, note: difficulty(s) }))
    .sort((x, y) => y.note - x.note)
    .slice(0, 40);

  if (!rows.length) {
    return <div><p className="empty">Ainda vazio. Cada conta respondida aparece aqui com tentativas, erros, tempo médio e nota.</p></div>;
  }
  const total = Object.keys(stats).length;
  return (
    <div>
      <div className="table-wrap"><table>
        <thead><tr><th>Conta</th><th className="r">Tentativas</th><th className="r">Erros</th><th className="r">Tempo médio</th><th>Nota (1–10)</th></tr></thead>
        <tbody>
          {rows.map(({ key, s, note }) => (
            <tr key={key}>
              <td>{fmtQ(parseKey(key))}</td>
              <td className="r">{s.attempts}</td>
              <td className="r">{s.wrongs}</td>
              <td className="r">{fmtSec(s.avgMs)}</td>
              <td><div className="note-cell"><span>{fmtNote(note)}</span><span className="mini"><i style={{ width: `${(note - 1) / 9 * 100}%` }}></i></span></div></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {total > rows.length && <p className="hint">Mostrando as 40 mais difíceis de {total}.</p>}
    </div>
  );
}
