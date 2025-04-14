// ContentUpload.jsx - Main component
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, CircularProgress, Alert, IconButton, Typography } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useUserAuth } from '../../context/UserAuthContext';
import contentService from '../../../services/contentService';

// Import sub-components
import ScenarioDetailsForm from './forms/ScenarioDetailsForm';
import GroupSettingsForm from './forms/GroupSettingsForm';
import GameSettingsForm from './forms/GameSettingsForm';
import WordBankForm from './forms/WordBankForm';
import BackgroundImageForm from './forms/BackgroundImageForm';
import PageHeader from './PageHeader';
import MainContent from './MainContent';
const ContentUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getToken } = useUserAuth();
  
  // Get classroom ID from URL query parameters if it exists
  const queryParams = new URLSearchParams(location.search);
  const classroomId = queryParams.get('classroomId');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    backgroundTheme: 'default',
    published: false
  });
  
  // Specific scenario settings
  const [scenarioSettings, setScenarioSettings] = useState({
    studentsPerGroup: 5,
    roles: [],
    timePerTurn: 30,
    wordBank: [],
    turnCycles: 3,
  });
  
  // Background image handling
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle input changes for main form
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'published' ? checked : value
    });
  };

  // Handle changes for scenario settings
  const handleScenarioSettingChange = (e) => {
    const { name, value } = e.target;
    setScenarioSettings({
      ...scenarioSettings,
      [name]: value
    });
  };

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    
    if (scenarioSettings.roles.length === 0) {
      setError("Please add at least one role");
      return false;
    }
    
    return true;
  };

  // Prepare data for submission
  const prepareContentData = () => {
    return JSON.stringify({
      wordBank: scenarioSettings.wordBank,
      roles: scenarioSettings.roles,
      backgroundImage: imagePreview
    });
  };

  const prepareGameConfig = () => {
    return JSON.stringify({
      studentsPerGroup: scenarioSettings.studentsPerGroup,
      timePerTurn: scenarioSettings.timePerTurn,
      turnCycles: scenarioSettings.turnCycles
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const dataToSubmit = { 
        ...formData,
        contentData: prepareContentData(),
        gameElementConfig: prepareGameConfig()
      };
      
      // If classroomId exists, create content for that classroom
      if (classroomId) {
        await contentService.createContentForClassroom(
          dataToSubmit, user.id, classroomId, token
        );
        navigate(`/classroom/${classroomId}`, { 
          state: { 
            message: `Content "${formData.title}" created successfully.`,
            success: true
          }
        });
      } else {
        // Otherwise create content normally
        await contentService.createContent(
          dataToSubmit, user.id, token
        );
        navigate('/content/dashboard', { 
          state: { 
            message: `Content "${formData.title}" created successfully.`,
            success: true
          }
        });
      }
      
    } catch (err) {
      console.error("Error creating content:", err);
      setError("Failed to create content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel/back navigation
  const handleCancel = () => {
    if (classroomId) {
      navigate(`/classroom/${classroomId}`);
    } else {
      navigate('/content/dashboard');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
    }}>
      {/* Header */}
      <PageHeader 
        title={classroomId ? "Create Classroom Content" : "Create New Content"}
        loading={loading}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />

      {/* Main Content */}
      <MainContent
        error={error}
        formData={formData}
        handleInputChange={handleInputChange}
        scenarioSettings={scenarioSettings}
        setScenarioSettings={setScenarioSettings}
        handleScenarioSettingChange={handleScenarioSettingChange}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
};

export default ContentUpload;