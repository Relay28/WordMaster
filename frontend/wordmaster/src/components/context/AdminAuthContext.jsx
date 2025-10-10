// src/context/AuthContext.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

/**
 * Extracts role identifiers from a decoded token-like object.
 *
 * Checks the following fields, in order, and returns roles from the first populated value:
 * `authorities`, `roles`, `role`, `scopes`, `scope`.
 *
 * @param {object|null|undefined} decoded - Decoded token payload to extract roles from.
 * @returns {string[]} An array of role strings from the first populated field; empty array if no roles are found.
 */
function extractRolesFromDecoded(decoded) {
  if (!decoded) return [];
  const vals = [];
  if (decoded.authorities) vals.push(decoded.authorities);
  if (decoded.roles) vals.push(decoded.roles);
  if (decoded.role) vals.push(decoded.role);
  if (decoded.scopes) vals.push(decoded.scopes);
  if (decoded.scope) vals.push(decoded.scope);
  for (const v of vals) {
    if (!v) continue;
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') return v.split(/[ ,]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Construct a sanitized admin user object with resolved roles from a decoded token.
 * @param {Object|null|undefined} raw - Original user-like object; may contain caller-provided `role` or `authorities` that should be ignored in favor of token-derived values.
 * @param {Object|null|undefined} decoded - Decoded token payload used to extract roles/authorities.
 * @returns {Object} Sanitized user object where `role` is the primary resolved role and `authorities` is an array of roles. Caller-provided `role` and `authorities` from `raw` are omitted.
function buildSafeAdminUser(raw, decoded) {
  const roles = extractRolesFromDecoded(decoded);
  const primaryRole = roles.find(Boolean) || raw?.role;
  const { role: _r, authorities: _a, ...rest } = raw || {};
  return {
    ...rest,
    role: primaryRole,
    authorities: roles,
  };
}

/**
 * Provides authentication state and actions for admin users and makes them available via AuthContext.
 *
 * Manages a sanitized currentUser (including derived roles), persists minimal auth data (token plus non-sensitive fields) to localStorage, restores state on mount, synchronizes across browser tabs, and navigates to the admin login on logout. Exposes `currentUser`, `isAdmin`, `login`, and `logout` through context.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children - Child elements rendered inside the provider.
 * @returns {import('react').ReactElement} The AuthContext provider element wrapping children.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const getStored = () => localStorage.getItem('adminAuth');

  const restoreFromStorage = () => {
    const stored = getStored();
    if (!stored) {
      setUser(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      const token = parsed?.token;
      if (!token) {
        // No token -> cannot trust stored role
        logout();
        return;
      }
      const decoded = jwtDecode(token);
      if (!decoded || decoded.exp * 1000 <= Date.now()) {
        logout();
        return;
      }
      const safe = buildSafeAdminUser(parsed, decoded);
      setUser({ ...safe, token });
    } catch (e) {
      console.error('Failed to parse admin auth', e);
      logout();
    }
  };

  useEffect(() => {
    restoreFromStorage();
    // Keep in sync across tabs
    const onStorage = (e) => {
      if (e.key === 'adminAuth' || e.key === null) restoreFromStorage();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = (adminData) => {
    // Expect a token on adminData
    const token = adminData?.token;
    if (!token) {
      console.error('Admin login missing token');
      // Store nothing and force logout path
      logout();
      return;
    }
    // Persist minimal, ignore role/authorities fields from caller
    const { role: _r, authorities: _a, ...rest } = adminData || {};
    localStorage.setItem('adminAuth', JSON.stringify({ ...rest, token }));
    try {
      const decoded = jwtDecode(token);
      const safe = buildSafeAdminUser(rest, decoded);
      setUser({ ...safe, token });
    } catch (e) {
      console.error('Failed to decode admin token', e);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setUser(null);
    navigate('/admin/login');
  };

  const isAdmin = useMemo(() => {
    const roles = user?.authorities || [];
    return roles.includes('ADMIN') || user?.role === 'ADMIN';
  }, [user]);

  const value = {
    currentUser: user,
    isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Access the authentication context for the current React component tree.
 *
 * @returns {{ currentUser: Object|null, isAdmin: boolean, login: Function, logout: Function }} The authentication context value.
 * @throws {Error} If called outside of an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}