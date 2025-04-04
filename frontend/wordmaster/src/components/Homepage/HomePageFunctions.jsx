// src/hooks/useHomePage.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUserClassrooms, joinClassroom } from '../utils/classroomService';

export const useHomePage = (authChecked, user, getToken, login, logout) => {
  const navigate = useNavigate();
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  console.log(user)

  // Menu handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login?logout=true');
  };

  // Data fetching
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authChecked && getToken() && !user) {
        setLoadingProfile(true);
        try {
          const response = await axios.get('/api/profile', {
            headers: { Authorization: `Bearer ${getToken()}` }
          });
          
          if (response.data) {
            login({
              id: response.data.id,
              email: response.data.email,
              fname: response.data.fname || '',
              lname: response.data.lname || '',
              role: response.data.role,
              profilePicture: response.data.profilePicture
            }, getToken());
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          logout();
          navigate('/login');
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
  }, [authChecked, user, getToken, login, logout, navigate]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (authChecked && user && getToken()) {
        setLoadingClassrooms(true);
        setError(null);
        try {
          const data = await getUserClassrooms(getToken());
          setClassrooms(data);
        } catch (err) {
          setError('Failed to load classrooms. Please try again.');
          console.error('Error fetching classrooms:', err);
        } finally {
          setLoadingClassrooms(false);
        }
      }
    };

    fetchClassrooms();
  }, [authChecked, user, getToken]);

  // Classroom joining
  const handleJoinClass = async () => {
    if (!classCode) {
      setError('Please enter a class code');
      return;
    }

    try {
      setLoadingClassrooms(true);
      await joinClassroom(getToken(), classCode);
      const data = await getUserClassrooms(getToken());
      setClassrooms(data);
      setJoinClassOpen(false);
      setClassCode("");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join classroom. Please check the code and try again.');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  return {
    // State
    joinClassOpen,
    classCode,
    loadingProfile,
    loadingClassrooms,
    classrooms,
    error,
    anchorEl,
    
    // Handlers
    setJoinClassOpen,
    setClassCode,
    handleMenuOpen,
    handleMenuClose,
    handleProfileClick,
    handleLogout,
    handleJoinClass,
    
    // Derived values
    displayName: `${user?.fname || ''} ${user?.lname || ''}`.trim() || user?.email || '',
    roleDisplay: user?.role?.replace('USER_', '') || 'Student',
    avatarInitials: user?.fname && user?.lname 
      ? `${user.fname.charAt(0)}${user.lname.charAt(0)}`
      : user?.email?.charAt(0)?.toUpperCase() || 'U'
  };
};