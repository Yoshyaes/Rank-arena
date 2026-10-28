import { useEffect } from 'react';
import { haptic, reducedMotion } from '../lib/touchKit';

// Must match the stat count-up in GameCard (useCounter duration).
export const COUNT_UP_MS = 600;
const TICKS = 6;
const MIN_GAP_MS = 55; // the kit rate-limits haptics at 50ms; never schedule closer than that

/**
 * When the tick lands, in ms, for a count-up of `duration` eased with
 * ease-out cubic (useCounter). Tick k fires when the displayed value passes
 * k/(ticks) of the target, so ticks start fast and slow down with the
 * numbers, then the result haptic lands as the count stops.
 */
export function tickTimes(duration = COUNT_UP_MS, ticks = TICKS) {
  const out = [];
  let last = -Infinity;
  for (let k = 1; k < ticks; k++) {
    // eased = 1 - (1 - p)^3 = k / ticks  ->  p = 1 - (1 - k / ticks)^(1/3)
    const t = Math.round(duration * (1 - Math.cbrt(1 - k / ticks)));
    if (t - last >= MIN_GAP_MS && duration - t >= MIN_GAP_MS) { out.push(t); last = t; }
  }
  return out;
}

/**
 * Stat reveal feedback (ARCADE-TOUCH-CONTROLS.md Phase 2, Rank Arena):
 * light haptic ticks while the numbers count up, ending on a success or
 * fail haptic as they stop. Kit-only: without the Touch Kit this does
 * nothing, so pages without it behave as before. Reduced motion skips the
 * count-up (useCounter) and the ticks, and keeps the result haptic.
 *
 * @param {boolean} revealing  true from the moment the round's stats arrive
 * @param {boolean|null} isCorrect
 * @param {*} roundKey  changes every round, so each reveal fires once
 */
export default function useRevealHaptics(revealing, isCorrect, roundKey) {
  useEffect(() => {
    if (!revealing || isCorrect == null) return undefined;
    const timers = [];
    const end = reducedMotion() ? 0 : COUNT_UP_MS;
    if (end) tickTimes(end).forEach((t) => timers.push(setTimeout(() => haptic('tick'), t)));
    timers.push(setTimeout(() => haptic(isCorrect ? 'success' : 'fail'), end));
    return () => timers.forEach(clearTimeout);
  // Only a new reveal (revealing flips on, or a new round) restarts the sequence.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealing, roundKey]);
}
