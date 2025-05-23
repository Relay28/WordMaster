import React, { useState, useEffect } from 'react';
import { TextField, Button, IconButton, Typography, Container, Box, Divider, CircularProgress, Alert } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import "../css/login.css";
import { logout, isLoggedIn } from '../utils/authUtils';
import { useUserAuth } from './context/UserAuthContext'; // Adjust the import path as necessary
// API base URL - centralized for easy configuration
const API_BASE_URL = 'http://localhost:8080/api';

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
const { login } = useUserAuth(); // Add this line
  console.log("Check");;;
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error')));
    }
    
    // Check for logout parameter
    if (params.get('logout') === 'true') {
      logout();
      console.log('User logged out successfully');
    } else if (isLoggedIn()) {
      navigate('/homepage');
    }
  }, [location, navigate]);


  const handleRegularLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Attempting login with:", { email });
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data && response.data.token) {
        console.log("Login successful:", response.data);
        
        // Save user data - using consistent keys with AuthProvider
        localStorage.setItem('userToken', response.data.token);
        login({
          id: response.data.id,
          email: response.data.email,
          fname: response.data.fname,
          lname: response.data.lname,
          profilePicture: response.data.profilePicture,
          role: response.data.role
        }, response.data.token);

              
       const val  =  localStorage.getItem('userToken')
        const setupResponse = await axios.get(`${API_BASE_URL}/profile/setup/status`, {
            headers: {
              Authorization: `Bearer ${val}`
            }
          });
          
          if (setupResponse.data === true) {
            navigate('/setup');
          } else {
            navigate('/homepage');
          }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      console.log("Initiating Microsoft login");
      const response = await axios.get(`${API_BASE_URL}/auth/microsoft/auth-url`);
      
      if (response.data) {
        console.log("Redirecting to:", response.data);
        
        // Clear any existing auth data to prevent state issues
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        
        window.location.href = response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('Failed to initiate Microsoft login. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Section - Image (Handled in CSS) */}
      <div className="image-section"></div>

      {/* Right Section - Form */}
      <div className="form-section">
        <Container maxWidth="xs" className="form-wrapper" sx={{ padding: '20px' }}>
          {/* Logo */}
          <Typography variant="h4" className="logo-text" sx={{ padding: '10px' }}>
            WordMaster
          </Typography>

          {/* Heading & Subheading */}
          <Typography variant="h5" className="main-heading" sx={{ paddingTop: '10px' }}>
            Ready to start?
          </Typography>
          <Typography variant="body2" className="sub-text" sx={{ paddingBottom: '20px' }}>
            Log in to dive into endless possibilities!
          </Typography>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleRegularLogin}>
            {/* Email Input */}
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              variant="outlined"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password Input with Visibility Toggle */}
            <Box position="relative" width="100%">
              <TextField
                label="Password"
                type={passwordVisible ? "text" : "password"}
                fullWidth
                margin="normal"
                variant="outlined"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <IconButton
                className="visibility-icon"
                onClick={() => setPasswordVisible(!passwordVisible)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '55%',
                  transform: 'translateY(-50%)',
                }}
              >
                {passwordVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>

            {/* Forgot Password */}
            <Typography align="right" className="forgot-password" sx={{ paddingBottom: '30px', fontSize: "10px" }}>
              Forgot Password?
            </Typography>

            {/* Login Button */}
            <Button 
              variant="contained" 
              fullWidth 
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>

          {/* OR Divider */}
          <Divider className="divider" sx={{ marginTop: '10px'}}>
            <Typography className="or-text" color="gray">OR</Typography>
          </Divider>

          {/* Microsoft Sign-In Button */}
          <Box display="flex" justifyContent="center" mt={2}>
            <Button 
              variant="outlined" 
              className="social-button" 
              sx={{fontSize: "12px"}}
              onClick={handleMicrosoftLogin}
              disabled={loading}
            >
              <svg
                className="social-icon"
                width="20"
                height="20"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                fill="#5F4B8B"
              >
                <path d="M7.462 0H0v7.19h7.462zM16 0H8.538v7.19H16zM7.462 8.211H0V16h7.462zm8.538 0H8.538V16H16z" />
              </svg>
              Sign in with Microsoft
            </Button>
          </Box>

          {/* Signup Link */}
          <Typography className="register-text" sx={{ marginTop: '30px', fontSize: '10px'}}>
            Don't have an account? <Link to="/register">Signup</Link>
          </Typography>
        </Container>
      </div>
    </div>
  );
};

export default Login;