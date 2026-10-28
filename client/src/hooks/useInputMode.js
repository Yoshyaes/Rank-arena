import { useEffect, useState } from 'react';
import { inputMode, onInputMode } from '../lib/touchKit';

/**
 * The input the player is actually using ('touch' | 'mouse' | 'keyboard'),
 * so copy can say "tap" or "click" correctly. Follows the Touch Kit's
 * inputmodechange event; without the kit it also listens for the first
 * pointerdown so a touch laptop still flips to touch copy.
 */
export default function useInputMode() {
  const [mode, setMode] = useState(inputMode);

  useEffect(() => {
    const off = onInputMode((d) => setMode(d.mode));
    function onPointer(e) {
      setMode(e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse');
    }
    function onKey(e) {
      if (!/^(Shift|Control|Alt|Meta|CapsLock|Unidentified)$/.test(e.key || '')) setMode('keyboard');
    }
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      off();
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, []);

  return mode;
}
