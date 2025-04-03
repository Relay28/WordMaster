import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfileContainer from './components/UserProfileContainer';
import Login from './components/Login';
import AppRoutes from "./AppRoutes"
import Register from './components/Register';
import { AuthProvider } from './components/context/AdminAuthContext';
import { UserAuthProvider } from './components/context/UserAuthContext';

const App = () => {
  return (
    <UserAuthProvider>
     <AuthProvider> 
   <AppRoutes/>
   </AuthProvider>
   </UserAuthProvider>
  );
};

export default App;
