import { useState, useEffect } from 'react';

const STREAK_KEY = 'rankArena_streak';

export default function useStreak() {
  const [streak, setStreak] = useState(() => {
    try {
      const stored = localStorage.getItem(STREAK_KEY);
      return stored ? JSON.parse(stored) : { current: 0, longest: 0, lastPlayed: null };
    } catch {
      return { current: 0, longest: 0, lastPlayed: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  }, [streak]);

  function recordPlay(dateStr) {
    setStreak(prev => {
      const lastPlayed = prev.lastPlayed;
      if (lastPlayed === dateStr) return prev; // Already played today

      const last = lastPlayed ? new Date(lastPlayed + 'T00:00:00Z') : null;
      const today = new Date(dateStr + 'T00:00:00Z');
      const dayDiff = last ? Math.floor((today - last) / 86400000) : -1;

      let newCurrent;
      if (dayDiff === 1) {
        newCurrent = prev.current + 1;
      } else {
        newCurrent = 1;
      }

      return {
        current: newCurrent,
        longest: Math.max(newCurrent, prev.longest),
        lastPlayed: dateStr,
      };
    });
  }

  return { streak, recordPlay };
}
