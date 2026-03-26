import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMobileConfirm from './useMobileConfirm';

describe('useMobileConfirm', () => {
  let makeChoice;

  beforeEach(() => {
    makeChoice = vi.fn();
    // Default to desktop
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
  });

  it('should call makeChoice directly on desktop', () => {
    const { result } = renderHook(() => useMobileConfirm(makeChoice));

    act(() => {
      result.current.handleCardTap('a');
    });

    expect(makeChoice).toHaveBeenCalledWith('a');
    expect(result.current.selectedCard).toBeNull();
  });

  it('should select card on mobile tap without calling makeChoice', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    const { result } = renderHook(() => useMobileConfirm(makeChoice));

    // Trigger resize check
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      result.current.handleCardTap('a');
    });

    expect(makeChoice).not.toHaveBeenCalled();
    expect(result.current.selectedCard).toBe('a');
  });

  it('should call makeChoice on confirm and keep selection until reset', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    const { result } = renderHook(() => useMobileConfirm(makeChoice));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      result.current.handleCardTap('b');
    });

    act(() => {
      result.current.handleConfirm();
    });

    expect(makeChoice).toHaveBeenCalledWith('b');
    // Selection should persist until resetSelection is called
    expect(result.current.selectedCard).toBe('b');
  });

  it('should clear selection on resetSelection', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    const { result } = renderHook(() => useMobileConfirm(makeChoice));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      result.current.handleCardTap('a');
    });

    expect(result.current.selectedCard).toBe('a');

    act(() => {
      result.current.resetSelection();
    });

    expect(result.current.selectedCard).toBeNull();
  });

  it('should not call makeChoice on confirm without selection', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    const { result } = renderHook(() => useMobileConfirm(makeChoice));

    act(() => {
      result.current.handleConfirm();
    });

    expect(makeChoice).not.toHaveBeenCalled();
  });

  it('should allow switching selected card on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    const { result } = renderHook(() => useMobileConfirm(makeChoice));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      result.current.handleCardTap('a');
    });
    expect(result.current.selectedCard).toBe('a');

    act(() => {
      result.current.handleCardTap('b');
    });
    expect(result.current.selectedCard).toBe('b');
  });
});
