import React, { useRef, useState } from 'react';
import { 
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  TextField,
  Typography,
  Grid,
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
import { useUserAuth } from '../components/context/UserAuthContext';
import { useUserProfile } from './UserProfileFunctions'; // Updated import to match the hook location

import farmer from '../assets/ch-farmer.png';
import king from '../assets/ch-king.png';
import knight from '../assets/ch-knight.png';
import mermaid from '../assets/ch-mermaid.png';
import priest from '../assets/ch-priest.png';
import teacher from '../assets/ch-teacher.png';
import wizard from '../assets/ch-wizard.png';

const UserProfileContainer = () => {
  const { user, authChecked, logout, getToken, setUser } = useUserAuth();

  const handleImageSelect = async (imgPath) => {
    try {
      const response = await fetch(imgPath);
      const blob = await response.blob();
      const file = new File([blob], imgPath.split('/').pop(), { type: blob.type });
      await uploadProfilePicture(file);
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setUser(userData); // This updates the context and triggers a re-render

      setFormData((prev) => ({
        ...prev,
        profilePicture: userData.profilePicture
      }));

      setDialogOpen(false);
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };
  
  const {
    editMode,
    isDeactivating,
    deactivateDialogOpen,
    loading,
    error,
    success,
    formData,
    setFormData,
    setEditMode,
    setDeactivateDialogOpen,
    setError, // Make sure to destructure these
    setSuccess, // Make sure to destructure these
    handleChange,
    handleSubmit,
    handleDeactivate,
    uploadProfilePicture // Make sure this is being properly destructured
  } = useUserProfile(user, authChecked, logout, getToken);

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
          <IconButton onClick={() => window.history.back()} sx={{ color: '#5F4B8B' }}>
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
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'white' }}>
        {/* Left Column */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'top',
            background: 'white',
            borderRight: '1px solid #eee',
            p: 4,
            mt: 8
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Choose Character
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[farmer, king, knight, mermaid, priest, teacher, wizard].map((src, index) => (
              <Grid item xs={4} key={index} display="flex" justifyContent="center">
                <img
                  src={src}
                  alt={`Option ${index + 1}`}
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: formData.profilePicture === src ? '3px solid #5F4B8B' : '2px solid transparent',
                    transition: 'border 0.2s',
                    opacity: 1,
                  }}
                  onClick={() => uploadProfilePicture && handleImageSelect(src)}
                  onMouseOver={e => (e.currentTarget.style.border = '2px solid #5F4B8B')}
                  onMouseOut={e => (e.currentTarget.style.border = formData.profilePicture === src ? '3px solid #5F4B8B' : '2px solid transparent')}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Right Column */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'top',
            background: '#faf7ff',
            p: 4,
          }}
        >
          {/* Reserve space for alert */}
          <Box sx={{ height: 56, mb: 2, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ width: '100%' }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ width: '100%' }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}
          </Box>

          <ProfilePicture 
            firstName={formData.firstName} 
            lastName={formData.lastName}
            profilePicture={formData.profilePicture}
            editMode={editMode}
            uploadProfilePicture={uploadProfilePicture}
            loading={loading}
            handleImageSelect={handleImageSelect}
          />

          <PersonalInformation 
            formData={formData}
            editMode={editMode}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setEditMode={setEditMode}
            loading={loading}
          />
        </Box>
      </Box>

      <DeactivateDialog 
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        onDeactivate={handleDeactivate}
        isDeactivating={isDeactivating}
        error={error}
        setError={setError} // Pass setError to the dialog
      />
    </Box>
  );
};

const ProfilePicture = ({
  firstName,
  lastName,
  profilePicture,
  editMode,
  uploadProfilePicture,
  loading,
  handleImageSelect
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const imageOptions = [
    farmer,
    king,
    knight,
    mermaid,
    priest,
    teacher,
    wizard,
  ];

  return (
    <Box position="relative" mb={4} textAlign="center">
      <Box
        component="img"
        src={profilePicture || '/images/default.png'}
        alt="Profile"
        sx={{
          width: 200,
          height: 200,
          objectFit: 'cover',
          borderRadius: '50%',
          border: '2px solid #5F4B8B',
          backgroundColor: '#ddd',
        }}
      />
      {/*
       {editMode && (
        <IconButton
          onClick={() => setDialogOpen(true)}
          disabled={loading}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 'calc(50% - 60px)', // aligns relative to image
            backgroundColor: '#5F4B8B',
            color: 'white',
            '&:hover': {
              backgroundColor: '#4a3a6d',
            },
            '&.Mui-disabled': {
              backgroundColor: '#9e9e9e',
              color: '#f5f5f5',
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : <CameraAlt />}
        </IconButton>
      )}
      */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Select a Profile Character</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {imageOptions.map((src, index) => (
              <Grid item xs={4} key={index} display="flex" justifyContent="center">
                <img
                  src={src}
                  alt={`Option ${index + 1}`}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'border 0.2s ease-in-out',
                  }}
                  onClick={() => handleImageSelect(src)}
                  onMouseOver={(e) => e.currentTarget.style.border = '2px solid #5F4B8B'}
                  onMouseOut={(e) => e.currentTarget.style.border = '2px solid transparent'}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};


// No changes needed for PersonalInformation component
const PersonalInformation = ({ formData, editMode, handleChange, handleSubmit, setEditMode, loading }) => (
  <Paper 
    elevation={3} 
    sx={{ 
      width: '80%', 
      p: 4, 
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}
  >
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      Personal Information
    </Typography>
    <Divider sx={{ my: 2 }} />

    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
        disabled={true} // Always disabled regardless of edit mode
        variant="filled"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Lock color="action" sx={{ opacity: 0.7 }} />
            </InputAdornment>
          ),
          readOnly: true,
        }}
        sx={{ 
          mb: 3,
          backgroundColor: '#f5f5f5',
          '& .MuiInputBase-input': {
            color: '#666',
          },
          '& .MuiFilledInput-root': {
            backgroundColor: '#f0f0f0',
            '&:hover': {
              backgroundColor: '#f0f0f0',
              cursor: 'not-allowed'
            },
            '&.Mui-focused': {
              backgroundColor: '#f0f0f0'
            }
          }
        }}
        helperText="Email address cannot be changed"
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
            label="New Password (for display only - not implemented)"
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
            disabled // Optional: disable if you don't want users to interact with it
          />
        </>
      )}
      <FormActions 
        editMode={editMode}
        setEditMode={setEditMode}
        loading={loading}
      />
    </Box>
  </Paper>
);

// No changes needed for FormActions component
const FormActions = ({ editMode, setEditMode, loading }) => (
  <Box display="flex" justifyContent="flex-end" mt={4}>
    {editMode ? (
      <>
        <Button
          variant="outlined"
          onClick={() => setEditMode(false)}
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
);

// Update DeactivateDialog to accept setError prop
const DeactivateDialog = ({ open, onClose, onDeactivate, isDeactivating, error, setError }) => (
  <Dialog 
    open={open}
    onClose={onClose}
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
      <IconButton onClick={onClose}>
        <Close />
      </IconButton>
    </DialogTitle>
    
    <DialogContent sx={{ py: 3, px: 3 }}>
      <Typography variant="body1" mb={2}>
        Are you sure you want to deactivate your account? This action cannot be undone.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </DialogContent>
    
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button
        variant="outlined"
        onClick={onClose}
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
        onClick={onDeactivate}
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
);

export default UserProfileContainer;