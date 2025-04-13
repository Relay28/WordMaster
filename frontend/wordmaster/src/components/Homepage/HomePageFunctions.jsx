// src/hooks/useHomePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getUserClassrooms, joinClassroom, createClassroom } from '../utils/classroomService';

export const useHomePage = (authChecked, user, getToken, login, logout) => {
  const navigate = useNavigate();
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [joinSuccess, setJoinSuccess] = React.useState(false);
  const [createSuccess, setCreateSuccess] = React.useState(false);

  
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

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
          const response = await axios.get('http://localhost:8080/api/profile', {
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
      setJoinSuccess(true); // Add this after successful join
      setJoinClassOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join classroom. Please check the code and try again.');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  // Classroom creation
  const handleCreateClass = async () => {
    if (!className) {
      setError('Please enter a class name');
      return;
    }

    try {
      setLoadingClassrooms(true);
      await createClassroom(getToken(), { name: className });
      const data = await getUserClassrooms(getToken());
      setClassrooms(data);
      setCreateClassOpen(false);
      setClassName("");
      setError(null);
      setCreateSuccess(true); // Add this after successful creation
    setCreateClassOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create classroom. Please try again.');
    } finally {
      setLoadingClassrooms(false);
    }
  };

  return {
    // State
    joinClassOpen,
    createClassOpen,
    classCode,
    className,
    loadingProfile,
    loadingClassrooms,
    classrooms,
    error,
    anchorEl,
    joinSuccess,
    createSuccess,
    
    // Handlers
    setJoinClassOpen,
    setCreateClassOpen,
    setClassCode,
    setClassName,
    setJoinSuccess,
    setCreateSuccess,
    handleMenuOpen,
    handleMenuClose,
    handleProfileClick,
    handleLogout,
    handleJoinClass,
    handleCreateClass,
    
    // Derived values
    displayName: `${user?.fname || ''} ${user?.lname || ''}`.trim() || user?.email || '',
    roleDisplay: user?.role === "USER_TEACHER" ? "Teacher" : user?.role === "USER_STUDENT" ? "Student" : "Unknown",
    avatarInitials: user?.fname && user?.lname 
      ? `${user.fname.charAt(0)}${user.lname.charAt(0)}`
      : user?.email?.charAt(0)?.toUpperCase() || 'U',
    isTeacher: user?.role === "USER_TEACHER"
  };
};