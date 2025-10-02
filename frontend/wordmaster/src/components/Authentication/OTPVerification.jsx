import React, { useState, useEffect } from 'react';
import { 
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { logout, isLoggedIn } from '../../utils/authUtils';
import { useUserAuth } from '../context/UserAuthContext';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import logo from '../../assets/LOGO.png';

const API_URL = import.meta.env.VITE_API_URL;

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    // Get email from location state or query params
    const params = new URLSearchParams(location.search);
    const locationEmail = location.state?.email || params.get('email');
    
    if (!locationEmail) {
      navigate('/login');
    } else {
      setEmail(locationEmail);
    }

    // Start countdown for resend OTP
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus to next input
      if (value && index < 5) {
        document.getElementById(`otp-input-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
  e.preventDefault();
  const otpCode = otp.join('');
  if (otpCode.length !== 6) {
    setError('Please enter a 6-digit OTP code');
    setSuccess('');
    return;
  }
  setLoading(true);
  setError('');
  setSuccess('');
  try {
    const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
      email,
      otp: otpCode
    });
    setSuccess('Email successfully verified! Redirecting to login...');
    setError('');
    setTimeout(() => navigate('/login'), 2000); // Redirect after showing success
  } catch (err) {
    console.error('OTP verification error:', err);
    setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    setSuccess('');
  } finally {
    setLoading(false);
  }
};

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']); // Clear OTP field   
    setResendDisabled(true);
    setCountdown(30); // Reset countdown
    
    try {
      
        await axios.post(`${API_URL}/api/auth/resend-otp`, { email });
        setSuccess('New OTP sent successfully!');
        
        // Start countdown again
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    } catch (err) {
        console.error('Resend OTP error:', err);
        setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
        setResendDisabled(false);
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
          rgba(249, 249, 249, 10) 0%, 
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
        <Container maxWidth="sm" sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
          my: 0,
          width: '100%',
          maxWidth: '100vw',
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          minHeight: '80vh',
          justifyContent: 'center',
        }}>

          {/* Logo */}
          <Box sx={{ mb: 2, mt: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              src={logo}
              alt="WordMaster Logo"
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography sx={{ 
            ...pixelHeading,
            fontSize: '13px',
            color: '#020102ff',
            textAlign: 'center',
            mb: 1,
            letterSpacing: '1px'
          }}>
            OTP VERIFICATION
          </Typography>

          {/* Heading */}
          <Typography sx={{ 
            fontSize: '13px',
            color: '#4a5568',
            textAlign: 'center',
            mb: 2,
            fontWeight: 500
          }}>
            Enter the 6-digit code sent to {email}
          </Typography>

         {success && (
            <Alert severity="success" sx={{ mb: 3, ...pixelText }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3, ...pixelText }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleVerify} sx={{ mt: 2, width: '100%' }}>
            {/* OTP Input Fields */}
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              mb: 4,
            }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '24px',
                      padding: '12px'
                    }
                  }}
                  sx={{
                    width: '70px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.95)',
                      '& fieldset': {
                        borderColor: '#5F4B8B',
                      },
                      '&:hover fieldset': {
                        borderColor: '#5F4B8B',
                      },
                    },
                  }}
                />
              ))}
            </Box>

            {/* Verify Button */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                color: 'white',
                borderRadius: '12px',
                py: 1.5,
                mb: 2,
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(95, 75, 139, 0.10)',
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
              {loading ? <CircularProgress size={14} color="inherit" /> : 'VERIFY'}
            </Button>

            {/* Resend OTP */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography sx={{ 
                ...pixelText,
                color: '#5F4B8B',
                mb: 1,
                fontSize: '9px'
              }}>
                Didn't receive the code?
                <Button
                variant="text"
                onClick={handleResendOTP}
                disabled={resendDisabled || loading}
                sx={{
                  ...pixelButton,
                  color: '#5F4B8B',
                  fontSize: '9px',
                  textDecoration: resendDisabled ? 'none' : 'underline',
                  textDecorationColor: '#5F4B8B', // Optional: set underline color
                  minWidth: 'unset',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline'
                  },
                  '&.Mui-disabled': {
                    color: '#a0a0a0'
                  }
                }}
              >
                {resendDisabled ? `Resend in ${countdown}s` : 'RESEND OTP'}
              </Button>
              </Typography>
            </Box>

            {/* Back to Login Link */}
            <Typography sx={{ 
              mt: 3,
              textAlign: 'center',
              ...pixelText,
              color: '#3e2c85',
              fontSize: '9px',
              '& a': {
                color: '#251a51',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }
            }}>
              <Link to="/login">Back to Login</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default OTPVerification;