import { useState, useCallback, useEffect } from 'react';

// ONE mobile breakpoint for the whole confirm flow. It must equal Tailwind's
// `sm` (min-width: 640px), because ActionButtons shows the pinned Confirm bar
// with `sm:hidden` and the desktop picker buttons with `hidden sm:block`.
// This used to be 768, which left 640-767px in "tap selects" mode with no
// Confirm button on screen (ARCADE-TOUCH-CONTROLS.md 0.6).
export const MOBILE_BREAKPOINT = 640;

/**
 * On mobile, card taps select rather than submit immediately.
 * User must tap "Confirm" to finalize their choice.
 * On desktop, taps submit immediately (no change from current behavior).
 */
export default function useMobileConfirm(makeChoice, roundKey, { touch = false } = {}) {
  // The selection remembers which round it was made in, so a selection left
  // over from the last round is gone in the very render that shows the next
  // one (an effect-based reset is a render late). That matters now that a
  // second tap on the selected card votes: a stale 'a' must never turn the
  // next round's first tap on card A into a vote.
  const [selection, setSelection] = useState(null);
  const selectedCard = selection && selection.key === roundKey ? selection.side : null;
  const setSelectedCard = useCallback((side) => {
    setSelection(side ? { side, key: roundKey } : null);
  }, [roundKey]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Two-step picking: under the mobile breakpoint, and for touch input at
  // any width (a landscape phone or tablet is 640px+ but still a finger:
  // G5, no single tap commits a round). Mouse at 640px+ is unchanged.
  const twoStep = isMobile || touch;

  // Two-step: the first tap selects, a second tap on the SAME card confirms
  // (Phase 2 touch: no trip down to the Confirm bar needed, and still never
  // a single-tap commit). Tapping the other card just moves the selection.
  const handleCardTap = useCallback((side) => {
    if (twoStep) {
      if (selectedCard === side) makeChoice(side);
      else setSelectedCard(side);
    } else {
      makeChoice(side);
    }
  }, [twoStep, makeChoice, selectedCard, setSelectedCard]);

  // A deliberate one-gesture vote (swipe a card up). Highlights the card
  // like a confirm does, then submits.
  const voteNow = useCallback((side) => {
    setSelectedCard(side);
    makeChoice(side);
  }, [makeChoice, setSelectedCard]);

  // Keyboard nav (R5) always goes through select-then-confirm, desktop
  // included, so Left/Right/1/2 pick a card and Enter/Space is a real
  // confirm step -- unlike a mouse click, which still submits immediately
  // on desktop via handleCardTap above.
  const selectCard = useCallback((side) => {
    setSelectedCard(side);
  }, [setSelectedCard]);

  const handleConfirm = useCallback(() => {
    if (selectedCard) {
      makeChoice(selectedCard);
      // Don't clear selection here — let resetSelection handle it
      // after the round transitions, so the card stays highlighted
      // while the API call is in flight
    }
  }, [selectedCard, makeChoice]);

  const resetSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selectedCard,
    isMobile,
    twoStep,
    handleCardTap,
    handleConfirm,
    resetSelection,
    selectCard,
    voteNow,
  };
}
