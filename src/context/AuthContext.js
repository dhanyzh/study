'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (t) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(t);
      } else {
        localStorage.removeItem('studyos_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load token from sessionStorage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedToken = sessionStorage.getItem('studyos_token');
      if (savedToken) {
        if (!cancelled) await fetchUser(savedToken);
      } else {
        // Ensure state updates happen after an await (keeps react-hooks/set-state-in-effect happy).
        await Promise.resolve();
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUser]);

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      sessionStorage.setItem('studyos_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  }, []);

  const signup = useCallback(async (username, password, displayName) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName }),
    });
    const data = await res.json();
    if (res.ok) {
      sessionStorage.setItem('studyos_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('studyos_token');
    // Also remove from localStorage in case it was set previously
    localStorage.removeItem('studyos_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
