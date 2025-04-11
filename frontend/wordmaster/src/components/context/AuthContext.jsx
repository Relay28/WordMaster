// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Install with: npm install jwt-decode

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.token) {
          // Verify token expiration
          const decoded = jwtDecode(parsedAuth.token);
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            setUser(parsedAuth);
          }
        }
      } catch (err) {
        console.error('Failed to parse auth data', err);
        logout();
      }
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem('adminAuth', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setUser(null);
    navigate('/admin/login');
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser: user, 
      isAdmin: isAdmin(), 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}