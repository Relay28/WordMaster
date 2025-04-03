import React, { useState } from 'react';
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

const SetupPage = () => {
  const [role, setRole] = useState('USER_STUDENT');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { getToken } = useUserAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.put(
        '/api/profile',
        {
          fname,
          lname,
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      const userData = JSON.parse(localStorage.getItem('userData'));
      const updatedUser = {
        ...userData,
        fname: response.data.fname,
        lname: response.data.lname,
        role: response.data.role
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));

      navigate('/homepage');
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
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

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center', // Added for horizontal centering
      alignItems: 'center', // Added for vertical centering
      minHeight: '100vh',
      backgroundColor: '#f9f9f9'
    }}>
      {/* Left Section - Image (Same as login) */}
      <Box sx={{
        width: '40%',
        backgroundImage: 'url(your-image-url.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '@media (max-width: 900px)': {
          display: 'none'
        }
      }} />

      {/* Right Section - Form - Only added mx: 'auto' to center this container */}
      <Box sx={{
        width: { xs: '100%', md: '60%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        mx: 'auto' // This is the only new property added for centering
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
            Just a few more things...
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
            By emailing to us with the app, you agree to do it every Friday.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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