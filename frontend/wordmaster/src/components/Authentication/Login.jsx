import React, { useState, useEffect } from 'react';
import { 
  Box,
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { logout, isLoggedIn } from '../../utils/authUtils';
import { useUserAuth } from '../context/UserAuthContext';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import logo from '../../assets/LOGO.png';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserAuth();
  const theme = useTheme();
  const ismobile = useMediaQuery(theme.breakpoints.down('sm'));
  const istablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '10px' : istablet ? '12px' : '13px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '7px' : istablet ? '8px' : '9px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error')));
    }
    
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
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      if (response.data && response.data.token) {
        localStorage.setItem('userToken', response.data.token);
        login({
          id: response.data.id,
          email: response.data.email,
          fname: response.data.fname,
          lname: response.data.lname,
          profilePicture: response.data.profilePicture,
          role: response.data.role
        }, response.data.token);

        const val = localStorage.getItem('userToken');
        const setupResponse = await axios.get(`${API_URL}/api/profile/setup/status`, {
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
      const response = await axios.get(`${API_URL}/api/auth/microsoft/auth-url`);
      
      if (response.data) {
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
          rgba(249, 249, 249, 0.9) 20%, 
          rgba(249, 249, 249, 10) 40%, 
          rgba(249, 249, 249, 0.1) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'pixelated',
    }}>
      <Box sx={{ 
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        py: ismobile ? 2 : 0,
        px: ismobile ? 0 : 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(95, 75, 139, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#5F4B8B',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#4a3a6d',
          },
        },
      }}>
        <Container
          maxWidth="sm"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: ismobile ? 1.5 : 0,
            my: ismobile ? 0 : 4,
            width: '100%',
            maxWidth: ismobile ? '100vw' : istablet ? '420px' : '500px',
            backgroundColor: ismobile
              ? 'rgba(255,255,255,0.85)'
              : 'rgba(255, 255, 255, 0.92)',
            borderRadius: ismobile ? '0px' : istablet ? '14px' : '16px',
            boxShadow: ismobile ? 'none' : '0 8px 32px rgba(31, 38, 135, 0.15)',
            border: ismobile ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(8px)',
            minHeight: ismobile ? '87vh' : istablet ? '14px' : '80vh',
            justifyContent: ismobile ? 'flex-start' : 'center',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: ismobile ? 1 : 2, mt: ismobile ? 2 : 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              src={logo}
              alt="WordMaster Logo"
              style={{
                height: ismobile ? '48px' : istablet ? '70px' : '80px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography sx={{ 
            ...pixelHeading,
            fontSize: ismobile ? '13px' : istablet ? '16px' : '18px',
            color: '#5F4B8B',
            textAlign: 'center',
            mb: ismobile ? 0.5 : 1,
            letterSpacing: ismobile ? '0.5px' : '1px'
          }}>
            WORDMASTER
          </Typography>

          {/* Heading */}
          <Typography sx={{ 
            fontSize: ismobile ? '10px' : istablet ? '13px' : '16px',
            color: '#4a5568',
            textAlign: 'center',
            mb: ismobile ? 2 : 4,
            fontWeight: 500
          }}>
            Ready to start your adventure?
          </Typography>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: ismobile ? 2 : 3, ...pixelText }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleRegularLogin}
            sx={{
              mt: ismobile ? 0 : 2,
              width: '100%',
              maxWidth: ismobile ? '95vw' : '100%',
              px: ismobile ? 1 : 0,
            }}
          >
            {/* Email Input */}
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                style: {
                  // fontFamily removed
                  fontSize: ismobile ? '12px' : istablet ? '14px' : '15px'
                }
              }}
              InputLabelProps={{
                style: {
                  // fontFamily removed
                  fontSize: ismobile ? '12px' : istablet ? '14px' : '15px'
                }
              }}
              sx={{
                mb: ismobile ? 1 : 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: ismobile ? '6px' : '8px',
                  background: ismobile ? 'rgba(255,255,255,0.95)' : undefined,
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
              }}
            />

            {/* Password Input */}
            <TextField
              label="Password"
              type={passwordVisible ? "text" : "password"}
              fullWidth
              margin="normal"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    edge="end"
                    sx={{ color: '#5F4B8B' }}
                  >
                    {passwordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
                style: {
                  // fontFamily removed
                  fontSize: ismobile ? '12px' : istablet ? '14px' : '15px'
                }
              }}
              InputLabelProps={{
                style: {
                  // fontFamily removed
                  fontSize: ismobile ? '12px' : istablet ? '14px' : '15px'
                }
              }}
              sx={{
                mb: ismobile ? 1 : 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: ismobile ? '6px' : '8px',
                  background: ismobile ? 'rgba(255,255,255,0.95)' : undefined,
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
              }}
            />

            {/* Login Button */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                color: 'white',
                borderRadius: ismobile ? '6px' : istablet ? '10px' : '12px',
                py: ismobile ? 1 : istablet ? 1.2 : 1.5,
                mb: ismobile ? 1.5 : 2,
                fontSize: ismobile ? '9px' : istablet ? '10px' : '11px',
                boxShadow: ismobile ? '0 2px 8px rgba(95, 75, 139, 0.10)' : undefined,
                '&:hover': {
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(95, 75, 139, 0.3)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#a0a0a0'
                }
              }}
            >
              {loading ? <CircularProgress size={ismobile ? 14 : istablet ? 16 : 20} color="inherit" /> : 'LOGIN'}
            </Button>

            {/* OR Divider */}
            <Divider sx={{
              my: ismobile ? 2 : 3,
              '&::before, &::after': { borderColor: '#5F4B8B' }
            }}>
              <Typography sx={{
                ...pixelText,
                color: '#5F4B8B',
                px: 1,
                fontSize: ismobile ? '9px' : '10px'
              }}>
                OR
              </Typography>
            </Divider>

            {/* Microsoft Login Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              startIcon={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#5F4B8B"
                >
                  <path d="M7.462 0H0v7.19h7.462zM16 0H8.538v7.19H16zM7.462 8.211H0V16h7.462zm8.538 0H8.538V16H16z" />
                </svg>
              }
              sx={{
                ...pixelButton,
                boxShadow: ismobile ? '0 2px 8px rgba(95, 75, 139, 0.10)' : '0 8px 32px rgba(31, 38, 135, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                color: '#5F4B8B',
                borderColor: '#5F4B8B',
                borderRadius: ismobile ? '6px' : istablet ? '10px' : '12px',
                py: ismobile ? 1 : istablet ? 1.2 : 1.5,
                fontSize: ismobile ? '8px' : istablet ? '10px' : '11px',
                '&:hover': {
                  backgroundColor: 'rgba(38, 23, 71, 0.1)',
                  borderColor: '#4a3a6d',
                  color: '#4a3a6d'
                },
                '&.Mui-disabled': {
                  borderColor: '#e0e0e0',
                  color: '#a0a0a0'
                }
              }}
            >
              SIGN IN WITH MICROSOFT
            </Button>

            {/* Signup Link */}
            <Typography sx={{
              mt: ismobile ? 2 : 3,
              textAlign: 'center',
              ...pixelText,
              color: '#3e2c85',
              fontSize: ismobile ? '8px' : '9px',
              '& a': {
                color: '#251a51',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }
            }}>
              Don't have an account? <Link to="/register">Sign up</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;