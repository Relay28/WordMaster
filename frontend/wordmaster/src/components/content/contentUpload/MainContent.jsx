// MainContent.jsx
import React from 'react';
import { Container, Alert, Paper, Box, Divider } from '@mui/material';
import ScenarioDetailsForm from './forms/ScenarioDetailsForm';
import GroupSettingsForm from './forms/GroupSettingsForm';
import GameSettingsForm from './forms/GameSettingsForm';
import WordBankForm from './forms/WordBankForm';
import BackgroundImageForm from './forms/BackgroundImageForm';

const MainContent = ({
  error,
  formData,
  handleInputChange,
  scenarioSettings,
  setScenarioSettings,
  handleScenarioSettingChange,
  imagePreview,
  setImagePreview,
  handleSubmit
}) => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: 'calc(100vh - 64px)', // Adjust based on your header height
        overflow: 'auto',
        width:'100vw',
        backgroundColor: '#f5f5f5'
      }}
    >
      <Container maxWidth="md" sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Scenario Details Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
              <ScenarioDetailsForm 
                formData={formData}
                handleInputChange={handleInputChange}
              />
            </Box>
          </Paper>
          
          {/* Group Settings Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
              <GroupSettingsForm 
                scenarioSettings={scenarioSettings}
                setScenarioSettings={setScenarioSettings}
                handleScenarioSettingChange={handleScenarioSettingChange}
              />
            </Box>
          </Paper>
          
          {/* Game Settings Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
              <GameSettingsForm 
                scenarioSettings={scenarioSettings}
                handleScenarioSettingChange={handleScenarioSettingChange}
              />
            </Box>
          </Paper>
          
          {/* Word Bank Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
              <WordBankForm 
                scenarioSettings={scenarioSettings}
                setScenarioSettings={setScenarioSettings}
              />
            </Box>
          </Paper>
          
          {/* Background Image Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
              <BackgroundImageForm 
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
              />
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
};

export default MainContent;