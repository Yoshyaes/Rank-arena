import { describe, it, expect, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import ActionButtons from './ActionButtons';

const noop = () => {};

// Note: avoid the word for the RTL render-root property in this file. Tailwind
// scans tests too and would emit an unscoped utility of that name.
function pinnedBar() {
  return Array.from(document.body.querySelectorAll('div')).find((d) => d.style.position === 'fixed');
}

describe('ActionButtons pinned Confirm bar (0.6)', () => {
  afterEach(() => {
    document.querySelectorAll('#adhesion_mobile_wrapper').forEach((n) => n.remove());
  });

  it('respects --ra-bottom-offset and floors at the measured ad clearance', async () => {
    render(
      <ActionButtons onHigher={noop} onLower={noop} selectedCard="a" onConfirm={noop} />
    );
    const bar = pinnedBar();
    expect(bar.getAttribute('style')).toContain('var(--ra-bottom-offset, 64px)');
    expect(bar.getAttribute('style')).toContain('var(--ra-ad-clearance, 0px)');
    expect(bar.style.getPropertyValue('--ra-ad-clearance')).toBe('0px');

    // Mediavine injects the adhesion wrapper after load: 50px ad lifted to bottom:64px.
    await act(async () => {
      const ad = document.createElement('div');
      ad.id = 'adhesion_mobile_wrapper';
      ad.getBoundingClientRect = () => ({
        top: window.innerHeight - 114, bottom: window.innerHeight - 64,
        height: 50, width: 320, left: 0, right: 320,
      });
      document.body.appendChild(ad);
      // MutationObserver -> rAF -> measure
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(bar.style.getPropertyValue('--ra-ad-clearance')).toBe('114px');
  });
});
