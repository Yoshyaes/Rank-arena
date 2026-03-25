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
      // Check WordPress login via direct PHP file (avoids REST API nonce requirement)
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

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
