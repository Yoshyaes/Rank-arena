// Phase 2 touch behaviour (ARCADE-TOUCH-CONTROLS.md, Rank Arena):
// swipe a card up to vote, tap the selected card again to confirm,
// count-up haptic ticks ending on success/fail, touch-aware copy.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, renderHook, act } from '@testing-library/react';
import GameCard from '../components/GameCard';
import { barPrompt } from '../components/ActionButtons';
import useMobileConfirm from './useMobileConfirm';
import useRevealHaptics, { tickTimes, COUNT_UP_MS } from './useRevealHaptics';
import { swipeThreshold, SWIPE_MIN_PX } from './useSwipeVote';

const game = { id: 1, title: 'Hades', year: 2020, genre: ['Roguelike'] };

function pointer(el, type, opts) {
  fireEvent[type](el, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 300, button: 0, ...opts });
}

function renderCard(props = {}) {
  const onClick = vi.fn();
  const onSwipeVote = vi.fn();
  const utils = render(
    <GameCard game={game} statCategory="metacritic" statLabel="Metacritic" onClick={onClick}
      swipeToVote onSwipeVote={onSwipeVote} {...props} />
  );
  return { ...utils, card: utils.getByRole('button'), onClick, onSwipeVote };
}

describe('swipe a card up to vote', () => {
  it('threshold scales with the card but never drops below the minimum', () => {
    expect(swipeThreshold(0)).toBe(SWIPE_MIN_PX);
    expect(swipeThreshold(400)).toBe(88);
  });

  it('a touch drag past the line votes and the trailing click is swallowed', () => {
    const { card, onClick, onSwipeVote } = renderCard();
    pointer(card, 'pointerDown');
    pointer(card, 'pointerMove', { clientY: 280 });
    pointer(card, 'pointerMove', { clientY: 200 });
    expect(card.getAttribute('data-swipe')).toBe('armed');
    expect(card.textContent).toContain('Release to vote');
    pointer(card, 'pointerUp', { clientY: 200 });
    fireEvent.click(card);
    expect(onSwipeVote).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('dragging back below the line cancels the vote', () => {
    const { card, onSwipeVote, onClick } = renderCard();
    pointer(card, 'pointerDown');
    pointer(card, 'pointerMove', { clientY: 200 });
    pointer(card, 'pointerMove', { clientY: 280 });
    expect(card.getAttribute('data-swipe')).toBe('drag');
    pointer(card, 'pointerUp', { clientY: 280 });
    fireEvent.click(card);
    expect(onSwipeVote).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('a sideways drag is not a vote', () => {
    const { card, onSwipeVote } = renderCard();
    pointer(card, 'pointerDown');
    pointer(card, 'pointerMove', { clientX: 180, clientY: 290 });
    pointer(card, 'pointerMove', { clientX: 200, clientY: 200 });
    pointer(card, 'pointerUp', { clientX: 200, clientY: 200 });
    expect(onSwipeVote).not.toHaveBeenCalled();
  });

  it('pointercancel (the browser took the gesture) never votes', () => {
    const { card, onSwipeVote } = renderCard();
    pointer(card, 'pointerDown');
    pointer(card, 'pointerMove', { clientY: 150 });
    pointer(card, 'pointerCancel', { clientY: 150 });
    expect(onSwipeVote).not.toHaveBeenCalled();
  });

  it('mouse drags are ignored, so desktop clicks behave as before', () => {
    const { card, onSwipeVote, onClick } = renderCard();
    pointer(card, 'pointerDown', { pointerType: 'mouse' });
    pointer(card, 'pointerMove', { pointerType: 'mouse', clientY: 100 });
    pointer(card, 'pointerUp', { pointerType: 'mouse', clientY: 100 });
    fireEvent.click(card);
    expect(onSwipeVote).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(card.style.touchAction).toBe('none');
  });

  it('a plain tap is still a tap', () => {
    const { card, onClick, onSwipeVote } = renderCard();
    pointer(card, 'pointerDown');
    pointer(card, 'pointerUp');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSwipeVote).not.toHaveBeenCalled();
  });

  it('is off (and page scroll is left alone) when swipe is not enabled', () => {
    const { card, onSwipeVote } = renderCard({ swipeToVote: false });
    expect(card.style.touchAction).toBe('');
    pointer(card, 'pointerDown');
    pointer(card, 'pointerMove', { clientY: 100 });
    pointer(card, 'pointerUp', { clientY: 100 });
    expect(onSwipeVote).not.toHaveBeenCalled();
  });

  it('shows the selected-card hint', () => {
    const { card } = renderCard({ cardState: 'selected', selectedHint: 'Tap again to lock in' });
    expect(card.textContent).toContain('Tap again to lock in');
  });
});

describe('tap the selected card again to confirm (mobile)', () => {
  beforeEach(() => { Object.defineProperty(window, 'innerWidth', { value: 390, writable: true }); });

  it('first tap selects, second tap on the same card confirms', () => {
    const makeChoice = vi.fn();
    const { result } = renderHook(() => useMobileConfirm(makeChoice));
    act(() => { result.current.handleCardTap('a'); });
    expect(makeChoice).not.toHaveBeenCalled();
    act(() => { result.current.handleCardTap('a'); });
    expect(makeChoice).toHaveBeenCalledWith('a');
  });

  it('tapping the other card moves the selection without voting', () => {
    const makeChoice = vi.fn();
    const { result } = renderHook(() => useMobileConfirm(makeChoice));
    act(() => { result.current.handleCardTap('a'); });
    act(() => { result.current.handleCardTap('b'); });
    expect(makeChoice).not.toHaveBeenCalled();
    expect(result.current.selectedCard).toBe('b');
  });

  it('a selection from the last round can never turn the next round first tap into a vote', () => {
    const makeChoice = vi.fn();
    const { result, rerender } = renderHook(({ r }) => useMobileConfirm(makeChoice, r), { initialProps: { r: 0 } });
    act(() => { result.current.voteNow('a'); });
    expect(makeChoice).toHaveBeenCalledTimes(1);
    rerender({ r: 1 });
    expect(result.current.selectedCard).toBeNull();
    act(() => { result.current.handleCardTap('a'); });
    expect(makeChoice).toHaveBeenCalledTimes(1);
    expect(result.current.selectedCard).toBe('a');
  });

  it('touch input is two-step at any width (landscape phone, tablet); mouse at 640px+ is not', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const makeChoice = vi.fn();
    const { result, rerender } = renderHook(({ touch }) => useMobileConfirm(makeChoice, 0, { touch }), { initialProps: { touch: true } });
    act(() => { result.current.handleCardTap('b'); });
    expect(makeChoice).not.toHaveBeenCalled();
    act(() => { result.current.handleCardTap('b'); });
    expect(makeChoice).toHaveBeenCalledTimes(1);
    rerender({ touch: false });
    act(() => { result.current.handleCardTap('a'); });
    expect(makeChoice).toHaveBeenCalledTimes(2);
  });

  it('voteNow selects and submits in one go', () => {
    const makeChoice = vi.fn();
    const { result } = renderHook(() => useMobileConfirm(makeChoice));
    act(() => { result.current.voteNow('b'); });
    expect(makeChoice).toHaveBeenCalledWith('b');
    expect(result.current.selectedCard).toBe('b');
  });
});

describe('stat reveal haptics', () => {
  let calls;
  beforeEach(() => {
    vi.useFakeTimers();
    calls = [];
    window.tagArcade = { touchKit: '1.0.0', haptic: (k) => calls.push(k), reducedMotion: false };
  });
  afterEach(() => { vi.useRealTimers(); delete window.tagArcade; });

  it('ticks follow the ease-out count-up and stay 55ms+ apart', () => {
    const t = tickTimes();
    expect(t.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < t.length; i++) expect(t[i] - t[i - 1]).toBeGreaterThanOrEqual(55);
    expect(t[t.length - 1]).toBeLessThan(COUNT_UP_MS);
  });

  it('ticks then success when right', () => {
    renderHook(() => useRevealHaptics(true, true, 0));
    act(() => { vi.advanceTimersByTime(COUNT_UP_MS + 10); });
    expect(calls[calls.length - 1]).toBe('success');
    expect(calls.filter((k) => k === 'tick').length).toBe(tickTimes().length);
  });

  it('ends on fail when wrong, and fires once per reveal', () => {
    const { rerender } = renderHook(({ on }) => useRevealHaptics(on, false, 3), { initialProps: { on: true } });
    act(() => { vi.advanceTimersByTime(COUNT_UP_MS + 10); });
    rerender({ on: true });
    act(() => { vi.advanceTimersByTime(COUNT_UP_MS + 10); });
    expect(calls.filter((k) => k === 'fail').length).toBe(1);
  });

  it('reduced motion: no ticks, result haptic at once', () => {
    window.tagArcade.reducedMotion = true;
    renderHook(() => useRevealHaptics(true, true, 0));
    act(() => { vi.advanceTimersByTime(1); });
    expect(calls).toEqual(['success']);
  });

  it('does nothing without the kit', () => {
    delete window.tagArcade;
    const vib = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vib, configurable: true });
    renderHook(() => useRevealHaptics(true, true, 0));
    act(() => { vi.advanceTimersByTime(COUNT_UP_MS + 10); });
    expect(vib).not.toHaveBeenCalled();
  });
});

describe('touch-aware copy', () => {
  it('says swipe/tap on touch, click on mouse, keys on keyboard', () => {
    expect(barPrompt('touch', false)).toMatch(/Swipe a card up/);
    expect(barPrompt('touch', true)).toMatch(/tap the card again/);
    expect(barPrompt('mouse', false)).toMatch(/Click/);
    expect(barPrompt('keyboard', false)).toMatch(/Enter/);
    for (const m of ['touch', 'mouse']) expect(barPrompt(m, false)).not.toMatch(/Enter|Space|key/i);
  });
});
