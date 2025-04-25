// MainContent.jsx
import React, { useState } from 'react';
import { 
  Container, 
  Alert, 
  Paper, 
  Box, 
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Stack,
} from '@mui/material';
import ScenarioDetailsForm from './forms/ScenarioDetailsForm';
import GroupSettingsForm from './forms/GroupSettingsForm';
import GameSettingsForm from './forms/GameSettingsForm';
import WordBankForm from './forms/WordBankForm';
import BackgroundImageForm from './forms/BackgroundImageForm';

const steps = [
  'Scenario Details',
  'Group Settings',
  'Game Settings',
  'Word Bank',
  'Background'
];

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
  const [activeStep, setActiveStep] = useState(0);
  const [stepErrors, setStepErrors] = useState({});
  
  const validateCurrentStep = () => {
    const errors = {};
    let isValid = true;
  
    // Step 0: Scenario Details Validation
    if (activeStep === 0) {
      if (!formData.title?.trim()) {
        errors.title = 'Scenario Title is required';
        isValid = false;
      }
      if (!formData.description?.trim()) {
        errors.description = 'Description is required';
        isValid = false;
      }
    }
    
    // Step 1: Group Settings Validation
    if (activeStep === 1) {
      if (!scenarioSettings.studentsPerGroup || scenarioSettings.studentsPerGroup < 1) {
        errors.studentsPerGroup = 'Valid group size is required';
        isValid = false;
      }
      if (!scenarioSettings.roles || scenarioSettings.roles.length < 3) {
        errors.roles = 'Add at least 3 roles';
        isValid = false;
      }
    }
    
    // Step 3: Word Bank Validation
    if (activeStep === 3) {
      if (!scenarioSettings.wordBank || scenarioSettings.wordBank.length < 5) {
        errors.wordBank = 'At least 5 words are required';
        isValid = false;
      }
    }
  
    setStepErrors(errors);
    return isValid;
  };

  
  const handleNext = () => {
    if (validateCurrentStep()) {
      console.log("Current scenarioSettings:", scenarioSettings);
      console.log("CURRENTSTEP+"+activeStep)
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setStepErrors({}); // Clear errors when moving to next step
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setStepErrors({}); // Clear errors when going back
  };
console.log(scenarioSettings)
  const getStepContent = (step) => {
    console.log("STEP"+ step)
    switch (step) {
      case 0:
        return (
          <ScenarioDetailsForm 
            formData={formData}
            handleInputChange={handleInputChange}
            errors={stepErrors}
          />
        );
      case 1:
        return (
          <GroupSettingsForm 
            scenarioSettings={scenarioSettings}
            setScenarioSettings={setScenarioSettings}
            handleScenarioSettingChange={handleScenarioSettingChange}
            errors={stepErrors}
          />
        );
      case 2:
        return (
          <GameSettingsForm 
            scenarioSettings={scenarioSettings}
            handleScenarioSettingChange={handleScenarioSettingChange}
            errors={stepErrors}
          />
        );
      case 3:
        return (
          <WordBankForm 
            scenarioSettings={scenarioSettings}
            setScenarioSettings={setScenarioSettings}
            errors={stepErrors}
          />
        );
      case 4:
        return (
          <BackgroundImageForm 
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
          />
        );
      default:
        throw new Error('Unknown step');
    }
  };

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: 'calc(100vh - 64px)',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              backgroundColor: '#ffebee',
              color: '#d32f2f'
            }}
          >
            {error}
          </Alert>
        )}
        
        <form>
          <Stepper 
            activeStep={activeStep}
            sx={{ 
              mb: 4,
              px: 2,
              py: 3,
              backgroundColor: 'transparent',
              '& .MuiStepIcon-root.Mui-completed': {
                color: '#5F4B8B',
              },
              '& .MuiStepIcon-root.Mui-active': {
                color: '#5F4B8B',
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '& .MuiStepIcon-text': {
                        fill: '#fff',
                      },
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#5F4B8B' }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Paper sx={{ 
            p: 4, 
            mb: 4,
            borderRadius: 2,
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                mb: 3,
                color: '#5F4B8B',
                fontWeight: 600 
              }}
            >
              {steps[activeStep]}
            </Typography>
            
            {getStepContent(activeStep)}
            
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                sx={{
                  color: '#5F4B8B',
                  borderColor: '#5F4B8B',
                  '&:hover': {
                    backgroundColor: 'rgba(95, 75, 139, 0.08)',
                    borderColor: '#5F4B8B'
                  }
                }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  sx={{
                    backgroundColor: '#5F4B8B',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#4a3a6f'
                    }
                  }}
                  disabled
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  type="button"
                  sx={{
                    backgroundColor: '#5F4B8B',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#4a3a6f'
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </Stack>
          </Paper>
        </form>
      </Container>
    </Box>
  );
};

export default MainContent;