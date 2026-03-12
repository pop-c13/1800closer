import { useApp } from '../context/AppContext';

const SLOT_DURATION = 30 * 60;

export default function CallTimer() {
  const { callDuration, isCallActive } = useApp();

  const elapsedMin = Math.floor(callDuration / 60);
  const elapsedSec = callDuration % 60;
  const elapsed = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`;

  const remaining = SLOT_DURATION - callDuration;
  let remainingDisplay;
  if (remaining <= 0) {
    remainingDisplay = 'OVER';
  } else {
    const remMin = Math.floor(remaining / 60);
    const remSec = remaining % 60;
    remainingDisplay = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  }

  let colorClass;
  if (!isCallActive) {
    colorClass = 'text-white/40';
  } else if (callDuration >= SLOT_DURATION) {
    colorClass = 'text-red-400 animate-pulse';
  } else if (callDuration >= SLOT_DURATION - 5 * 60) {
    colorClass = 'text-yellow-400';
  } else {
    colorClass = 'text-green-400';
  }

  return (
    <span className={`font-mono text-sm ${colorClass}`}>
      {elapsed} / {remainingDisplay}
    </span>
  );
}
