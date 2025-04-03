import React, { useState } from 'react';
import "../css/UserProfile.css"; // Adjusted path
import ProfilePicture from '../assets/ProfilePicturePlaceholder.jpg'; 

const UserProfileContainer = () => {
  const [currentView, setCurrentView] = useState('view'); // 'view', 'edit', or 'deactivate'

  return (
    <div className="user-profile-container">
      <div className="header">
        <button className="back-button">&lt;</button>
        <span className="profile-title">Profile</span>
        <button className="deactivate-button">Deactivate</button>
      </div>

      <div className="profile-picture-container">
        <img src={ProfilePicture} alt="Profile" className="profile-picture" />
        <button className="camera-icon">📷</button>
      </div>

      <div className="personal-info-container">
        <div className="personal-info">
          <h2>Personal Information</h2>
          <hr></hr>
          <div className="input-section">
            <div className="name-inputs">
              First Name<br></br>
              <input type="text" placeholder=" " /><br></br><br></br>
              Email<br></br>
              <input type="email" placeholder="" />
            </div>
            <div className="email-password">
              Last Name<br></br>
              <input type="text" placeholder=" " /><br></br><br></br>
              Change Password<br></br>
              <input type="password" placeholder="" />
            </div>
          </div>
          <button className="update-btn">Update Changes</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileContainer;
