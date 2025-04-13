import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/HomePage.css';
import logo from '../assets/WOMS.png'; 
import profileIcon from '../assets/ProfilePicturePlaceholder.jpg'; 
import { logout, getCurrentUser } from '../utils/authUtils';

const HomePage = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('STUDENT');
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Set user data directly from the utility function
    setUserRole(user.role || 'USER_STUDENT');
    setUserName(`${user.fname || ''} ${user.lname || ''}`);
    
    // Set profile picture if available
    if (user.profilePicture) {
      setProfilePicture(user.profilePicture);
    }
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
          <img 
            src={profilePicture || profileIcon} 
            alt="Profile" 
            className="profile-icon" 
          />
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
        <button className="join-classes-btn">+ Join Class</button>
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