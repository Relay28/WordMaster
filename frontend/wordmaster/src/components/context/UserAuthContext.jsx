// src/context/UserAuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Function to refresh user data from localStorage
  const refreshUserFromStorage = () => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(JSON.parse(userData));
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error("Invalid token", err);
        clearAuth();
      }
    }
  };

  useEffect(() => {
    refreshUserFromStorage();
    setAuthChecked(true);
    
    // Listen for storage events to keep user data in sync
    const handleStorageChange = (e) => {
      if (e.key === 'userData' || e.key === null) {
        refreshUserFromStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  // Enhanced setUser function that also updates localStorage
  const updateUser = (userData) => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
      // Trigger a storage event to notify other components
      window.dispatchEvent(new Event('storage'));
    }
    setUser(userData);
  };

  const getToken = () => {
    return localStorage.getItem('userToken');
  };

  const clearAuth = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  const isTeacher = () => user?.role === 'USER_TEACHER';
  const isStudent = () => user?.role === 'USER_STUDENT';

  return (
    <UserAuthContext.Provider value={{ 
      user,
      setUser: updateUser,
      authChecked,
      login,
      logout,
      getToken,
      isTeacher,
      isStudent,
      refreshUserFromStorage
    }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) throw new Error('useUserAuth must be used within UserAuthProvider');
  return context;
};