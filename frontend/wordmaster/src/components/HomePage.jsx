import React from 'react';
import '../css/HomePage.css';
import logo from '../assets/WOMS.png'; 
import profileIcon from '../assets/ProfilePicturePlaceholder.jpg'; 

const HomePage = () => {
  return (
    <div className="homepage-container">

      <div className="homepage-header">
        <img src={logo} alt="Logo" className="logo" />
        
        <div className="header-right">
          <span className="role-indicator">STUDENT</span> 
          <img src={profileIcon} alt="Profile" className="profile-icon" />
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
