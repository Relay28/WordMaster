import React, { useState } from "react";
import {
  TextField,
  Button,
  IconButton,
  Typography,
  Container,
  Box,
  Divider,
  Alert,
  useMediaQuery,
    useTheme
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import logo from '../../assets/LOGO.png';


const API_BASE_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '10px' : isTablet ? '12px' : '13px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '7px' : isTablet ? '8px' : '9px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

 const [formData, setFormData] = useState({
  email: "",
  password: "",
  fname: "",
  lname: ""
});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Add this after the existing useState declarations
const [role, setRole] = useState('student'); // default to student
  const navigate = useNavigate();

  // Regex for validating email
  const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format. Please enter a valid email.");
      return;
    }

    try {
      const endpoint = role === 'student' 
        ? `${API_BASE_URL}/auth/register/student`
        : `${API_BASE_URL}/auth/register/teacher`;
      
      const response = await axios.post(endpoint, formData);
      
      setSuccess("Registration successful! Redirecting to OTP verification...");
      await axios.post(`${API_BASE_URL}/auth/send-otp`, { email: formData.email });
      setTimeout(() => navigate("/verify", { state: { email: formData.email } }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
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
      p: isMobile ? 1.5 : 0,
      my: isMobile ? 0 : 4,
      width: '100%',
      maxWidth: isMobile ? '100vw' : isTablet ? '420px' : '500px',
      backgroundColor: isMobile
        ? 'rgba(255,255,255,0.85)'
        : 'rgba(255, 255, 255, 0.92)',
      borderRadius: isMobile ? '0px' : isTablet ? '14px' : '16px',
      boxShadow: isMobile ? 'none' : '0 8px 32px rgba(31, 38, 135, 0.15)',
      border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(8px)',
      minHeight: isMobile ? '100vh' : isTablet ? '90vh' : '93vh',
      justifyContent: isMobile ? 'flex-start' : 'center',
    }}>

          {/* Logo */}
          <Box sx={{ mb: isMobile ? 1 : 2, mt: isMobile ? 2 : 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              src={logo}
              alt="WordMaster Logo"
              style={{
                height: isMobile ? '48px' : isTablet ? '70px' : '80px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography sx={{ 
            ...pixelHeading,
            fontSize: isMobile ? '13px' : isTablet ? '16px' : '18px',
            color: '#5F4B8B',
            textAlign: 'center',
            mb: isMobile ? 0.5 : 1,
            letterSpacing: isMobile ? '0.5px' : '1px'
          }}>
            WORDMASTER
          </Typography>

          {/* Heading */}
          <Typography sx={{ 
            fontSize: isMobile ? '10px' : isTablet ? '13px' : '16px',
            color: '#4a5568',
            textAlign: 'center',
            mb: isMobile ? 2 : 4,
            fontWeight: 500
          }}>
            Ready to start your adventure?
          </Typography>

          {/* Role Selection */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1, 
            mb: isMobile ? 1 : 3,
            width: '100%',
          }}>
            <Button
              fullWidth
              variant={role === 'student' ? 'contained' : 'outlined'}
              onClick={() => setRole('student')}
              sx={{
                ...pixelButton,
                backgroundColor: role === 'student' ? '#5F4B8B' : 'transparent',
                color: role === 'student' ? 'white' : '#5F4B8B',
                borderColor: '#5F4B8B',
                borderRadius: isMobile ? '6px' : isTablet ? '10px' : '12px',
                py: isMobile ? 1 : isTablet ? 1.2 : 1.5,
                fontSize: isMobile ? '9px' : isTablet ? '10px' : '11px',
                '&:hover': {
                  backgroundColor: role === 'student' ? '#4a3a6d' : 'rgba(95, 75, 139, 0.1)',
                }
              }}
            >
              STUDENT
            </Button>
            <Button
              fullWidth
              variant={role === 'teacher' ? 'contained' : 'outlined'}
              onClick={() => setRole('teacher')}
              sx={{
                ...pixelButton,
                backgroundColor: role === 'teacher' ? '#5F4B8B' : 'transparent',
                color: role === 'teacher' ? 'white' : '#5F4B8B',
                borderColor: '#5F4B8B',
                borderRadius: isMobile ? '6px' : isTablet ? '10px' : '12px',
                py: isMobile ? 1 : isTablet ? 1.2 : 1.5,
                fontSize: isMobile ? '9px' : isTablet ? '10px' : '11px',
                '&:hover': {
                  backgroundColor: role === 'teacher' ? '#4a3a6d' : 'rgba(95, 75, 139, 0.1)',
                }
              }}
            >
              TEACHER
            </Button>
          </Box>

          {/* Error/Success messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, ...pixelText }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, ...pixelText }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{width: '100%' }}>
            {/* First Name Input */}
            <TextField
              label="First Name"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                style: {
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              sx={{
                mb: isMobile ? 1 : 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '6px' : '8px',
                  background: isMobile ? 'rgba(255,255,255,0.95)' : undefined,
                  height: isMobile ? '40px' : '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                  transform: 'translate(14px, 12px) scale(1)',
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)'
                  }
                }
              }}
            />

            {/* Last Name Input */}
            <TextField
              label="Last Name"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                style: {
                 fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              sx={{
                mb: isMobile ? 1 : 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '6px' : '8px',
                  background: isMobile ? 'rgba(255,255,255,0.95)' : undefined,
                  height: isMobile ? '40px' : '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                transform: 'translate(14px, 12px) scale(1)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)'
                }}
              }}
            />

            {/* Email Input */}
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                style: {
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              sx={{
                mb: isMobile ? 1 : 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '6px' : '8px',
                  background: isMobile ? 'rgba(255,255,255,0.95)' : undefined,
                  height: isMobile ? '40px' : '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                transform: 'translate(14px, 12px) scale(1)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)'
                }}
              }}
            />

            {/* Password Input */}
            <TextField
              label="Password"
              name="password"
              type={passwordVisible ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
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
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: isMobile ? '12px' : isTablet ? '14px' : '15px'

                }
              }}
              sx={{
                mb: isMobile ? 1 : 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '6px' : '8px',
                  background: isMobile ? 'rgba(255,255,255,0.95)' : undefined,
                  height: isMobile ? '40px' : '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                transform: 'translate(14px, 12px) scale(1)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)'
                }}
              }}
            />

            {/* Register Button */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                color: 'white',
                borderRadius: isMobile ? '6px' : isTablet ? '10px' : '12px',
                py: isMobile ? 1 : isTablet ? 1.2 : 1.5,
                mt: 2,
                mb: 2,
                fontSize: isMobile ? '9px' : isTablet ? '10px' : '11px',
                boxShadow: isMobile ? '0 2px 8px rgba(95, 75, 139, 0.10)' : undefined,
                '&:hover': {
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(95, 75, 139, 0.3)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              REGISTER
            </Button>

            {/* Login Link */}
            <Typography sx={{ 
              mt: 0.5,
              textAlign: 'center',
              ...pixelText,
              color: '#3e2c85',
              fontSize: isMobile ? '8px' : '9px',
              '& a': {
                color: '#251a51',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }
            }}>
              Have an account? <Link to="/login">Login</Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;

