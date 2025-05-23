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
  Divider,
} from '@mui/material';
import ScenarioDetailsForm from './forms/ScenarioDetailsForm';
import GroupSettingsForm from './forms/GroupSettingsForm';
import GameSettingsForm from './forms/GameSettingsForm';
import WordBankForm from './forms/WordBankForm';
import BackgroundImageForm from './forms/BackgroundImageForm';
import picbg from '../../../assets/picbg.png';

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
  
    if (activeStep === 0) {
      if (!formData.title?.trim()) {
        errors.title = 'Scenario Title is required';
        isValid = false;
      }
      if (!formData.description?.trim()) {
        errors.description = 'Description is required';
        isValid = false;
      }
      if (!formData.backgroundTheme) {
        errors.backgroundTheme = 'Background theme is required';
        isValid = false;
      }
    }
    
    if (activeStep === 1) {
      if (!scenarioSettings.studentsPerGroup || scenarioSettings.studentsPerGroup < 2) {
        errors.studentsPerGroup = 'Group size must be at least 2';
        isValid = false;
      }
      if (!scenarioSettings.roles || scenarioSettings.roles.length < 2) {
        errors.roles = 'Add at least 2 roles';
        isValid = false;
      }
    }
    
    if (activeStep === 3) {
      if (!scenarioSettings.wordBank || scenarioSettings.wordBank.length < 3) {
        errors.wordBank = 'At least 3 words are required';
        isValid = false;
      }
    }
  
    setStepErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setStepErrors({});
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setStepErrors({});
  };

  const getStepContent = (step) => {
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

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflow: 'hidden',
              background: `
                linear-gradient(to bottom, 
                  rgba(249, 249, 249, 10) 0%, 
                  rgba(249, 249, 249, 10) 40%, 
                  rgba(249, 249, 249, 0.1) 100%),
                url(${picbg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              imageRendering: 'pixelated',
      }}
    >
      <Box sx={{ 
            flex: 1,
            width: '100%',
            overflow: 'auto',
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(95, 75, 139, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#5F4B8B',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: '#4a3a6d',
              },
            },
          }}>
      <Container maxWidth="xl">
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              backgroundColor: '#ffebee',
              color: '#d32f2f',
              ...pixelText
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
                  <Typography variant="subtitle2" sx={{ ...pixelText, color: '#5F4B8B' }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Paper sx={{ 
            p: 4, 
            mb: 4,
            borderRadius: '16px',
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            '&::before': {
              content: '""',
              position: 'absolute',
              borderRadius: '6px',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
              opacity: 0.8
            }
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                mb: 3,
                color: '#5F4B8B',
                ...pixelHeading
              }}
            >
              {steps[activeStep]}
            </Typography>

            <Divider sx={{ my: 3 }} />
            
            {getStepContent(activeStep)}
            
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                sx={{
                  ...pixelButton,
                  color: '#5F4B8B',
                  borderColor: '#5F4B8B',
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  borderStyle: 'outset',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(95, 75, 139, 0.08)',
                    borderColor: '#5F4B8B',
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                    boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                    borderStyle: 'inset'
                  },
                  '&.Mui-disabled': {
                    color: '#a0a0a0',
                    borderColor: '#e0e0e0'
                  }
                }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  sx={{
                    ...pixelButton,
                    backgroundColor: '#5F4B8B',
                    color: '#fff',
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                    borderStyle: 'outset',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: '#4a3a6f',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                      borderStyle: 'inset'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#a0a0a0'
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
                    ...pixelButton,
                    backgroundColor: '#5F4B8B',
                    color: '#fff',
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                    borderStyle: 'outset',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: '#4a3a6f',
                      transform: 'translateY(-2px)'
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: '2px 2px 0px rgba(0,0,0,0.1)',
                      borderStyle: 'inset'
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
    </Box>
  );
};

export default MainContent;

