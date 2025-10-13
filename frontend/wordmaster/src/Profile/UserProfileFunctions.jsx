// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../components/context/UserAuthContext';

const API_URL = import.meta.env.VITE_API_URL;
export const useUserProfile = (user, authChecked, logout, getToken) => {
  const [editMode, setEditMode] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profilePicture: '',
    currentPassword: '',
    newPassword: '' // Retained in frontend but not sent to backend
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (authChecked && user) {
      fetchUserProfile();
    }
  }, [authChecked]);

  const { setUser } = useUserAuth();

  const uploadProfilePicture = async (file) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = await getToken();
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_URL}/api/profile/upload-picture`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Upload response:', response.data);
      
      // Update localStorage userData with new profile picture
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.profilePicture = response.data.profilePicture; // Use the new URL from backend
      
      // Update in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));

      // Update the user context - this is critical as it triggers re-renders in components that use the context
      setUser(userData);

      // Force a refresh for any components that might be displaying the user's profile picture
      // Use both direct dispatch and setTimeout for redundancy
      window.dispatchEvent(new Event('storage'));
      
      // Additional delayed event for components that might not catch the first one
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 100);

      setSuccess('Profile picture updated successfully');
      setLoading(false);
      return response.data; // Make sure to return the response data
    } catch (err) {
      setLoading(false);
      
      let errorMessage = 'An error occurred while uploading. Please try again.';
      
      if (err.response && err.response.data) {
        errorMessage = err.response.data.error || 'Failed to upload profile picture';
      }
      
      setError(errorMessage);
      console.error('Error uploading profile picture:', err);
      return null; // Return null on error
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken(); // Make sure to await the token
      
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setFormData({
        firstName: response.data.fname || '',
        lastName: response.data.lname || '',
        email: response.data.email || '',
        profilePicture: response.data.profilePicture || '',
        currentPassword: '',
        newPassword: '' // Reset new password field when fetching profile
      });


      const userObj = {
        ...user,
        fname: response.data.fname || '',
        lname: response.data.lname || '',
        email: response.data.email || '',
        profilePicture: response.data.profilePicture || ''
      };
      localStorage.setItem('userData', JSON.stringify(userObj));
      setUser(userObj);

    } catch (err) {
      setError('Failed to load profile data');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = await getToken(); // Make sure to await the token

      // Only include current password in the DTO (renamed to 'password')
      const updateDto = {
        fname: formData.firstName,
        lname: formData.lastName,
        email: formData.email,
        // currentPassword: formData.currentPassword // Sent as 'password' to backend
      };

      const response = await axios.put(`${API_URL}/api/profile`, updateDto, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Update local user data
      const updatedUser = {
        ...user,
        fname: response.data.fname,
        lname: response.data.lname,
        email: response.data.email,
        profilePicture: response.data.profilePicture
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess('Profile updated successfully');
      setEditMode(false);
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setIsDeactivating(true);
      setError(null);
      
      const token = await getToken(); // Make sure to await the token

      await axios.delete(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate account');
      console.error('Error deactivating account:', err);
    } finally {
      setIsDeactivating(false);
      setDeactivateDialogOpen(false);
    }
  };

  return {
    editMode,
    isDeactivating,
    deactivateDialogOpen,
    loading,
    error,
    success,
    setFormData,
    formData,
    setEditMode,
    setDeactivateDialogOpen,
    setError, // Add this
    setSuccess, // Add this
    handleChange,
    handleSubmit,
    handleDeactivate,
    uploadProfilePicture // Add this
  };
};