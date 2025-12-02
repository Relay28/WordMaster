import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useUserAuth } from './components/context/UserAuthContext';
import { isLoggedIn } from './utils/authUtils';
import LoadingSpinner from './components/utils/LoadingSpinner';

// Lazy load all components
const UserProfile = lazy(() => import('./Profile/UserProfileContainer'));
const Login = lazy(() => import('./components/Authentication/Login'));
const Register = lazy(() => import('./components/Authentication/Register'));
const OTPVerification = lazy(() => import('./components/Authentication/OTPVerification'));
const ForgotPassword = lazy(() => import('./components/Authentication/ForgotPassword'));
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
const EditContent = lazy(() => import('./components/content/EditContent'));
const ContentDetails = lazy(() => import('./components/content/ContentDetails'));
const ContentUpload = lazy(() => import('./components/content/contentUpload/ContentUpload'));
const WaitingRoomPage = lazy(() => import('./components/WaitingRoom/WaitingRoomPage'));
const AIContentGenerator = lazy(() => import('./components/content/AiContentGenerator'));
const SessionProgressView = lazy(() => import('./components/gameplay/SessionProgressView'));
const TeacherContentSessions = lazy(() => import('./components/gameplay/SessionManager'));
const StudentReportPage = lazy(() => import('./components/Reports/StudentReportPage'));
const StudentFeedbackPage = lazy(() => import('./components/Reports/StudentFeedbackPage'));
const ProtectedAdminRoute = lazy(() => import('./components/auth/ProtectedAdminRoute'));
const ProtectedTeacherRoute = lazy(() => import('./components/auth/ProtectedTeacherRoute'));
const ChartFeedbackDemo = lazy(() => import('./components/gameplay/ChartFeedbackDemo'));

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

// HomePageRouter component - handles routing based on user role
function HomePageRouter() {
  const { isTeacher, isStudent, getToken, user, login } = useUserAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);
  const [shouldRedirectSetup, setShouldRedirectSetup] = React.useState(false);
  const token = getToken();
  
  useEffect(() => {
    let isMounted = true;
    
    const checkUserSetup = async () => {
      console.log('HomePageRouter: Starting check, user role:', user?.role);
      
      if (!token) {
        if (isMounted) setChecking(false);
        return;
      }
      
      // If user already has a valid role, no need to check API
      if (user && (user.role === 'USER_TEACHER' || user.role === 'USER_STUDENT')) {
        console.log('HomePageRouter: Valid role found, no API check needed');
        if (isMounted) setChecking(false);
        return;
      }
      
      // Role is "USER" or missing - check with API
      console.log('HomePageRouter: Checking setup status with API...');
      try {
        const setupResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/setup/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const setupNeeded = await setupResponse.json();
        console.log('HomePageRouter: Setup needed:', setupNeeded);
        
        if (setupNeeded === true) {
          console.log('HomePageRouter: Will redirect to setup');
          if (isMounted) setShouldRedirectSetup(true);
          return;
        }
        
        // Setup not needed - fetch fresh profile to update role
        console.log('HomePageRouter: Fetching fresh profile...');
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileResponse.json();
        console.log('HomePageRouter: Profile data:', profileData);
        
        if (profileData && profileData.role && isMounted) {
          login({
            ...user,
            fname: profileData.fname,
            lname: profileData.lname,
            role: profileData.role,
            profilePicture: profileData.profilePicture || user?.profilePicture
          }, token);
        }
      } catch (err) {
        console.error('HomePageRouter: Error:', err);
      }
      
      if (isMounted) setChecking(false);
    };
    
    checkUserSetup();
    
    return () => { isMounted = false; };
  }, [token]);
  
  // Handle redirect in useEffect to avoid render-time state updates
  useEffect(() => {
    if (shouldRedirectSetup) {
      navigate('/setup', { replace: true });
    }
  }, [shouldRedirectSetup, navigate]);
  
  if (!token || checking || shouldRedirectSetup) {
    return <LoadingSpinner />;
  }

  if (isTeacher()) {
    return <HomePage />;
  } else if (isStudent()) {
    return <StudentHomePage />;
  }
  
  // Fallback for unrecognized role - this shouldn't happen after our fixes
  console.log('HomePageRouter: Fallback - unrecognized role:', user?.role);
  return <LoadingSpinner />;
}

// Add a route listener component
const RouteListener = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only store previous paths if not navigating to profile or login
    if (!location.pathname.includes('/profile') && !location.pathname.includes('/login')) {
      // Store the current path as previous path
      sessionStorage.setItem('previousPath', location.pathname);
      console.log(`Stored previous path: ${location.pathname}`);
    }
  }, [location]);
  
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<RouteListener />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-success" element={<OAuthSuccessHandler />} />
          <Route path="/verify" element={<OTPVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/demo/feedback" element={<ChartFeedbackDemo />} />

          {/* Admin Routes - Separate from regular user routes */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

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
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;