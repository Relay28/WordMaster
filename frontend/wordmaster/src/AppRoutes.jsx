import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserProfile from './components/UserProfileContainer';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';
import HomePage from './components/user/HomePage';
import OAuthSuccessHandler from './components/OAuthSuccessHandler';
import SetupPage from './components/user/SetupPage.';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      

      <Route path="/userProfile" element={<UserProfile />} />
      <Route path="/homepage" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<SetupPage/>} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth-success" element={<OAuthSuccessHandler />} />



      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
