import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const OAuthSuccessHandler = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useUserAuth();
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
        console.log('Profile picture value:', authData.profilePicture, 'Type:', typeof authData.profilePicture);
        
        if (!authData.token) {
          throw new Error('Invalid authentication data');
        }
        
        // Store auth data first
        login({
          id: authData.id,
          email: authData.email,
          fname: authData.fname || '',
          lname: authData.lname || '',
          role: authData.role,
          profilePicture: authData.profilePicture || null
        }, authData.token);
        
        // Fetch the complete user profile to get profilePicture and other data
        // This ensures the header and other components have the full user data
        try {
          console.log('Fetching complete user profile...');
          const profileResponse = await axios.get(`${API_URL}/api/profile`, {
            headers: {
              Authorization: `Bearer ${authData.token}`
            },
            timeout: 5000
          });
          
          console.log('Profile API response:', profileResponse.data);
          
          // Update user data with complete profile information
          const completeUserData = {
            id: authData.id,
            email: profileResponse.data.email || authData.email,
            fname: profileResponse.data.fname || authData.fname || '',
            lname: profileResponse.data.lname || authData.lname || '',
            profilePicture: profileResponse.data.profilePicture || null
          };
          
          // Update localStorage and context with complete profile data
          localStorage.setItem('userData', JSON.stringify(completeUserData));
          setUser(completeUserData);
          
          console.log('Updated user data with profile picture:', completeUserData.profilePicture);
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Continue even if profile fetch fails - user can still use the app
        }
        
        // ALWAYS check with the API for setup status - don't rely on role from token
        // This is the single source of truth
        try {
          console.log('Checking setup status with API...');
          const setupResponse = await axios.get(`${API_URL}/api/profile/setup/status`, {
            headers: {
              Authorization: `Bearer ${authData.token}`
            },
            timeout: 5000
          });
          
          console.log('Setup status API response:', setupResponse.data);
          
          // setupResponse.data is true if setup is needed, false otherwise
          if (setupResponse.data === true) {
            console.log('Setup needed (API confirmed), redirecting to setup page');
            navigate('/setup', { replace: true });
          } else {
            console.log('Setup not needed (API confirmed), redirecting to homepage');
            navigate('/homepage', { replace: true });
          }
        } catch (setupError) {
          console.error('Error checking setup status:', setupError);
          // On error, use role as fallback
          if (authData.role === 'USER') {
            console.log('API failed, role is USER, redirecting to setup');
            navigate('/setup', { replace: true });
          } else {
            console.log('API failed, role is not USER, redirecting to homepage');
            navigate('/homepage', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error processing OAuth data:', err);
        setError(err.message || 'Authentication failed');
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
