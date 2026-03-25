import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to target value with ease-out cubic.
 * Returns the formatted display string based on stat category.
 */
export default function useCounter(targetValue, { duration = 600, shouldAnimate = false, statCategory = 'metacritic' } = {}) {
  const [currentValue, setCurrentValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (targetValue == null) {
      setCurrentValue(0);
      return;
    }

    if (!shouldAnimate) {
      setCurrentValue(targetValue);
      return;
    }

    setCurrentValue(0);
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * targetValue;
      setCurrentValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, duration, shouldAnimate]);

  return formatStat(currentValue, statCategory, targetValue != null && currentValue === targetValue);
}

function formatStat(value, statCategory, isFinal) {
  if (value == null) return '?';

  switch (statCategory) {
    case 'metacritic':
      return `${Math.round(value)} / 100`;
    case 'sales_millions':
      if (isFinal) {
        return `${value.toFixed(1)}M units`;
      }
      return `${value.toFixed(1)}M units`;
    case 'peak_players':
      return Math.round(value).toLocaleString();
    case 'avg_playtime_hours':
      return `${Math.round(value)}h avg`;
    case 'user_score':
      return `${value.toFixed(1)} / 10`;
    default:
      return Math.round(value).toLocaleString();
  }
}

export { formatStat };
