import React, { useEffect, useState } from 'react';
import { Typography, Container, Box, Button, Paper, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// API base URL - centralized for easy configuration
const API_BASE_URL = 'http://localhost:8080/api';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log("HomePage mounted. Location:", location);
    try {
      // Try to get user from URL parameters or localStorage
      const params = new URLSearchParams(location.search);
      console.log("URL params:", Object.fromEntries(params.entries()));
      
      if (params.get('token')) {
        // User info is in URL params (from OAuth redirect)
        const token = params.get('token');
        
        // Create user object from URL params
        const userData = {
          id: params.get('id'),
          email: params.get('email'),
          fname: params.get('fname'),
          lname: params.get('lname'),
          role: params.get('role')
        };
        
        console.log("User data from URL:", userData);
        
        // Validate token exists and all required user fields are present
        if (token && userData.id && userData.email) {
          // Save to localStorage and state
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // Clean URL by removing the query parameters
          window.history.replaceState({}, document.title, "/home");
        } else {
          throw new Error('Incomplete authentication data received');
        }
      } else {
        // Try to get from localStorage
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        console.log("Saved user from localStorage:", savedUser);
        
        if (savedToken && savedUser) {
          // Optionally verify token with backend
          // For now, just use the stored user data
          setUser(JSON.parse(savedUser));
        } else {
          console.log("No valid authentication found, redirecting to login");
          navigate('/login');
        }
      }
    } catch (err) {
      console.error("Error in HomePage:", err);
      setError("Authentication failed: " + (err.message || "Unknown error"));
      // Clear potentially corrupt data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, [location, navigate]);

  const handleLogout = () => {
    try {
      // Optional: Call logout endpoint on backend
      // await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      // });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Always clear local storage regardless of backend response
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: '#ffebee' }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography>No user information available. Please log in again.</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Welcome to WordMaster
        </Typography>
        <Typography variant="h5" gutterBottom>
          Hello, {user.fname} {user.lname}!
        </Typography>
        <Typography variant="body1" gutterBottom>
          Email: {user.email}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Role: {user.role}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default HomePage;
