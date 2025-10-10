// src/context/AuthContext.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}