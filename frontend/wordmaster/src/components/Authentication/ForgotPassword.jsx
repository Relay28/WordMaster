import React, { useState } from 'react';
import { 
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import logo from '../../assets/LOGO.png';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  // State for email method
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPasswordEmail, setNewPasswordEmail] = useState('');
  const [confirmPasswordEmail, setConfirmPasswordEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [showNewPasswordEmail, setShowNewPasswordEmail] = useState(false);
  const [showConfirmPasswordEmail, setShowConfirmPasswordEmail] = useState(false);
  
  // Common states
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '7px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '7px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  // Handlers for email method
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccess('Reset code sent to your email!');
      setCodeSent(true);
    } catch (err) {
      console.error('Send reset code error:', err);
      setError(err.response?.data?.message || 'Failed to send reset code. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithCode = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!resetCode || !newPasswordEmail || !confirmPasswordEmail) {
      setError('All fields are required');
      return;
    }
    
    if (newPasswordEmail !== confirmPasswordEmail) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPasswordEmail.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        code: resetCode,
        newPassword: newPasswordEmail
      });
      
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please check your reset code.');
    } finally {
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
          rgba(249, 249, 249, 0.9) 0%, 
          rgba(249, 249, 249, 0.8) 40%, 
          rgba(249, 249, 249, 0.7) 100%),
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
      }}>
        <Container 
          maxWidth="xs" 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Logo and Icon */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img
              src={logo}
              alt="WordMaster Logo"
              style={{
                height: '50px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography sx={{ 
            ...pixelHeading,
            fontSize: '18px',
            color: '#5F4B8B',
            textAlign: 'center',
            mb: 3,
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            RESET PASSWORD
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3, width: '100%', ...pixelText }}>
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%', ...pixelText }}>
              {error}
            </Alert>
          )}

          {/* Email Method */}
          {!codeSent && (
            <Box component="form" onSubmit={handleSendResetCode} sx={{ width: '100%' }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ 
                  color: '#666',
                  fontSize: '12px',
                  fontWeight: 500,
                  mb: 0.5
                }}>
                  Email Address *
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#5F4B8B',
                      },
                      '&:hover fieldset': {
                        borderColor: '#5F4B8B',
                      },
                    }
                  }}
                />
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  backgroundColor: '#5F4B8B',
                  color: 'white',
                  borderRadius: '8px',
                  py: 1.5,
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  '&:hover': {
                    backgroundColor: '#4a3a6d',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#a0a0a0'
                  }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'SEND RESET CODE'}
              </Button>
            </Box>
          )}
          
          {/* Code Verification and New Password */}
          {codeSent && (
            <Box component="form" onSubmit={handleResetWithCode} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="reset-code"
                label="Reset Code"
                name="reset-code"
                autoComplete="off"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#5F4B8B',
                    },
                    '&:hover fieldset': {
                      borderColor: '#5F4B8B',
                    },
                  }
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="new-password-email"
                label="New Password"
                name="new-password-email"
                type={showNewPasswordEmail ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPasswordEmail}
                onChange={(e) => setNewPasswordEmail(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPasswordEmail(!showNewPasswordEmail)}
                        edge="end"
                      >
                        {showNewPasswordEmail ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#5F4B8B',
                    },
                    '&:hover fieldset': {
                      borderColor: '#5F4B8B',
                    },
                  }
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="confirm-password-email"
                label="Confirm New Password"
                name="confirm-password-email"
                type={showConfirmPasswordEmail ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPasswordEmail}
                onChange={(e) => setConfirmPasswordEmail(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPasswordEmail(!showConfirmPasswordEmail)}
                        edge="end"
                      >
                        {showConfirmPasswordEmail ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#5F4B8B',
                    },
                    '&:hover fieldset': {
                      borderColor: '#5F4B8B',
                    },
                  }
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  backgroundColor: '#5F4B8B',
                  color: 'white',
                  borderRadius: '8px',
                  py: 1.5,
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  '&:hover': {
                    backgroundColor: '#4a3a6d',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#a0a0a0'
                  }
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'RESET PASSWORD'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  onClick={() => {
                    setCodeSent(false);
                    setSuccess('');
                    setError('');
                  }}
                  sx={{
                    color: '#5F4B8B',
                    textDecoration: 'underline',
                    fontSize: '12px',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Resend Code
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Back to Login Link */}
          <Box sx={{ width: '100%', textAlign: 'center', mt: 3 }}>
            <Link
              to="/login"
              style={{
                color: '#5F4B8B',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              Back to Login
            </Link>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default ForgotPassword;