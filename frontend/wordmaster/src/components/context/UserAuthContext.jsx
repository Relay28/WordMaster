// src/context/UserAuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserAuthContext = createContext();

// Helper: extract roles/authorities from a decoded JWT in a robust way
function extractRolesFromDecoded(decoded) {
  if (!decoded) return [];
  // common claim locations: role, roles, authorities, scope/scopes
  const tryVals = [];
  if (decoded.authorities) tryVals.push(decoded.authorities);
  if (decoded.roles) tryVals.push(decoded.roles);
  if (decoded.role) tryVals.push(decoded.role);
  if (decoded.scopes) tryVals.push(decoded.scopes);
  if (decoded.scope) tryVals.push(decoded.scope);

  for (const v of tryVals) {
    if (!v) continue;
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') {
      // could be space or comma separated
      return v.split(/[ ,]/).map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

// Helper: sanitize user object coming from storage so it can't override auth-critical fields
function buildSafeUserFromStorage(rawUser, decodedToken) {
  const roles = extractRolesFromDecoded(decodedToken);
  const primaryRole = roles.find(r => r) || rawUser?.role; // fallback for display if token lacks explicit role

  const { role: _ignoredRole, authorities: _ignoredAuth, ...rest } = rawUser || {};

  return {
    ...rest,
    // Always derive these from token to avoid tampering
    role: primaryRole,
    authorities: roles,
  };
}

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('userToken');

  const clearAuth = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  // Function to refresh user data from localStorage but with token-derived roles
  const refreshUserFromStorage = () => {
    const token = getToken();
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      clearAuth();
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!decoded || decoded.exp * 1000 <= Date.now()) {
        clearAuth();
        return;
      }

      const parsedUser = JSON.parse(userData);
      const safeUser = buildSafeUserFromStorage(parsedUser, decoded);
      setUser(safeUser);
    } catch (err) {
      console.error('Invalid token or userData in storage', err);
      clearAuth();
    }
  };

  useEffect(() => {
    refreshUserFromStorage();
    setAuthChecked(true);

    // Listen for storage changes to keep state in sync across tabs and sanitize on write
    const handleStorageChange = (e) => {
      if (e.key === 'userData' || e.key === 'userToken' || e.key === null) {
        refreshUserFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData, token) => {
    // Persist token and non-sensitive user data
    localStorage.setItem('userToken', token);
    // Strip any auth-critical fields before storing
    const { role: _ignoredRole, authorities: _ignoredAuth, ...rest } = userData || {};
    localStorage.setItem('userData', JSON.stringify(rest));

    // Build safe user for state
    try {
      const decoded = jwtDecode(token);
      const safeUser = buildSafeUserFromStorage(rest, decoded);
      setUser(safeUser);
    } catch (e) {
      console.error('Failed to decode token during login', e);
      clearAuth();
    }
  };

  // Enhanced setUser that also updates localStorage safely (never stores role/authorities from caller)
  const updateUser = (nextUserData) => {
    // Allow null to sign out via this method
    if (!nextUserData) {
      clearAuth();
      return;
    }

    const token = getToken();
    if (!token) {
      // No token -> cannot trust updates; clear auth
      clearAuth();
      return;
    }

    // Remove privileged fields before persisting
    const { role: _ignoredRole, authorities: _ignoredAuth, ...rest } = nextUserData;
    localStorage.setItem('userData', JSON.stringify(rest));

    // Rebuild safe user from token claims
    try {
      const decoded = jwtDecode(token);
      const safeUser = buildSafeUserFromStorage(rest, decoded);
      setUser(safeUser);
      // Trigger a storage event to notify other components
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to decode token during updateUser', e);
      clearAuth();
    }
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  // Role helpers rely on token-derived user state
  const isTeacher = () => {
    const roles = user?.authorities || [];
    return roles.includes('USER_TEACHER') || user?.role === 'USER_TEACHER';
  };
  const isStudent = () => {
    const roles = user?.authorities || [];
    return roles.includes('USER_STUDENT') || user?.role === 'USER_STUDENT';
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        setUser: updateUser,
        authChecked,
        login,
        logout,
        getToken,
        isTeacher,
        isStudent,
        refreshUserFromStorage,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) throw new Error('useUserAuth must be used within UserAuthProvider');
  return context;
};