import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';

const OAuthSuccessHandler = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      // Get the data parameter from URL
      const params = new URLSearchParams(location.search);
      const encodedData = params.get('data');
      
      if (!encodedData) {
        throw new Error('No authentication data received');
      }
      
      // Decode the base64 auth data
      const decodedString = atob(encodedData);
      const authData = JSON.parse(decodedString);
      
      if (!authData || !authData.token) {
        throw new Error('Invalid authentication data');
      }
      
      console.log('OAuth login successful', authData);
      
      // Store auth data in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify({
        id: authData.id,
        email: authData.email,
        fname: authData.fname, 
        lname: authData.lname,
        role: authData.role
      }));
      
      // Redirect to home page
      navigate('/homepage');
    } catch (err) {
      console.error('Failed to process OAuth response:', err);
      setError(err.message || 'Authentication failed');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login?error=' + encodeURIComponent('Authentication failed. Please try again.'));
      }, 3000);
    }
  }, [location, navigate]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}
    >
      {error ? (
        <Typography color="error" variant="h6">
          {error}. Redirecting to login...
        </Typography>
      ) : (
        <>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Completing sign in, please wait...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default OAuthSuccessHandler;
