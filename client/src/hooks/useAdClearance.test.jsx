import { describe, it, expect, afterEach } from 'vitest';
import { measureAdClearance } from './useAdClearance';

function addAd(id, rect, style = {}) {
  const el = document.createElement('div');
  el.id = id;
  Object.assign(el.style, style);
  el.getBoundingClientRect = () => ({
    top: rect.top, bottom: rect.top + rect.height, height: rect.height,
    width: rect.width ?? 320, left: 0, right: rect.width ?? 320,
  });
  document.body.appendChild(el);
  return el;
}

describe('measureAdClearance', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('is 0 with no ad on the page', () => {
    expect(measureAdClearance(document, 800)).toBe(0);
  });

  it('clears an adhesion ad lifted to bottom:64px (50px tall)', () => {
    // viewport 800, ad occupies 686..736 -> its top is 114px above the bottom
    addAd('adhesion_mobile_wrapper', { top: 686, height: 50 });
    expect(measureAdClearance(document, 800)).toBe(114);
  });

  it('takes the highest of the two wrappers', () => {
    addAd('adhesion_mobile_wrapper', { top: 686, height: 50 });
    addAd('fixed_container_bottom', { top: 600, height: 136 });
    expect(measureAdClearance(document, 800)).toBe(200);
  });

  it('ignores hidden, empty or off-screen wrappers', () => {
    addAd('adhesion_mobile_wrapper', { top: 686, height: 50 }, { display: 'none' });
    addAd('fixed_container_bottom', { top: 686, height: 0 });
    expect(measureAdClearance(document, 800)).toBe(0);
    document.body.innerHTML = '';
    addAd('adhesion_mobile_wrapper', { top: 900, height: 50 });
    expect(measureAdClearance(document, 800)).toBe(0);
  });
});
