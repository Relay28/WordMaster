import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedTeacherRoute = () => {
  const { user, authChecked } = useUserAuth();

  if (!authChecked) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const isTeacher = user && (user.role === 'USER_TEACHER' || user.authorities?.some(auth => auth === 'USER_TEACHER'));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isTeacher) {
    return <Navigate to="/homepage" replace />;
  }

  return <Outlet />;
};

export default ProtectedTeacherRoute;
