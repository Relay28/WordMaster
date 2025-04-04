import React, { useState, useEffect } from 'react';
import { 
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from "@mui/material";
import { ArrowBack, CameraAlt, Lock, Email, Close } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserAuth } from '../components/context/UserAuthContext';

const UserProfileContainer = () => {
  const { user, authChecked, logout, getToken } = useUserAuth();
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
    newPassword: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (authChecked && user) {
      fetchUserProfile();
    }
  }, [authChecked, user]);

  console.log(user)
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/profile', {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      setFormData({
        firstName: response.data.fname || '',
        lastName: response.data.lname || '',
        email: response.data.email || '',
        currentPassword: '',
        newPassword: ''
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

      const updateDto = {
        fname: formData.firstName,
        lname: formData.lastName,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      };

      const response = await axios.put('/api/profile', updateDto, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      // Update local storage with new user data
      const updatedUser = {
        ...user,
        fname: response.data.fname,
        lname: response.data.lname,
        email: response.data.email
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully');
      setEditMode(false);
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
      
      const response = await axios.delete('/api/profile', {
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

  if (!authChecked || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9'
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2,
        px: { xs: 2, md: 6 }
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ color: '#5F4B8B' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
            Profile
          </Typography>
          <Button
            variant="text"
            color="error"
            onClick={() => setDeactivateDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Deactivate Account
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
        {loading && !editMode ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center">
            {/* Success/Error Messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, width: '100%' }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3, width: '100%' }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* Profile Picture */}
            <Box position="relative" mb={4}>
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: '#5F4B8B',
                  color: 'white',
                  fontSize: '2.5rem'
                }}
              >
              {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
              </Avatar>
              {editMode && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: '#5F4B8B',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#4a3a6d',
                    }
                  }}
                >
                  <CameraAlt />
                </IconButton>
              )}
            </Box>

            {/* Personal Information */}
            <Paper 
              elevation={3} 
              sx={{ 
                width: '100%', 
                p: 4, 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box 
                component="form" 
                onSubmit={handleSubmit}
                sx={{ mt: 3 }}
              >
                <Box display="flex" gap={3} mb={3}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!editMode}
                    variant={editMode ? "outlined" : "filled"}
                    required
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editMode}
                  variant={editMode ? "outlined" : "filled"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                  required
                />

                {editMode && (
                  <>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="New Password (leave blank to keep current)"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                  </>
                )}

                <Box display="flex" justifyContent="flex-end" mt={4}>
                  {editMode ? (
                    <>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditMode(false);
                          fetchUserProfile(); // Reset form
                        }}
                        sx={{
                          mr: 2,
                          borderColor: '#5F4B8B',
                          color: '#5F4B8B',
                          '&:hover': { 
                            backgroundColor: '#f0edf5',
                            borderColor: '#4a3a6d'
                          }
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                          backgroundColor: '#5F4B8B',
                          '&:hover': { backgroundColor: '#4a3a6d' },
                          textTransform: 'none',
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => setEditMode(true)}
                      sx={{
                        backgroundColor: '#5F4B8B',
                        '&:hover': { backgroundColor: '#4a3a6d' },
                        textTransform: 'none',
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Container>

      {/* Deactivate Account Dialog */}
      <Dialog 
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f5f3fa',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Typography fontWeight="bold">Confirm Account Deactivation</Typography>
          <IconButton onClick={() => setDeactivateDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3, px: 3 }}>
          <Typography variant="body1" mb={2}>
            Are you sure you want to deactivate your account? This action cannot be undone.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeactivateDialogOpen(false)}
            sx={{
              borderColor: '#5F4B8B',
              color: '#5F4B8B',
              '&:hover': { 
                backgroundColor: '#f0edf5',
                borderColor: '#4a3a6d'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeactivate}
            disabled={isDeactivating}
            color="error"
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' },
              textTransform: 'none',
            }}
          >
            {isDeactivating ? <CircularProgress size={24} color="inherit" /> : 'Deactivate Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfileContainer;