// Phase 3 (ARCADE-TOUCH-CONTROLS.md, Rank Arena): press/pop juice, the
// first-visit coach and telemetry, each feature-detected against the kit.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, renderHook, act } from '@testing-library/react';
import GameCard from '../components/GameCard';
import useFirstVisitCoach from './useFirstVisitCoach';
import { COUNT_UP_MS } from './useRevealHaptics';
import { juicePress, juicePop, trackSuccess, trackRoundComplete, startCoach, COACH_KEY } from '../lib/touchKit';

const game = { id: 1, title: 'Hades', year: 2020, genre: ['Roguelike'] };

function kit11({ seen = false } = {}) {
  const calls = { press: [], pop: [], success: [], round: [], coach: [], finish: 0, stop: 0 };
  const handle = { active: true, finish() { calls.finish++; this.active = false; }, stop() { calls.stop++; this.active = false; } };
  window.tagArcade = {
    touchKit: '1.1.0', haptic: () => true, inputMode: 'touch', reducedMotion: false,
    juice: { press: (n, o) => { calls.press.push([n, o]); return true; }, pop: (n, o) => { calls.pop.push([n, o]); return true; } },
    success: (l) => { calls.success.push(l); return true; },
    roundComplete: (p) => { calls.round.push(p); return true; },
    coach: Object.assign((o) => { calls.coach.push(o); return handle; }, { seen: () => seen }),
  };
  return calls;
}

afterEach(() => { delete window.tagArcade; vi.useRealTimers(); });

describe('bridge feature detection', () => {
  it('no-ops on kit 1.0.0 and without a kit', () => {
    const n = document.createElement('div');
    for (const ta of [undefined, { touchKit: '1.0.0', haptic: () => true }]) {
      window.tagArcade = ta;
      expect(juicePress(n)).toBe(false);
      expect(juicePop(n)).toBe(false);
      expect(trackSuccess('x')).toBe(false);
      expect(trackRoundComplete({})).toBe(false);
      expect(startCoach({ key: COACH_KEY, steps: [{}] })).toBe(null);
    }
  });
  it('kit errors are swallowed', () => {
    window.tagArcade = { touchKit: '1.1.0', haptic: () => true, success() { throw new Error('x'); } };
    expect(trackSuccess('x')).toBe(false);
  });
});

describe('GameCard juice', () => {
  it('a finger press squashes the card with a tick; a mouse press does not', () => {
    const calls = kit11();
    const { getByRole } = render(<GameCard game={game} statCategory="metacritic" statLabel="M" onClick={() => {}} swipeToVote onSwipeVote={() => {}} />);
    const card = getByRole('button');
    fireEvent.pointerDown(card, { pointerId: 1, pointerType: 'touch', clientX: 1, clientY: 1 });
    expect(calls.press.length).toBe(1);
    expect(calls.press[0]).toEqual([card, { haptic: 'tick' }]);
    fireEvent.pointerUp(card, { pointerId: 1, pointerType: 'touch', clientX: 1, clientY: 1 });
    fireEvent.pointerDown(card, { pointerId: 2, pointerType: 'mouse', clientX: 1, clientY: 1 });
    expect(calls.press.length).toBe(1);
  });
  it('the correct card pops as the count-up lands, without a second haptic', () => {
    vi.useFakeTimers();
    const calls = kit11();
    const { getByRole } = render(<GameCard game={game} statCategory="metacritic" statLabel="M" statValue={90} cardState="correct" isRevealing />);
    act(() => { vi.advanceTimersByTime(COUNT_UP_MS - 1); });
    expect(calls.pop.length).toBe(0);
    act(() => { vi.advanceTimersByTime(2); });
    expect(calls.pop.length).toBe(1);
    expect(calls.pop[0]).toEqual([getByRole('button'), { haptic: false }]);
  });
});

describe('first-visit coach', () => {
  it('starts once when a vote is open by touch, and any vote finishes it', () => {
    const calls = kit11();
    const ref = { current: document.createElement('button') };
    const { rerender } = renderHook((p) => useFirstVisitCoach(ref, p), { initialProps: { ready: false, voted: false } });
    expect(calls.coach.length).toBe(0);
    rerender({ ready: true, voted: false });
    rerender({ ready: true, voted: false });
    expect(calls.coach.length).toBe(1);
    expect(calls.coach[0].key).toBe('rank-arena-v1');
    expect(calls.coach[0].steps[0]).toMatchObject({ gesture: 'swipe', dir: 'up', target: ref.current });
    rerender({ ready: false, voted: true });
    expect(calls.finish).toBe(1);
    rerender({ ready: true, voted: false });
    expect(calls.coach.length).toBe(1);
  });
  it('is skipped once seen, and stopped (not saved) on unmount', () => {
    let calls = kit11({ seen: true });
    const ref = { current: document.createElement('button') };
    renderHook(() => useFirstVisitCoach(ref, { ready: true, voted: false }));
    expect(calls.coach.length).toBe(0);
    calls = kit11();
    const { unmount } = renderHook(() => useFirstVisitCoach(ref, { ready: true, voted: false }));
    unmount();
    expect(calls.stop).toBe(1);
    expect(calls.finish).toBe(0);
  });
});
