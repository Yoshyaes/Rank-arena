import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check WordPress login status via REST API
      const res = await fetch('/wp-json/rank-arena/v1/me', {
        credentials: 'same-origin', // Send WordPress cookies
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
      // WordPress API not available — continue as guest
    } finally {
      setLoading(false);
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
