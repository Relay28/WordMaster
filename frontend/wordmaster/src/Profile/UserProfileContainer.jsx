// src/components/UserProfileContainer.js
import React from 'react';
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
import { useUserAuth } from '../components/context/UserAuthContext';
import { useUserProfile } from './UserProfileFunctions';

const UserProfileContainer = () => {
  const { user, authChecked, logout, getToken } = useUserAuth();
  const {
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
      <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
        {loading && !editMode ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center">
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

            <ProfilePicture 
              firstName={formData.firstName} 
              lastName={formData.lastName} 
              editMode={editMode} 
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
        )}
      </Container>

      <DeactivateDialog 
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        onDeactivate={handleDeactivate}
        isDeactivating={isDeactivating}
        error={error}
      />
    </Box>
  );
};

const ProfilePicture = ({ firstName, lastName, editMode }) => (
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
      {firstName.charAt(0)}{lastName.charAt(0)}
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
);

const PersonalInformation = ({ formData, editMode, handleChange, handleSubmit, setEditMode, loading }) => (
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

const DeactivateDialog = ({ open, onClose, onDeactivate, isDeactivating, error }) => (
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
        <Alert severity="error" sx={{ mb: 2 }}>
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