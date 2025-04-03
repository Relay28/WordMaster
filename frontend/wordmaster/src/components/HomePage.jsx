import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/HomePage.css';
import logo from '../assets/WOMS.png'; 
import profileIcon from '../assets/ProfilePicturePlaceholder.jpg'; 
import { logout, getCurrentUser } from '../utils/authUtils';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const HomePage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [userRole, setUserRole] = useState('STUDENT');
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Set user data directly from the utility function
    setUserRole(user.role || 'STUDENT');
    setUserName(`${user.fname || ''} ${user.lname || ''}`);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login?logout=true');
  };

  return (
    <div className="homepage-container">
      <div className="homepage-header">
        <img src={logo} alt="Logo" className="logo" />
        
        <div className="header-right">
          <span className="role-indicator">{userRole}</span> 
          <img src={profileIcon} alt="Profile" className="profile-icon" />
          <button 
            onClick={handleLogout}
            className="logout-btn"
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="classes-container">
        <h2 className="your-classes">Your Classes</h2>
        {/* Modal */}
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        + Join Class
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Join Class
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <p>Enter the code that was given to you by your teacher</p>
          <TextField
            fullWidth
            variant="outlined"
            label="Enter Code"
            // value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="success" fullWidth>
            Join Class
          </Button>
        </DialogActions>
      </Dialog>
      </div>

      <div className="class-cards-container">
        <div className="class-card">Class 1</div>
        <div className="class-card">Class 2</div>
        <div className="class-card">Class 3</div>
      </div>
    </div>
  );
};

export default HomePage;
