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
import picbg from '../assets/picbg.png';
import '@fontsource/press-start-2p';
import logo from '../assets/LOGO.png';

const Register = () => {
  const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
    const pixelText = {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: isMobile ? '8px' : '10px',
      lineHeight: '1.5',
      letterSpacing: '0.5px'
    };
  
    const pixelHeading = {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: isMobile ? '12px' : '14px',
      lineHeight: '1.5',
      letterSpacing: '1px'
    };
  
    const pixelButton = {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: isMobile ? '8px' : '10px',
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
        ? "http://localhost:8080/api/auth/register/student"
        : "http://localhost:8080/api/auth/register/teacher";
      
      const response = await axios.post(endpoint, formData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
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
      p: isMobile ? 3 : 4,
      my: 4,
      width: '100%',
      maxWidth: '500px',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(8px)',
    }}>

          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <img
              src={logo}
              alt="WordMaster Logo"
              style={{
                height: isMobile ? '60px' : '80px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography sx={{ 
            ...pixelHeading,
            fontSize: isMobile ? '18px' : '24px',
            color: '#5F4B8B',
            textAlign: 'center',
            mb: 1
          }}>
            WORDMASTER
          </Typography>

          {/* Heading */}
          <Typography sx={{ 
            fontSize: isMobile ? '12px' : '14px',
            color: '#4a5568',
            textAlign: 'center',
            mb: 4,
            fontSize: isMobile ? '20px' : '22px',
          }}>
            Ready to start your adventure?
          </Typography>

          {/* Role Selection */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1, 
            mb: 3,
            width: '100%'
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
                borderRadius: '8px',
                py: 1,
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
                borderRadius: '8px',
                py: 1,
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

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
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
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
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
                borderRadius: '8px',
                py: 1.5,
                mt: 2,
                mb: 2,
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

