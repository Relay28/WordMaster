// src/context/UserAuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserAuthContext = createContext();

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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
    setAuthChecked(true);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
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
      setUser,
      authChecked,
      login,
      logout,
      getToken,
      isTeacher,
      isStudent
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