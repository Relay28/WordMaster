import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const OAuthSuccessHandler = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserAuth();
  const processingAttempted = useRef(false);
  
  useEffect(() => {
    // Prevent multiple processing attempts on remounts
    if (processingAttempted.current) {
      return;
    }
    
    processingAttempted.current = true;
    
    const processOAuthData = async () => {
      try {
        // Get the data param from URL
        const params = new URLSearchParams(location.search);
        const encodedData = params.get('data');
        
        if (!encodedData) {
          throw new Error('No authentication data provided');
        }
        
        // Decode the base64 string to get auth response
        const decodedData = atob(encodedData);
        const authData = JSON.parse(decodedData);
        
        console.log('Received auth data:', authData);
        
        if (!authData.token) {
          throw new Error('Invalid authentication data');
        }
        
        // Store auth data
        login({
          id: authData.id,
          email: authData.email,
          fname: authData.fname || '',
          lname: authData.lname || '',
          role: authData.role
        }, authData.token);
        
        // Handle setup based on role
        try {
          // Try to check setup status with timeout for slow connections
          const setupResponse = await axios.get(`${API_BASE_URL}/profile/setup/status`, {
            headers: {
              Authorization: `Bearer ${authData.token}`
            },
            timeout: 5000 // 5 second timeout
          });
          
          // Redirect based on setup status
          if (setupResponse.data === true || authData.role === 'USER') {
            console.log('Setup needed, redirecting to setup page');
            navigate('/setup');
          } else {
            console.log('Setup not needed, redirecting to homepage');
            navigate('/homepage');
          }
        } catch (setupError) {
          console.error('Error checking setup status:', setupError);
          
          // If we can't check setup status, make decision based on role
          if (authData.role === 'USER') {
            console.log('Using role to determine flow, redirecting to setup page');
            navigate('/setup');
          } else {
            console.log('Using role to determine flow, redirecting to homepage');
            navigate('/homepage');
          }
        }
      } catch (err) {
        console.error('Error processing OAuth data:', err);
        setError(err.message || 'Authentication failed');
        // Don't auto-redirect on error, let the user manually try again
      } finally {
        setLoading(false);
      }
    };
    
    processOAuthData();
  }, []); // Empty dependency array to run once, using ref to prevent multiple executions
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} sx={{ color: '#5F4B8B' }} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Completing your sign-in...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        padding={3}
      >
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 3, textAlign: 'center' }}>
          There was an issue connecting to the server. 
          Please check your connection and try again.
        </Typography>
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            onClick={handleRetry}
            sx={{ 
              backgroundColor: '#5F4B8B',
              '&:hover': { backgroundColor: '#4a3a6d' }
            }}
          >
            Retry
          </Button>
          <Button 
            variant="outlined"
            onClick={handleGoToLogin}
            sx={{ 
              borderColor: '#5F4B8B',
              color: '#5F4B8B',
              '&:hover': { borderColor: '#4a3a6d' }
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
    >
      <CircularProgress />
    </Box>
  );
};

export default OAuthSuccessHandler;
