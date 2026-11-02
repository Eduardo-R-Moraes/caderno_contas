// ============================================================
// Cronômetro da conta atual (só ele re-renderiza a cada 100 ms)
// ============================================================
import { useEffect, useState } from 'react';
import { fmtSec } from '../lib/format';

interface Props {
  startedAt: number;
}

export default function Timer({ startedAt }: Props) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(performance.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [startedAt]);
  return <div className="timer">{fmtSec(elapsed)}</div>;
}
