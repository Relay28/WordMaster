import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Typography } from '@mui/material';

const OAuthRedirect = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    try {
      console.log("OAuthRedirect mounted, processing data...");
      const params = new URLSearchParams(location.search);
      const encodedData = params.get('data');
      
      if (!encodedData) {
        throw new Error("No authentication data found");
      }
      
      // Decode the base64 data
      const decodedData = atob(encodedData);
      const userData = JSON.parse(decodedData);
      console.log("Decoded user data:", userData);
      
      // Store user data
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        email: userData.email,
        fname: userData.fname,
        lname: userData.lname,
        role: userData.role
      }));
      
      // Redirect to home page
      navigate('/home');
    } catch (err) {
      console.error("Error processing OAuth response:", err);
      setError("Failed to process login data. Please try again.");
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login?error=Authentication+failed');
      }, 3000);
    }
  }, [location, navigate]);
  
  if (error) {
    return (
      <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Typography>
          Redirecting to login...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3 }}>
        Finishing login...
      </Typography>
    </Container>
  );
};

export default OAuthRedirect;
