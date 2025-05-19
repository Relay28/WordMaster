import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserProfile from './Profile/UserProfileContainer';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';
import HomePage from './components/Homepage/HomePage';
import StudentHomePage from './components/Homepage/StudentHomePage';
import OAuthSuccessHandler from './components/OAuthSuccessHandler';
import SetupPage from './components/user/SetupPage.';
import ClassroomDetailsPage from './components/Classroom/Classroom Details Page';
import GamePage from './components/gameplay/GamePage';
import CreateGameSession from './components/gameplay/CreateGameSession';
import GameCore from './components/gameplay/GameCore';
// Import content components
import ContentDashboard from './components/content/ContentDashboard';
import EditContent from './components/content/EditContent';
//import UploadContent from './components/content/UploadContent';
import ContentDetails from './components/content/ContentDetails';
import ProtectedTeacherRoute from './components/auth/ProtectedTeacherRoute';
import  ContentUpload from './components/content/contentUpload/ContentUpload';
import { useUserAuth } from './components/context/UserAuthContext';
import WaitingRoomPage from './components/WaitingRoom/WaitingRoomPage';
import AIContentGenerator from './components/content/AIContentGenerator';


// Create a wrapper component for role-based routing
function HomePageRouter() {
  const { isTeacher, isStudent, authChecked, user } = useUserAuth();

  console.log('Current user role:', user?.role);

  if (!authChecked) {
    return <div>Loading...</div>; // or a spinner
  }

  if (isTeacher()) {
    return <HomePage />;
  } else if (isStudent()) {
    return <StudentHomePage />;
  } 
  
}


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/homepage" element={<HomePageRouter />} />
      <Route path="/classroom/:classroomId" element={<ClassroomDetailsPage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/content/ai-generate" element={<AIContentGenerator />} />
      <Route path="/game/create" element={<CreateGameSession />} />
      <Route path="/game/:sessionId" element={<GameCore />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<SetupPage/>} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth-success" element={<OAuthSuccessHandler />} />
<Route path="/waiting-room/:contentId" element={<WaitingRoomPage />} />
      {/* Content Management Routes */}
      <Route element={<ProtectedTeacherRoute />}>
        <Route path="/content/dashboard" element={<ContentDashboard />} />
        <Route path="/content/upload" element={< ContentUpload />} />
        <Route path="/content/edit/:id" element={<EditContent />} />
        <Route path="/content/:id" element={<ContentDetails />} />
        
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
