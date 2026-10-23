// Cronômetro da conta atual (só ele re-renderiza a cada 100 ms)
import { useEffect, useState } from 'react';
import { fmtSec } from '../lib/format';

export default function Timer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(performance.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [startedAt]);
  return <div className="timer" id="timer">{fmtSec(elapsed)}</div>;
}
