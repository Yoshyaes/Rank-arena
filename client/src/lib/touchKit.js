// Bridge to the shared TAG Arcade Touch Kit (TAG Wordpress Website,
// tag-arcade/_shared/touch-kit/). The theme enqueues it on every arcade game
// page as handle `tag-arcade-touch`, which fills in window.tagArcade.
// Plan: ARCADE-TOUCH-CONTROLS.md, Phase 2 (Rank Arena).
//
// The theme's arcade-shell.js also creates a bare window.tagArcade
// (registerPause/togglePause) without the kit, so `touchKit` (the kit's
// version string) is what marks the kit as really loaded. Every caller goes
// through kit() and treats null as "behave exactly as before the kit":
// local dev, vitest, and any page without the theme.

export function kit() {
  const t = typeof window !== 'undefined' ? window.tagArcade : null;
  return t && t.touchKit && typeof t.haptic === 'function' ? t : null;
}

function legacyVibrate(pattern) {
  if (pattern == null) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}

/**
 * tick | tap | heavy | success | fail through the kit (Android vibrate plus
 * the iOS switch haptic, honouring the shell's Haptics setting).
 * Without the kit, `fallback` (a navigator.vibrate pattern) keeps the
 * pre-kit behaviour; pass nothing for feedback that is new with the kit.
 */
export function haptic(kind, fallback) {
  const k = kit();
  if (!k) { legacyVibrate(fallback); return; }
  try { k.haptic(kind); } catch { /* feedback must never break input */ }
}

export function reducedMotion() {
  const k = kit();
  if (k) return !!k.reducedMotion;
  try {
    return typeof window !== 'undefined' && !!window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
}

/** 'touch' | 'mouse' | 'keyboard'. The kit tracks the last input used; without it, guess from the pointer. */
export function inputMode() {
  const k = kit();
  if (k && k.inputMode) return k.inputMode;
  try {
    return typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';
  } catch { return 'mouse'; }
}

/** Subscribe to input mode changes. Returns an unsubscribe function (a no-op without the kit). */
export function onInputMode(fn) {
  const k = kit();
  if (!k || typeof k.on !== 'function') return () => {};
  return k.on('inputmodechange', fn);
}

/**
 * Swallow the click that follows a touch pointerdown we already acted on
 * (e.g. the tap that skips the reveal wait), so it cannot land on whatever
 * the re-render put under the finger, like the next round's card.
 */
export function swallowNextClick(ms = 700) {
  if (typeof window === 'undefined') return;
  let t = 0;
  function stop(e) { e.stopPropagation(); e.preventDefault(); done(); }
  function done() {
    window.removeEventListener('click', stop, true);
    window.removeEventListener('pointerdown', done, true);
    clearTimeout(t);
  }
  window.addEventListener('click', stop, true);
  // A new touch means the old tap's click is never coming: stand down so the new tap counts.
  window.addEventListener('pointerdown', done, true);
  t = setTimeout(done, ms);
}
