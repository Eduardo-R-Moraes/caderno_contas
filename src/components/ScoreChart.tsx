// Gráfico de linha da evolução de uma configuração (SVG, sem bibliotecas)
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

interface Props {
  title: string;
  values: number[];
  dates: number[];
  fmt: (n: number) => string;
  max?: number;   // teto fixo do eixo (ex.: 100 para %); sem ele, arredonda o maior valor
}

const H = 170;
const PAD = { top: 14, right: 16, bottom: 26, left: 44 };

// Teto "redondo" para o eixo: 1, 2, 2,5 ou 5 × potência de 10
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find(m => m * p >= v) ?? 10) * p;
}

const fmtDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export default function ScoreChart({ title, values, dates, fmt, max }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [values.length < 2]);   // a caixa só existe com 2+ partidas

  const n = values.length;
  if (n < 2) {
    return (
      <div className="chart">
        <span className="eyebrow">{title}</span>
        <p className="hint">{n === 0 ? 'Nenhuma partida completa ainda.' : 'Jogue mais uma partida para ver a evolução.'}</p>
      </div>
    );
  }

  const top = max ?? niceMax(Math.max(...values));
  const iw = Math.max(0, w - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + i / (n - 1) * iw;
  const y = (v: number) => PAD.top + ih - v / top * ih;
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(n - 1).toFixed(1)},${PAD.top + ih}L${x(0).toFixed(1)},${PAD.top + ih}Z`;
  const ticks = [0, top / 2, top];
  const showMarkers = n <= 30;
  const last = n - 1;

  function pick(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - r.left - PAD.left) / iw * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  }
  function key(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const d = e.key === 'ArrowLeft' ? -1 : 1;
    setHover(h => Math.min(n - 1, Math.max(0, (h ?? last) + d)));
  }

  const h = hover;
  return (
    <div className="chart">
      <span className="eyebrow">{title}</span>
      <div className="chart-box" ref={boxRef}>
        {w > 0 && (
          <svg width={w} height={H} role="img" tabIndex={0}
            aria-label={`${title}: ${n} partidas, última ${fmt(values[last])}. Use as setas para ver cada partida.`}
            onPointerMove={pick} onPointerLeave={() => setHover(null)} onKeyDown={key} onBlur={() => setHover(null)}>
            {ticks.map(t => (
              <g key={t}>
                <line className="grid" x1={PAD.left} x2={PAD.left + iw} y1={y(t)} y2={y(t)} />
                <text className="tick" x={PAD.left - 8} y={y(t)} dy="0.35em" textAnchor="end">{fmt(t)}</text>
              </g>
            ))}
            <text className="tick" x={x(0)} y={H - 6} textAnchor="start">1</text>
            <text className="tick" x={x(last)} y={H - 6} textAnchor="end">{n}</text>
            <path className="area" d={area} />
            <path className="line" d={line} />
            {values.map((v, i) => (showMarkers || i === last) && (
              <rect key={i} className="mark" x={x(i) - 4} y={y(v) - 4} width={8} height={8} />
            ))}
            {h !== null && <>
              <line className="cross" x1={x(h)} x2={x(h)} y1={PAD.top} y2={PAD.top + ih} />
              <rect className="mark hot" x={x(h) - 5} y={y(values[h]) - 5} width={10} height={10} />
            </>}
          </svg>
        )}
        {h !== null && (
          <div className="chart-tip" style={{ left: Math.min(Math.max(x(h), 70), w - 70), top: y(values[h]) }}>
            <b>{fmt(values[h])}</b>
            <span>Partida {h + 1} · {fmtDate(dates[h])}</span>
          </div>
        )}
      </div>
    </div>
  );
}
