import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfileContainer from './components/UserProfileContainer';
import Login from './components/Login';
import AppRoutes from "./AppRoutes"
import Register from './components/Register';
import { AuthProvider } from './components/context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
   <AppRoutes/>
   </AuthProvider>
  );
};

export default App;
