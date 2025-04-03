import React, { useState } from 'react';
import { TextField, Button, IconButton, Typography, Container, Box, Divider } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "../css/register.css";
// import msLogo from "../assets/microsoft.svg";
import {Link } from "react-router-dom";


const Register = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="register-container">
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
            Sign up to dive into endless possibilities!
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

          {/* Register Button */}
          <Button variant="contained" fullWidth className="register-button"  >
            Register
          </Button>

          {/* OR Divider */}
          <Divider className="divider" sx={{ marginTop: '10px'}}>
            <Typography className="or-text" color="gray">OR</Typography>
          </Divider>


          {/* Signup Link */}
          <Typography className="login-text" sx={{ marginTop: '30px', fontSize: '10px'}}>
            Have an account? <Link to="/login">Login</Link>
          </Typography>
        </Container>
        
      </div>
   
    </div>
  );
};

export default Register;