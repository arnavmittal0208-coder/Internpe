import React, { createContext, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'internpe_auth_token';
const USER_KEY = 'internpe_auth_user';

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => safeJsonParse(sessionStorage.getItem(USER_KEY)));
  const [loading, setLoading] = useState(true);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken || '');
    setUser(nextUser || null);

    if (nextToken) {
      sessionStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }

    if (nextUser) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      sessionStorage.removeItem(USER_KEY);
    }
  };

  const fetchMe = async (currentToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Session expired');
    }

    const payload = await response.json();
    return payload.user;
  };

  useEffect(() => {
    const hydrateAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await fetchMe(token);
        setUser(currentUser);
        sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      } catch {
        persistSession('', null);
      } finally {
        setLoading(false);
      }
    };

    hydrateAuth();
  }, []);

  const login = async ({ email, password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Login failed');
    }

    persistSession(payload.token, payload.user);
    return payload.user;
  };

  const register = async ({ name, email, password, role }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'Registration failed');
    }

    persistSession(payload.token, payload.user);
    return payload.user;
  };

  const logout = async () => {
    persistSession('', null);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {
      // logout is local-first; server response is optional
    }
  };

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'Admin',
    isStudent: user?.role === 'Student',
    login,
    register,
    logout
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};