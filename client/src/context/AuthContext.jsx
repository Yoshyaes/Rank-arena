import { createContext, useContext, useState, useEffect } from 'react';
import { submitChallengeResult, submitEndlessResult } from '../lib/api';
import { getUnsyncedScores, clearUnsyncedScores } from '../hooks/useGame';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // When user is detected, sync any guest scores
  useEffect(() => {
    if (user) {
      syncUnsavedScores();
    }
  }, [user]);

  async function checkAuth() {
    try {
      const res = await fetch('/arena/auth-check.php', {
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logged_in) {
          setUser({
            id: data.id,
            username: data.username,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
          });
        }
      }
    } catch {
      // Auth check failed — continue as guest
    } finally {
      setLoading(false);
    }
  }

  async function syncUnsavedScores() {
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

    if (allSynced) {
      clearUnsyncedScores();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
