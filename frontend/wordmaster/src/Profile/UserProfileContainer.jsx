import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Grid,
  Avatar,
  Paper,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useMediaQuery
} from "@mui/material";
import { ArrowBack, CameraAlt, Lock, Email, Close, ChevronLeft as ChevronLeftIcon } from "@mui/icons-material";
import { useUserAuth } from '../components/context/UserAuthContext';
import { useUserProfile } from './UserProfileFunctions'; // Updated import to match the hook location
import '@fontsource/press-start-2p'
import picbg from '../assets/picbg.png';
import BGforProfile from '../assets/BGforProfile.png';
import backbtn from '../assets/backbtn.png';
import BookforProfile from '../assets/BookforProfile.png';
import defaultProfile from '../assets/defaultprofile.png';

import farmer from '../assets/ch-farmer.png';
import king from '../assets/ch-king.png';
import knight from '../assets/ch-knight.png';
import mermaid from '../assets/ch-mermaid.png';
import priest from '../assets/ch-priest.png';
import teacher from '../assets/ch-teacher.png';
import wizard from '../assets/ch-wizard.png';
import archer from '../assets/ch-archer.png';
import samurai from '../assets/ch-samurai.png';

// Loading spinner component (matches the one in AppRoutes)
const LoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: `
        linear-gradient(to bottom, 
          rgba(249, 249, 249, 0.95) 0%, 
          rgba(249, 249, 249, 0.95) 40%, 
          rgba(249, 249, 249, 0.8) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'pixelated',
    }}
  >
    <CircularProgress
      size={60}
      thickness={4}
      sx={{
        color: '#5F4B8B',
        mb: 2,
        filter: 'drop-shadow(0 4px 8px rgba(95, 75, 139, 0.3))',
      }}
    />
    <Typography
      sx={{
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#5F4B8B',
        textShadow: '2px 2px 4px rgba(95, 75, 139, 0.2)',
        letterSpacing: '2px',
      }}
    >
      LOADING...
    </Typography>
  </Box>
);

const UserProfileContainer = () => {
  const { user, authChecked, logout, getToken, setUser } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState('/homepage');
  const [isNavigating, setIsNavigating] = useState(false);
  // Log current location for debugging
  console.log("Current location:", location.pathname);

  useEffect(() => {
    // Get the previous path from sessionStorage or default to homepage
    const prevPath = sessionStorage.getItem('previousPath') || '/homepage';
    
    // Make sure we don't navigate to login page if that was the previous path
    const safePath = prevPath === '/login' ? '/homepage' : prevPath;
    setPreviousPath(safePath);
    
    // Don't remove from sessionStorage so that other components can access it if needed
  }, []);

  const handleBackNavigation = () => {
    // Log the navigation for debugging
    console.log(`Navigating back to: ${previousPath}`);
    setIsNavigating(true);
    
    // Short timeout to show the loading spinner
    setTimeout(() => {
      navigate(previousPath);
    }, 300);
  };
  
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
  

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
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
    setError, 
    setSuccess, 
    handleChange,
    handleSubmit,
    handleDeactivate,
    uploadProfilePicture 
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

  // Show loading spinner during authentication check, loading, or if no user
  if (!authChecked || !user) {
    return <LoadingSpinner />;
  }
  
  // Show loading spinner during navigation
  if (isNavigating) {
    return <LoadingSpinner />;
  }
  
  // Show loading spinner when profile data is loading
  if (loading) {
    return <LoadingSpinner />;
  }

return (
  <Box sx={{ 
    display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      background: `
        linear-gradient(to bottom, 
          rgba(249, 249, 249, 10) 0%, 
          rgba(249, 249, 249, 10) 40%, 
          rgba(249, 249, 249, 0.1) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'pixelated',
  }}>
    {/* Back button with dynamic navigation */}
    <Box sx={{ 
      py: 1.5,
      px: { xs: 1.5, md: 3 },
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2
    }}>
      <Tooltip title={`Return to ${previousPath.replace('/', '').charAt(0).toUpperCase() + previousPath.replace('/', '').slice(1)}`}>
        <IconButton 
          onClick={handleBackNavigation}
          sx={{
            color: '#5F4B8B',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '2px solid #5F4B8B',
            borderRadius: '4px',
            width: '32px',
            height: '32px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0px 0px 8px rgba(95, 75, 139, 0.6)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronLeftIcon fontSize="medium" />
        </IconButton>
      </Tooltip>
    </Box>

    {/* Main Content */}
    <Box
      sx={{
        flex: 20,
        display: 'flex',
        width: '90%',
        height: '70%', 
        overflow: 'hidden', 
        borderRadius: '15px',
        background: `url(${BookforProfile})`,
        backgroundSize: '100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxSizing: 'border-box', 
        position: 'center', 
        height: `calc(100vh - 60px)`,
        marginLeft: '5%',
      }}
    >
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        width: '70%',
        height: '70%', 
        overflow: 'hidden', 
        borderRadius: '15px',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxSizing: 'border-box', 
        position: 'relative', 
        mt: '5%',
      }}
    >
      
      {/* Left Column */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'top',
          p: 2,
          overflow: 'hidden',
          overflowX: 'hidden',  // prevent horizontal scroll
          mt: '2%',
        }}
      >
        {/* Add back button with ChevronLeftIcon */}
       

        {/* Reserve space for alert */}
        {/*
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
        </Box>*/}

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
          setDeactivateDialogOpen={setDeactivateDialogOpen}
        />
      </Box>

      {/* Right Column */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          p: 4,
          height: '100%',       // match parent height
          overflowY: 'auto',    // scroll vertically only
          overflowX: 'hidden',  // prevent horizontal scroll
          position: 'relative',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#5F4B8B',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
        }}
      >
        <Box
          sx={{
            borderRadius: 4,
            p: 2,
            width: '100%',
            maxWidth: 420,
      
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            mr: 15,
          }}
        >
          <Typography sx={{...pixelHeading, color:"Black", ml: '8%', mb : 2}}>
            Choose Character
          </Typography>
          <Grid container spacing={2} justifyContent="center" sx={{ mt: 5, ml: 5, }}>
            {[farmer, king, knight, mermaid, priest, teacher, wizard, archer, samurai].map((src, index) => (
              <Grid item xs={4} sm={4} md={4} key={index} display="flex" justifyContent="center"> 
                <img
                  src={src}
                  alt={`Option ${index + 1}`}
                  style={{
                    width: '100%',
                    maxWidth: 110,
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
    <DeactivateDialog 
      open={deactivateDialogOpen}
      onClose={() => setDeactivateDialogOpen(false)}
      onDeactivate={handleDeactivate}
      isDeactivating={isDeactivating}
      error={error}
      setError={setError} // Pass setError to the dialog
      pixelHeading={pixelHeading}
      pixelText={pixelText} // Pass pixelText to fix the error
    />
  </Box>
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
    archer,
    samurai,
  ];

  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;

  return (
    <Box 
  position="relative" 
  mb={1} 
  sx={{ 
    display: "flex", 
    justifyContent: "center",  // centers Avatar horizontally
    alignItems: "center",      // centers Avatar vertically
    width: "100%"              // ensures full width container
  }}
>
  <Avatar
    src={profilePicture || defaultProfile}
    sx={{
      width: 120,
      height: 120,
      fontSize: 40,
      // border: '2px solid #5F4B8B',
      color: "#5F4B8B",
      borderRadius: '10%',
      ml: '27%',
    }}
  >
    {!profilePicture && !defaultProfile && initials}
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

const PersonalInformation = ({ formData, editMode, handleChange, handleSubmit, setEditMode, loading, pixelHeading, pixelText, handleCancel, setDeactivateDialogOpen}) => (
  <Paper 
    sx={{ 
      width: '60%',
      boxShadow: "none",
      ml: '29%', 
      p: 4, 
      borderRadius: '12px',
      maxHeight: '30%',
      backgroundColor: 'transparent',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px', // adjust height as needed
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
        zIndex: 2
      }
    }}
  >
   <Box sx={{ textAlign: "center" }}>
  <Typography variant="h5" fontWeight="bold" gutterBottom sx={pixelHeading}>
    Personal Information
  </Typography>
</Box>
 <Divider sx={{ my: 2, mx: "auto", width: "100%", mb: 3.5 }} />


    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box display="flex" gap={2} mb={3.5}>
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
          sx: pixelText, mb:3,
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Lock color="action" sx={{ opacity: 0.9 }} />
            </InputAdornment>
          ),
          readOnly: true,
        }}
        FormHelperTextProps={{ sx: pixelText }}
        sx={{ 
          pixelText,
          mb: 1,
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
        setDeactivateDialogOpen={setDeactivateDialogOpen}
      />
    </Box>
  </Paper>
);

// Updated FormActions component with even smaller buttons
const FormActions = ({ editMode, setEditMode, loading, handleCancel, setDeactivateDialogOpen }) => {
  const buttonBaseStyles = {
    borderRadius: '4px',
    px: 2, // Further reduced horizontal padding
    py: 0.6, // Further reduced vertical padding
    fontFamily: '"Press Start 2P", cursive',
    fontSize: { xs: '6px', sm: '8px' }, // Smaller font size
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    transition: 'all 0.2s ease',
    minWidth: '120px', // Reduced width from 140px to 120px
    height: '28px', // Reduced height from 32px to 28px
  };
  
  return (
    <Box display="flex" justifyContent="space-between" mt={7} gap={2} >
      {/* Left side - Deactivate Account (only shown when not in edit mode) */}
      <Box>
        {!editMode && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeactivateDialogOpen(true)}
            sx={{
              ...buttonBaseStyles,
              borderColor: '#d32f2f',
              color: '#d32f2f',
              '&:hover': {
                backgroundColor: '#ffebee',
                borderColor: '#c62828'
              }
            }}
          >
            Deactivate Account
          </Button>
        )}
      </Box>
      
      {/* Right side - Edit/Save buttons */}
      <Box display="flex" justifyContent="center" alignContent="center" alignItems="center" gap={3}> {/* Keep increased gap */}
        {editMode ? (
          <>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: '' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{
                  ...buttonBaseStyles,
                  backgroundColor: '#fff',
                  color: '#5F4B8B',
                  borderColor: '#5F4B8B',
                  '&:hover': {
                    backgroundColor: '#f0edf5',
                    borderColor: '#4a3a6d',
                    transform: 'translateY(-1px)'
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                    borderStyle: 'inset'
                  },
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                ...buttonBaseStyles,
                backgroundColor: '#5F4B8B',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(1px)',
                  borderStyle: 'inset'
                },
              }}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={() => setEditMode(true)}
            sx={{
              ...buttonBaseStyles,
              backgroundColor: '#5F4B8B',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#4a3a6d',
                transform: 'translateY(-1px)'
              },
              '&:active': {
                transform: 'translateY(1px)',
                borderStyle: 'inset'
              },
            }}
          >
            Edit Profile
          </Button>
        )}
      </Box>
    </Box>
  );
};

