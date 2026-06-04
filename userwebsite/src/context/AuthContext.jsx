import { createContext, useContext, useState, useCallback } from 'react';
import { getAuthSession, setAuthSession } from '../api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getAuthSession());

  const login = useCallback((data) => {
    setAuthSession(data);
    setSessionState(data);
  }, []);

  const logout = useCallback(() => {
    setAuthSession(null);
    setSessionState(null);
  }, []);

  const updateBusiness = useCallback((biz) => {
    setSessionState(prev => {
      if (!prev) return prev;
      const next = { ...prev, business: biz };
      setAuthSession(next);
      return next;
    });
  }, []);

  const user     = session?.user     || null;
  const business = session?.business || null;
  const isLoggedIn = !!user;

  return (
    <AuthCtx.Provider value={{ user, business, isLoggedIn, login, logout, updateBusiness }}>
      {children}
    </AuthCtx.Provider>
  );
}
