import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import '@fontsource/press-start-2p'
import picbg from '../assets/picbg.png';
import BGforProfile from '../assets/BGforProfile.png';
import backbtn from '../assets/backbtn.png';

import farmer from '../assets/ch-farmer.png';
import king from '../assets/ch-king.png';
import knight from '../assets/ch-knight.png';
import mermaid from '../assets/ch-mermaid.png';
import priest from '../assets/ch-priest.png';
import teacher from '../assets/ch-teacher.png';
import wizard from '../assets/ch-wizard.png';

const UserProfileContainer = () => {
  const { user, authChecked, logout, getToken, setUser } = useUserAuth();

  const navigate = useNavigate();

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

  const handleCancel = () => {
    setFormData({
      firstName: user.fname || "",
      lastName: user.lname || "",
      email: user.email || "",
      profilePicture: user.profilePicture || "",
    });
    setEditMode(false);
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

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: { xs: '8px', sm: '10px' },
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: { xs: '12px', sm: '14px' },
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  if (!authChecked || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  margin: 0,
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
  overflow: 'hidden',
  background: `url(${BGforProfile})`,
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  imageRendering: 'pixelated',
}}>
      {/* Main Content */}
      <Box sx={{ 
        flex: 1,
        width: '80%',
        overflow: 'auto',
        // Optional: custom scrollbar styling
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#5F4B8B', borderRadius: '4px' }
      }}>
        <Box sx={{ display: 'flex', width: '100%', minHeight: '100%' }}>
        {/* left Column */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'top',
            p: 2,
            mt: 15,
            ml: 51,
          }}
        >
          {/* Reserve space for alert */}
          <Box sx={{ height: 32, mb: 3, width: '95%' }}>
            {error && (
              <Alert severity="error" sx={{ width: '95%' }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ width: '95%' }} onClose={() => setSuccess(null)}>
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
            pixelHeading={pixelHeading}
            pixelText={pixelText}
            handleCancel={handleCancel}
          />
          <Box
            sx={{
              position: 'fixed',
              bottom: '150px',
              left: '420px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
            onClick={() => navigate('/homepage')}
          >
            <img 
              src={backbtn} 
              alt="Back to Home"
              style={{
                width: '120px',
                height: 'auto',
                imageRendering: 'pixelated',
              }}
            />
          </Box>
        </Box>
        {/* Right Column */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'top',
            p: 4,
            mt: 10,
          }}
        >
          <Box
            sx={{
              borderRadius: 4,
              p: 3,
              width: '100%',
              maxWidth: 420,
              mb: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflow: 'hidden'
            }}
          >
          <Typography sx={{...pixelHeading, color:"Black"}}>
            Choose Character
          </Typography>
            <Grid container spacing={2} justifyContent="center" sx={{ mt: 5 }}>
              {[farmer, king, knight, mermaid, priest, teacher, wizard].map((src, index) => (
                <Grid item xs={4} sm={4} md={4} key={index} display="flex" justifyContent="center"> 
                  <img
                    src={src}
                    alt={`Option ${index + 1}`}
                    style={{
                      width: '100%',
                      maxWidth: 100,
                      height: 'auto',
                      aspectRatio: '1/1',
                      objectFit: 'cover',
                      borderRadius: '10%',
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
        </Box>
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

  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;

  return (
    <Box position="relative" mb={1} textAlign="center">
      <Avatar
        src={profilePicture || undefined}
        sx={{
          width: 150,
          height: 150,
          fontSize: 40,
          border: '2px solid #5F4B8B',
          color: "#5F4B8B",
          borderRadius: '10%',
        }}
      >
        {!profilePicture && initials}
      </Avatar>
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

const PersonalInformation = ({ formData, editMode, handleChange, handleSubmit, setEditMode, loading, pixelHeading, pixelText, handleCancel}) => (
  <Paper 
    elevation={3} 
    sx={{ 
      width: '90%', 
      p: 3, 
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxHeight: 400,
      overflow: 'auto',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '8px', // adjust height as needed
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
        opacity: 0.9,
        zIndex: 2
      }
    }}
  >
    <Typography variant="h5" fontWeight="bold" gutterBottom sx={pixelHeading}>
      Personal Information
    </Typography>
    <Divider sx={{ my: 2 }} />

    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          label="First Name"
          name="firstName"
          value={formData.firstName || ""}
          onChange={handleChange}
          disabled={!editMode}
          variant={editMode ? "outlined" : "filled"}
          required
          sx={pixelText}
          InputLabelProps={{ sx: pixelText }}
          InputProps={{ sx: pixelText }}
        />
        <TextField
          fullWidth
          label="Last Name"
          name="lastName"
          value={formData.lastName || ""}
          onChange={handleChange}
          disabled={!editMode}
          variant={editMode ? "outlined" : "filled"}
          required
          sx={pixelText}
          InputLabelProps={{ sx: pixelText }}
          InputProps={{ sx: pixelText }}
        />
      </Box>

      <TextField
        fullWidth
        label="Email"
        name="email"
        type="email"
        value={formData.email || ""}
        onChange={handleChange}
        disabled={true} // Always disabled regardless of edit mode
        variant="filled"
        InputLabelProps={{ sx: pixelText }}
        InputProps={{
          sx: pixelText,
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
        FormHelperTextProps={{ sx: pixelText }}
        sx={{ 
          pixelText,
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
          {/*<TextField
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
          />*/}
          {/*<TextField
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
          />*/}
        </>
      )}
      <FormActions 
        editMode={editMode}
        setEditMode={setEditMode}
        loading={loading}
        handleCancel={handleCancel}
      />
    </Box>
  </Paper>
);

// No changes needed for FormActions component
const FormActions = ({ editMode, setEditMode, loading, handleCancel}) => (
  <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
    {editMode ? (
      <>
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={{
            backgroundColor: '#fff',
            color: '#5F4B8B',
            borderColor: '#5F4B8B',
            borderRadius: '4px',
            px: 3,
            py: 1,
            fontFamily: '"Press Start 2P", cursive',
            fontSize: { xs: '8px', sm: '10px' },
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
            transition: 'all 0.1s ease',
            '&:hover': {
              backgroundColor: '#f0edf5',
              borderColor: '#4a3a6d',
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'translateY(1px)',
              boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
              borderStyle: 'inset'
            },
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
            color: '#fff',
            borderRadius: '4px',
            px: 3,
            py: 1,
            fontFamily: '"Press Start 2P", cursive',
            fontSize: { xs: '8px', sm: '10px' },
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
            transition: 'all 0.1s ease',
            '&:hover': {
              backgroundColor: '#4a3a6d',
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'translateY(1px)',
              boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
              borderStyle: 'inset'
            },
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
          color: '#fff',
          borderRadius: '4px',
          px: 3,
          py: 1,
          fontFamily: '"Press Start 2P", cursive',
          fontSize: { xs: '8px', sm: '10px' },
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
          transition: 'all 0.1s ease',
          '&:hover': {
            backgroundColor: '#4a3a6d',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
            borderStyle: 'inset'
          },
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