// DeactivateDialog component with setError and pixelHeading props
const DeactivateDialog = ({ open, onClose, onDeactivate, isDeactivating, error, setError, pixelHeading, pixelText, pixelButton }) => (
  <Dialog 
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        borderRadius: '12px',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 10px 32px rgba(31, 38, 135, 0.15), 0 4px 8px rgba(95, 75, 139, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }
    }}
  >
    <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
      Confirm Account Deactivation
    </DialogTitle>

    
    <DialogContent>
      <DialogContentText sx={{ ...pixelText, color: '#666' }}>
        Are you sure you want to deactivate your account? This action cannot be undone.
      </DialogContentText>
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 1, '& .MuiAlert-message': pixelText }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </DialogContent>
    
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button
        variant="outlined"
        onClick={onClose}
        sx={{
          ...pixelButton,
          color: '#5F4B8B',
          borderColor: '#5F4B8B',
          '&:hover': { 
            borderColor: '#4a3a6d',
            backgroundColor: 'rgba(95, 75, 139, 0.1)'
          }
        }}
      >
        CANCEL
      </Button>
      <Button
        variant="contained"
        onClick={onDeactivate}
        disabled={isDeactivating}
        sx={{
          ...pixelButton,
          backgroundColor: '#d32f2f',
          color: 'white',
          '&:hover': { 
            backgroundColor: '#b71c1c'
          }
        }}
      >
        {isDeactivating ? <CircularProgress size={24} color="inherit" /> : 'DEACTIVATE'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default UserProfileContainer;