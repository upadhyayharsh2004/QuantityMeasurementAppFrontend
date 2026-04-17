import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Restore session on mount
  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem('qm_token');
      const savedUser  = sessionStorage.getItem('qm_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      sessionStorage.removeItem('qm_token');
      sessionStorage.removeItem('qm_user');
    }
  }, []);

  const login = (userData, authToken) => {
    setToken(authToken);
    setUser(userData);
    try {
      sessionStorage.setItem('qm_token', authToken);
      sessionStorage.setItem('qm_user', JSON.stringify(userData));
    } catch {}
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      sessionStorage.removeItem('qm_token');
      sessionStorage.removeItem('qm_user');
    } catch {}
  };

  const isLoggedIn = !!token;

  const displayName = user
    ? (user.PersonName || user.personName || user.PersonEmail || user.personEmail || 'User')
    : '';

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, displayName, initials, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
