import { useEffect, useRef } from 'react';
import { startCoach, COACH_KEY } from '../lib/touchKit';

/**
 * First 20 seconds (ARCADE-TOUCH-CONTROLS.md Phase 3, Rank Arena): on a
 * first visit by touch, a ghost hand swipes the left card up, the one-gesture
 * vote. Kit 1.1 coach only (a no-op on kit 1.0.0 or without the kit); the
 * overlay is pointer-events:none so it never blocks input, and it is saved
 * per device (rank-arena-v1). Any vote finishes it, so a player who votes
 * with tap-tap or the Confirm bar is not shown it again either.
 *
 * @param {React.RefObject<HTMLElement>} cardRef  the left card
 * @param {{ ready: boolean, voted: boolean }} opts  ready: a vote is open, by touch, nothing on top
 */
export default function useFirstVisitCoach(cardRef, { ready, voted }) {
  const handle = useRef(null);
  const tried = useRef(false);

  useEffect(() => {
    if (!ready || tried.current || !cardRef.current) return;
    tried.current = true;
    handle.current = startCoach({
      key: COACH_KEY,
      delay: 600,
      steps: [{ target: cardRef.current, gesture: 'swipe', dir: 'up', distance: 80, text: 'Swipe a card up to vote for it' }],
    });
  }, [ready, cardRef]);

  useEffect(() => {
    const h = handle.current;
    if (voted && h && h.active) h.finish();
  }, [voted]);

  useEffect(() => () => {
    const h = handle.current;
    if (h && h.active) h.stop();
  }, []);
}
