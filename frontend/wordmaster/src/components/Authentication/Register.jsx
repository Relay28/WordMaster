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


const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const theme = useTheme();

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
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
        ? `${API_URL}/api/auth/register/student`
        : `${API_URL}/api/auth/register/teacher`;
      
      const response = await axios.post(endpoint, formData);
      
      setSuccess("Registration successful! Redirecting to OTP verification...");
      await axios.post(`${API_URL}/api/auth/send-otp`, { email: formData.email });
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
    px: 4, // Horizontal padding
    py: 4, // Vertical padding - more appropriate value
    my: 2, // Reduced vertical margin
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(8px)',
    minHeight: 'auto', // Changed from 93vh to auto
  }}>

          {/* Logo */}
          <Box sx={{ mb: 2, mt: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <img
              src={logo}
              alt="WordMaster Logo"
              style={{
                height: '80px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography sx={{ 
            ...pixelHeading,
            fontSize: '13px',
            color: '#5F4B8B',
            textAlign: 'center',
            mb: 1,
            letterSpacing: '1px'
          }}>
            WORDMASTER
          </Typography>

          {/* Heading */}
          <Typography sx={{ 
            fontSize: '13px',
            color: '#4a5568',
            textAlign: 'center',
            mb: 2,
            fontWeight: 500
          }}>
            Ready to start your adventure?
          </Typography>

          {/* Role Selection */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1, 
            mb: 3,
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
                borderRadius: '12px',
                py: 1.5,
                fontSize: '11px',
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
                borderRadius: '12px',
                py: 1.5,
                fontSize: '11px',
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
  <Alert 
    severity="error" 
    sx={{ 
      mb: 3, 
      '& .MuiAlert-message': {
        fontSize: '11px',
        fontFamily: '"Press Start 2P", cursive',
        lineHeight: '1.4',
        letterSpacing: '0.5px'
      },
      '& .MuiAlert-icon': {
        fontSize: '18px'
      }
    }}
  >
    {error}
  </Alert>
)}
{success && (
  <Alert 
    severity="success" 
    sx={{ 
      mb: 3,
      '& .MuiAlert-message': {
        fontSize: '11px',
        fontFamily: '"Press Start 2P", cursive',
        lineHeight: '1.4',
        letterSpacing: '0.5px'
      },
      '& .MuiAlert-icon': {
        fontSize: '18px'
      }
    }}
  >
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
                 fontSize: '12px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: '12px'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.95)',
                  height: '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                  transform: 'translate(15px, 13px) scale(1.2)',
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(15px, -6px) scale(0.80)'
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
                  fontSize: '12px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: '12px'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.95)',
                  height: '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                transform: 'translate(15px, 13px) scale(1.2)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(15px, -6px) scale(0.80)'
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
                 fontSize: '12px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: '12px'
                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.95)',
                  height: '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                transform: 'translate(15px, 13px) scale(1.2)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(15px, -6px) scale(0.80)'
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
                 fontSize: '12px'
                }
              }}
              InputLabelProps={{
                style: {
                  fontSize: '12px'

                }
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.95)',
                  height: '50px',
                  '& fieldset': {
                    borderColor: '#5F4B8B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#5F4B8B',
                  },
                },
                '& .MuiInputLabel-outlined': {
                transform: 'translate(15px, 13px) scale(1.2)',
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(15px, -6px) scale(0.80)'
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
                borderRadius: '12px',
                py: 1.5,
                mt: 2,
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
              fontSize: '9px',
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

