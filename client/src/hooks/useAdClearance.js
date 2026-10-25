import { useEffect, useState } from 'react';

// Fixed-bottom ad wrappers the TAG theme can render on mobile. Mediavine's
// adhesion unit is lifted to bottom:64px by the theme (mobile-polish.css) so
// it clears the tab bar, which is exactly where our pinned Confirm bar sits.
export const BOTTOM_AD_SELECTORS = ['#adhesion_mobile_wrapper', '#fixed_container_bottom'];

function isVisible(el) {
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || (cs.opacity !== '' && Number(cs.opacity) === 0)) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/**
 * Distance in px from the bottom of the viewport to the top of the highest
 * visible bottom-anchored ad wrapper (0 when none is showing). The pinned
 * Confirm bar uses this as a floor for its `bottom` so it is never under an ad.
 *
 * Ads inject late and resize (and the theme slides the adhesion between
 * bottom:64px and 0 when the tab bar hides), so this re-measures on DOM
 * insertions, size changes, style/class changes and transitions, throttled
 * to one measurement per animation frame.
 */
export function measureAdClearance(doc = document, viewportHeight = window.innerHeight) {
  let clearance = 0;
  for (const sel of BOTTOM_AD_SELECTORS) {
    const el = doc.querySelector(sel);
    if (!el || !isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    // Only count it if it actually overlaps the viewport.
    if (r.top >= viewportHeight || r.bottom <= 0) continue;
    clearance = Math.max(clearance, viewportHeight - r.top);
  }
  return Math.max(0, Math.ceil(clearance));
}

export default function useAdClearance() {
  const [clearance, setClearance] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    let frame = 0;
    let settleTimer = 0;
    const watched = new Set();

    const measure = () => {
      frame = 0;
      setClearance(measureAdClearance());
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    // The theme animates `bottom` over 200ms; measure again once it settles.
    const scheduleSettled = () => {
      schedule();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(schedule, 260);
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    const attrMo = new MutationObserver(scheduleSettled);

    // Returns true when an ad wrapper appeared or disappeared.
    const watchAds = () => {
      let changed = false;
      for (const sel of BOTTOM_AD_SELECTORS) {
        const el = document.querySelector(sel);
        if (!el || watched.has(el)) continue;
        watched.add(el);
        changed = true;
        if (ro) ro.observe(el);
        attrMo.observe(el, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
        el.addEventListener('transitionend', schedule);
      }
      // Drop elements Mediavine removed so we don't hold them.
      for (const el of watched) {
        if (!el.isConnected) {
          if (ro) ro.unobserve(el);
          el.removeEventListener('transitionend', schedule);
          watched.delete(el);
          changed = true;
        }
      }
      return changed;
    };

    // Ads are injected after load: watch for wrappers being added/removed.
    let scanFrame = 0;
    const domMo = new MutationObserver(() => {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0;
        if (watchAds()) schedule();
      });
    });
    domMo.observe(document.body, { childList: true, subtree: true });
    // body.tag-bar-hidden moves the adhesion between bottom:64px and 0.
    attrMo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', schedule);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);

    watchAds();
    measure();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
      window.clearTimeout(settleTimer);
      domMo.disconnect();
      attrMo.disconnect();
      if (ro) ro.disconnect();
      for (const el of watched) el.removeEventListener('transitionend', schedule);
      watched.clear();
      window.removeEventListener('resize', schedule);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', schedule);
    };
  }, []);

  return clearance;
}
