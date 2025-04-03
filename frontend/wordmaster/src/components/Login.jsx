import React, { useState } from 'react';
import { TextField, Button, IconButton, Typography, Container, Box, Divider } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "../css/login.css";
// import msLogo from "../assets/microsoft.svg";


const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

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
            Log in or sign up to dive into endless possibilities!
          </Typography>

          {/* Email Input */}
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            variant="outlined"
            className="input-field"
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
            />
            <IconButton
              className="visibility-icon"
              onClick={() => setPasswordVisible(!passwordVisible)}
              style={{
                position: 'absolute',
                right: '10px', // Adjust as needed
                top: '55%',
                transform: 'translateY(-50%)', // Vertically center the icon
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
          <Button variant="contained" fullWidth className="login-button"  >
            Login
          </Button>

          {/* OR Divider */}
          <Divider className="divider" sx={{ marginTop: '10px'}}>
            <Typography className="or-text" color="gray">OR</Typography>
          </Divider>

          {/* Microsoft Sign-In Button */}
          <Box display="flex" justifyContent="center" mt={2}>
  <Button variant="outlined" className="social-button" sx={{fontSize: "12px" }}>
    <svg
      className="social-icon"
      width="20"
      height="20"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="#5F4B8B" // Purple-blue color
    >
      <path d="M7.462 0H0v7.19h7.462zM16 0H8.538v7.19H16zM7.462 8.211H0V16h7.462zm8.538 0H8.538V16H16z" />
    </svg>
    Sign in with Microsoft
  </Button>
</Box>




          {/* Signup Link */}
          <Typography className="register-text" sx={{ marginTop: '30px', fontSize: '10px'}}>
            Don’t have an account? <a href="#">Signup</a>
          </Typography>
        </Container>
        
      </div>
   
    </div>
  );
};

export default Login;