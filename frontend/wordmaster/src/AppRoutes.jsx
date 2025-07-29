import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useUserAuth } from './components/context/UserAuthContext';
import { isLoggedIn } from './utils/authUtils';
import { Box, CircularProgress, Typography } from '@mui/material';
import picbg from '../src/assets/picbg.png';
import '@fontsource/press-start-2p';
// Lazy load all components
const UserProfile = lazy(() => import('./Profile/UserProfileContainer'));
const Login = lazy(() => import('./components/Authentication/Login'));
const Register = lazy(() => import('./components/Authentication/Register'));
const OTPVerification = lazy(() => import('./components/Authentication/OTPVerification'));
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const HomePage = lazy(() => import('./components/Homepage/HomePage'));
const StudentHomePage = lazy(() => import('./components/Homepage/StudentHomePage'));
const OAuthSuccessHandler = lazy(() => import('./components/Authentication/OAuthSuccessHandler'));
const SetupPage = lazy(() => import('./components/user/SetupPage.'));
const ClassroomDetailsPage = lazy(() => import('./components/Classroom/Classroom Details Page'));
const GamePage = lazy(() => import('./components/gameplay/GamePage'));
const CreateGameSession = lazy(() => import('./components/gameplay/CreateGameSession'));
const GameCore = lazy(() => import('./components/gameplay/GameCore'));
const ContentDashboard = lazy(() => import('./components/content/ContentDashboard'));
const EditContent = lazy(() => import('./components/content/EditContent'));
const ContentDetails = lazy(() => import('./components/content/ContentDetails'));
const ContentUpload = lazy(() => import('./components/content/contentUpload/ContentUpload'));
const WaitingRoomPage = lazy(() => import('./components/WaitingRoom/WaitingRoomPage'));
const AIContentGenerator = lazy(() => import('./components/content/AIContentGenerator'));
const SessionProgressView = lazy(() => import('./components/gameplay/SessionProgressView'));
const TeacherContentSessions = lazy(() => import('./components/gameplay/SessionManager'));
const StudentReportPage = lazy(() => import('./components/Reports/StudentReportPage'));
const StudentFeedbackPage = lazy(() => import('./components/Reports/StudentFeedbackPage'));
const ProtectedAdminRoute = lazy(() => import('./components/auth/ProtectedAdminRoute'));
const ProtectedTeacherRoute = lazy(() => import('./components/auth/ProtectedTeacherRoute'));

// Loading component
const LoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: `
        linear-gradient(to bottom, 
          rgba(249, 249, 249, 0.95) 0%, 
          rgba(249, 249, 249, 0.95) 40%, 
          rgba(249, 249, 249, 0.8) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'pixelated',
    }}
  >
    <CircularProgress
      size={60}
      thickness={4}
      sx={{
        color: '#5F4B8B',
        mb: 2,
        filter: 'drop-shadow(0 4px 8px rgba(95, 75, 139, 0.3))',
      }}
    />
    <Typography
      sx={{
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#5F4B8B',
        textShadow: '2px 2px 4px rgba(95, 75, 139, 0.2)',
        letterSpacing: '2px',
      }}
    >
      LOADING...
    </Typography>
  </Box>
);

const ProtectedRoute = ({ children }) => {
  const { getToken, user } = useUserAuth();
  const navigate = useNavigate();
  const token = getToken();
  useEffect(() => {
  if (!token) {
  navigate('/login');
  }
  }, [token, navigate]);

  if (!token) {
    return <LoadingSpinner />;
  }

  return <Outlet />
};

// HomePageRouter component remains the same
function HomePageRouter() {
  const { isTeacher, isStudent, getToken, user } = useUserAuth();
  const token = getToken();
  if (!token) {
    return <LoadingSpinner />;
  }

  if (isTeacher()) {
    return <HomePage />;
  } else if (isStudent()) {
    return <StudentHomePage />;
  }
}

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth-success" element={<OAuthSuccessHandler />} />
        <Route path="/verify" element={<OTPVerification />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/homepage" element={<HomePageRouter />} />
          <Route path="/classroom/:classroomId" element={<ClassroomDetailsPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/content/ai-generate" element={<AIContentGenerator />} />
          <Route path="/student-report/:sessionId/:studentId" element={<StudentReportPage />} />
          <Route path="/student-feedback/:sessionId/:studentId" element={<StudentFeedbackPage />} />
          <Route path="/game/create" element={<CreateGameSession />} />
          <Route path="/game/:sessionId" element={<GameCore />} />
          <Route path="/waiting-room/:contentId" element={<WaitingRoomPage />} />
          <Route path="/results/:sessionId" element={<SessionProgressView />} />
          <Route path="/session/:contentId" element={<TeacherContentSessions />} />

          {/* Teacher Routes */}
          <Route element={<ProtectedTeacherRoute />}>
            <Route path="/content/upload" element={<ContentUpload />} />
            <Route path="/content/edit/:id" element={<EditContent />} />
            <Route path="/content/:id" element={<ContentDetails />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;