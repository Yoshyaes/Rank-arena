import { useState, useCallback, useEffect } from 'react';

/**
 * On mobile, card taps select rather than submit immediately.
 * User must tap "Confirm" to finalize their choice.
 * On desktop, taps submit immediately (no change from current behavior).
 */
export default function useMobileConfirm(makeChoice) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleCardTap = useCallback((side) => {
    if (isMobile) {
      setSelectedCard(side);
    } else {
      makeChoice(side);
    }
  }, [isMobile, makeChoice]);

  // Keyboard nav (R5) always goes through select-then-confirm, desktop
  // included, so Left/Right/1/2 pick a card and Enter/Space is a real
  // confirm step -- unlike a mouse click, which still submits immediately
  // on desktop via handleCardTap above.
  const selectCard = useCallback((side) => {
    setSelectedCard(side);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedCard) {
      makeChoice(selectedCard);
      // Don't clear selection here — let resetSelection handle it
      // after the round transitions, so the card stays highlighted
      // while the API call is in flight
    }
  }, [selectedCard, makeChoice]);

  const resetSelection = useCallback(() => {
    setSelectedCard(null);
  }, []);

  return {
    selectedCard,
    isMobile,
    handleCardTap,
    handleConfirm,
    resetSelection,
    selectCard,
  };
}
