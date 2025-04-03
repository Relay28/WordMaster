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

const SetupPage = () => {
  const [role, setRole] = useState('student'); // Changed to match backend values
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('userToken');

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
        'http://localhost:8080/api/profile/setup',
        {
          fname,
          lname,
          role
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Update local storage with new user data
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

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
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

      {/* Right Section - Form */}
      <Box sx={{
        width: { xs: '100%', md: '60%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
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