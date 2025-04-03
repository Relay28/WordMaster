import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserProfile from './components/UserProfileContainer';
import Login from './components/Login';
import Register from './components/Register';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/userProfile" element={<UserProfile />} />
      {/* Other routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
};

export default AppRoutes;
