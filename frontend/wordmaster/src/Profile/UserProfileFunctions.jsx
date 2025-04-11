// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    currentPassword: '',
    newPassword: '' // Retained in frontend but not sent to backend
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (authChecked && user) {
      fetchUserProfile();
    }
  }, [authChecked, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/profile', {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      setFormData({
        firstName: response.data.fname || '',
        lastName: response.data.lname || '',
        email: response.data.email || '',
        currentPassword: '',
        newPassword: '' // Reset new password field when fetching profile
      });
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

      // Only include current password in the DTO (renamed to 'password')
      const updateDto = {
        fname: formData.firstName,
        lname: formData.lastName,
        email: formData.email,
        password: formData.currentPassword // Sent as 'password' to backend
      };

      const response = await axios.put('http://localhost:8080/api/profile', updateDto, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      // Update local user data
      const updatedUser = {
        ...user,
        fname: response.data.fname,
        lname: response.data.lname,
        email: response.data.email
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));

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
      
      await axios.delete('http://localhost:8080/api/profile', {
        headers: {
          Authorization: `Bearer ${getToken()}`
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
    formData,
    setEditMode,
    setDeactivateDialogOpen,
    handleChange,
    handleSubmit,
    handleDeactivate
  };
};