import React, { useState, useEffect } from 'react';
import { 
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  styled,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserAuth } from '../context/UserAuthContext';

// Import the image - adjust the path as needed
import setupPageImage from '../../assets/Setup.png';
const API_URL = import.meta.env.VITE_API_URL;

const SetupPage = () => {
  const [role, setRole] = useState('USER_STUDENT');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, getToken, login } = useUserAuth();

  // Check setup status when component mounts
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/profile/setup/status`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          }
        );
        
        // If setupNeeded is false, redirect to homepage
        if (!response.data) {
          navigate('/homepage');
        }
      } catch (err) {
        console.error('Failed to check setup status:', err);
        setError('Failed to verify your account status. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkSetupStatus();
  }, [getToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fname || !lname) {
      setError('First name and last name are required');
      return;
    }
 
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/profile/setup`,
        {
          fname,
          lname,
          role
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      // Update both localStorage AND auth context state
      const updatedUser = {
        ...user,
        fname: response.data.fname,
        lname: response.data.lname,
        role: response.data.role
      };
      
      login(updatedUser, getToken());
      navigate('/homepage');
    } catch (err) {
      console.error('Setup failed:', err);
      setError(err.response?.data?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PurpleRadio = styled(Radio)({
    color: '#5F4B8B',
    '&.Mui-checked': {
      color: '#5F4B8B',
    },
  });

  // If we're still checking setup status, show loading indicator
  if (loading && !error) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress size={40} sx={{ color: '#5F4B8B' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
      flexDirection: 'row-reverse' // Reverse order to have image on right side
    }}>
      {/* Right Section - Image */}
      <Box sx={{
        width: '40%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: { xs: 'none', md: 'block' }, // Hide on small screens
      }}>
        {/* Image overlay with gradient */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(95, 75, 139, 0.6)', // Purple overlay with opacity
          zIndex: 1
        }} />
        
        {/* The actual image */}
        <Box 
          component="img"
          src={setupPageImage} // Use the imported image
          alt="WordMaster Learning"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        
  
      </Box>

      {/* Left Section - Form */}
      <Box sx={{
        width: { xs: '100%', md: '60%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0,
        mx: 'auto'
      }}>
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ 
            color: '#5F4B8B',
            fontWeight: 'bold',
            mb: 2
          }}>
            WordMaster
          </Typography>

          <Typography variant="h5" sx={{ mb: 1 }}>
            Complete Your Profile
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
            Tell us a bit more about yourself to get started.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              I am a:
            </Typography>
            <RadioGroup
              row
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ mb: 3 }}
            >
              <FormControlLabel 
                value="USER_TEACHER" 
                control={<PurpleRadio />} 
                label="Teacher" 
                sx={{ mr: 3 }}
              />
              <FormControlLabel 
                value="USER_STUDENT" 
                control={<PurpleRadio />} 
                label="Student" 
              />
            </RadioGroup>

            <TextField
              margin="normal"
              required
              fullWidth
              label="First Name"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Last Name"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 3 }} />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                backgroundColor: '#5F4B8B',
                '&:hover': {
                  backgroundColor: '#4a3a6d',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Setup'}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SetupPage;