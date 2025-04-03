import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserProfile from './components/UserProfileContainer';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/userProfile" element={<UserProfile />} />
      {/* Other routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
    </Routes>
  );
};

export default AppRoutes;
