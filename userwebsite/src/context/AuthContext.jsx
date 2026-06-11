import { createContext, useContext, useState, useCallback } from 'react';
import { getMemberSession, setMemberSession, getAuthSession, setAuthSession } from '../api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  // Member session (new signup flow)
  const [memberSession, setMemberState] = useState(() => getMemberSession());

  // Legacy web-auth session (kept for backwards compat with existing users)
  const [legacySession, setLegacyState] = useState(() => getAuthSession());

  /* ── Member auth ── */
  const memberLogin = useCallback((data) => {
    setMemberSession(data);
    setMemberState(data);
  }, []);

  const memberLogout = useCallback(() => {
    setMemberSession(null);
    setMemberState(null);
  }, []);

  const updateMemberBusiness = useCallback((biz) => {
    setMemberState(prev => {
      if (!prev) return prev;
      const next = { ...prev, business: biz };
      setMemberSession(next);
      return next;
    });
  }, []);

  /* ── Legacy web-auth ── */
  const login = useCallback((data) => {
    // Support both { user, business } and { member, business } shapes
    setAuthSession(data);
    setLegacyState(data);
  }, []);

  const logout = useCallback(() => {
    setAuthSession(null);
    setLegacyState(null);
    // Also logout member session
    setMemberSession(null);
    setMemberState(null);
  }, []);

  const updateBusiness = useCallback((biz) => {
    setLegacyState(prev => {
      if (!prev) return prev;
      const next = { ...prev, business: biz };
      setAuthSession(next);
      return next;
    });
  }, []);

  /* ── Derived values ── */
  // Prefer member session, fallback to legacy
  const activeMember = memberSession?.member || null;
  const activeUser   = legacySession?.user   || null;

  // Unified "user" for components that just need name/phone
  const user = activeMember || activeUser;

  // Business from whichever session is active
  const business = memberSession?.business || legacySession?.business || null;

  const isLoggedIn = !!(activeMember || activeUser);
  const isMember   = !!activeMember;

  return (
    <AuthCtx.Provider value={{
      // New member auth
      member: activeMember,
      memberLogin,
      memberLogout,
      updateMemberBusiness,
      isMember,

      // Legacy web-auth (kept for AddBusiness, MyBusiness etc.)
      user: activeUser || activeMember,  // unified — member data also accessible as user
      business,
      isLoggedIn,
      login,
      logout,
      updateBusiness,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
