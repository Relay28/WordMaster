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
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/register.css";

const Register = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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
      const response = await axios.post("http://localhost:8080/api/auth/register", formData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    }
  };

  return (
    <div className="register-container">
      <div className="image-section"></div>

      <div className="form-section">
        <Container maxWidth="xs" className="form-wrapper" sx={{ padding: "20px" }}>
          <Typography variant="h4" className="logo-text" sx={{ padding: "10px" }}>
            WordMaster
          </Typography>

          <Typography variant="h5" className="main-heading" sx={{ paddingTop: "10px" }}>
            Ready to start?
          </Typography>
          <Typography variant="body2" className="sub-text" sx={{ paddingBottom: "20px" }}>
            Sign up to dive into endless possibilities!
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              className="input-field"
              required
            />

            <Box position="relative" width="100%">
              <TextField
                label="Password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                variant="outlined"
                className="input-field"
                required
              />
              <IconButton
                className="visibility-icon"
                onClick={() => setPasswordVisible(!passwordVisible)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "55%",
                  transform: "translateY(-50%)",
                }}
              >
                {passwordVisible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Box>

            <Typography align="right" className="forgot-password" sx={{ paddingBottom: "30px", fontSize: "10px" }}>
              Forgot Password?
            </Typography>

            <Button type="submit" variant="contained" fullWidth className="register-button">
              Register
            </Button>
          </form>

          <Divider className="divider" sx={{ marginTop: "10px" }}>
            <Typography className="or-text" color="gray">
              OR
            </Typography>
          </Divider>

          <Typography className="login-text" sx={{ marginTop: "30px", fontSize: "10px" }}>
            Have an account? <Link to="/login">Login</Link>
          </Typography>
        </Container>
      </div>
    </div>
  );
};

export default Register;
