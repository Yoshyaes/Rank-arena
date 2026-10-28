import { useCallback, useEffect, useRef, useState } from 'react';
import { haptic, reducedMotion } from '../lib/touchKit';

// Swipe a card upward to vote (ARCADE-TOUCH-CONTROLS.md Phase 2, Rank Arena).
//
// Touch and pen only: mouse input never reaches this, so desktop click
// behaviour is unchanged. The card follows the finger up; past the
// threshold it arms ("Release to vote") and letting go votes. Dragging back
// down below the threshold disarms it, so a swipe started by mistake (say,
// trying to scroll the page) can be taken back before release. A mostly
// sideways drag abandons the gesture.
export const SWIPE_MIN_PX = 56;
export const SWIPE_FRACTION = 0.22; // of the card's height
const MAX_LIFT_FRACTION = 0.45;
const SLOP_PX = 10;

export function swipeThreshold(cardHeight) {
  return Math.max(SWIPE_MIN_PX, Math.round((cardHeight || 0) * SWIPE_FRACTION));
}

/**
 * @param {React.RefObject<HTMLElement>} ref  the card element (its transform is driven directly, no re-render per move)
 * @param {{ enabled: boolean, onVote: () => void }} opts
 * @returns {{ handlers: object, dragging: boolean, armed: boolean, consumeClick: () => boolean }}
 */
export default function useSwipeVote(ref, { enabled, onVote }) {
  const g = useRef(null);
  const suppressClickUntil = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  const onVoteRef = useRef(onVote);
  onVoteRef.current = onVote;

  const paint = useCallback((lift, settle) => {
    const node = ref.current;
    if (!node) return;
    node.style.transition = settle && !reducedMotion() ? 'transform 180ms cubic-bezier(.2,.8,.3,1.2)' : 'none';
    node.style.transform = lift ? `translateY(${-lift}px) rotate(${(-lift / 60).toFixed(2)}deg)` : '';
    if (settle && !lift) {
      // Hand the transform back to the stylesheet once it has settled.
      setTimeout(() => { if (!g.current && ref.current) ref.current.style.transition = ''; }, 200);
    }
  }, [ref]);

  const reset = useCallback(() => {
    g.current = null;
    setDragging(false);
    setArmed(false);
    paint(0, true);
  }, [paint]);

  // Leaving the IDLE state mid-drag (round ended, data reloaded) drops the gesture.
  useEffect(() => { if (!enabled && g.current) reset(); }, [enabled, reset]);

  const onPointerDown = useCallback((e) => {
    suppressClickUntil.current = 0; // a new press: whatever the last drag swallowed, this one is fresh
    if (!enabled || g.current) return;
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    const h = ref.current ? ref.current.getBoundingClientRect().height : 0;
    g.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, armed: false, threshold: swipeThreshold(h), max: Math.max(80, h * MAX_LIFT_FRACTION) };
    // No explicit setPointerCapture: touch and pen are implicitly captured to the pressed element, and moving the
    // capture to the card changed the click target and cost the next tap its click in Chrome.
  }, [enabled, ref]);

  const onPointerMove = useCallback((e) => {
    const s = g.current;
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.moved) {
      if (Math.hypot(dx, dy) <= SLOP_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) { s.moved = true; s.abandoned = true; return; }
      s.moved = true;
      setDragging(true);
    }
    if (s.abandoned) return;
    const up = Math.max(0, -dy);
    const lift = up <= s.max ? up : s.max + (up - s.max) * 0.25; // rubber band past the max
    paint(lift, false);
    const nowArmed = up >= s.threshold && Math.abs(dx) < up;
    if (nowArmed !== s.armed) {
      s.armed = nowArmed;
      setArmed(nowArmed);
      if (nowArmed) haptic('tick'); // Android; iOS only buzzes inside the release below
    }
  }, [paint]);

  const finish = useCallback((e, cancelled) => {
    const s = g.current;
    if (!s || e.pointerId !== s.id) return;
    if (s.moved) suppressClickUntil.current = Date.now() + 500; // a drag is never also a tap
    const vote = !cancelled && s.armed && !s.abandoned;
    reset();
    if (vote) {
      haptic('heavy', [20, 40, 20]);
      onVoteRef.current?.();
    }
  }, [reset]);

  const onPointerUp = useCallback((e) => finish(e, false), [finish]);
  const onPointerCancel = useCallback((e) => finish(e, true), [finish]);

  /** True when the click that follows a drag should be ignored (call from onClick). */
  const consumeClick = useCallback(() => {
    if (Date.now() < suppressClickUntil.current) { suppressClickUntil.current = 0; return true; }
    return false;
  }, []);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    dragging,
    armed,
    consumeClick,
  };
}
