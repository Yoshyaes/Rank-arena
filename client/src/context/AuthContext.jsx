import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, submitChallengeResult, submitEndlessResult, VIEWER_ID } from '../lib/api';
import { getUnsyncedScores, clearUnsyncedScores } from '../hooks/useGame';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      // Fast path: WordPress shortcode injects user id; skip the network roundtrip.
      if (VIEWER_ID) {
        try {
          const data = await fetchMe();
          if (!cancelled && data?.logged_in) {
            setUser({
              id: data.id,
              username: data.username,
              displayName: data.display_name,
              avatarUrl: data.avatar_url,
            });
          }
        } catch { /* ignore - guest experience still works */ }
      } else {
        // Standalone dev: nothing to do, treat as guest.
      }
      if (!cancelled) setLoading(false);
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // When user is detected, sync any guest-mode scores recorded locally.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const unsynced = getUnsyncedScores();
      if (unsynced.length === 0) return;
      let allSynced = true;
      for (const entry of unsynced) {
        try {
          if (entry.type === 'daily') {
            const res = await submitChallengeResult(entry.data.date, entry.data.score);
            if (!res?.saved) allSynced = false;
          } else if (entry.type === 'endless') {
            const res = await submitEndlessResult(entry.data.score);
            if (!res?.saved) allSynced = false;
          }
        } catch {
          allSynced = false;
        }
      }
      if (allSynced) clearUnsyncedScores();
    })();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
