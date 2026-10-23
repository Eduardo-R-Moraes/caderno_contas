// Botão "Apagar caderno" com confirmação
import { useState } from 'react';

export default function ResetNotebook({ hasStats, onReset }: { hasStats: boolean; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!hasStats) return null;
  if (!confirming) {
    return <button className="small danger" id="btn-reset" onClick={() => setConfirming(true)}>Apagar caderno</button>;
  }
  return <>
    <span className="hint">Apagar todo o histórico?</span>
    <button className="small danger" id="btn-reset-yes" onClick={() => { setConfirming(false); onReset(); }}>Apagar</button>
    <button className="small" id="btn-reset-no" onClick={() => setConfirming(false)}>Cancelar</button>
  </>;
}
