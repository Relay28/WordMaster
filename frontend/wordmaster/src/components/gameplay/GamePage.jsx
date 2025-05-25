import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, CircularProgress, Button, 
  Paper, Alert, FormControl, InputLabel, Select, MenuItem,
  useMediaQuery, useTheme, IconButton
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Class, School, PersonOutline } from "@mui/icons-material";
import { useUserAuth } from '../context/UserAuthContext';
import GameCore from './GameCore';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import API_URL from '../../services/apiConfig';

const GamePage = ({
  // content
}) => {
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // New state for classroom/content selection
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [step, setStep] = useState(1); // 1: select classroom, 2: select content

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '12px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };


  // Fetch user's classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const token = await getToken();   
        const response = await fetch(`${API_URL}/api/classrooms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch classrooms');
        }
        
        const data = await response.json();
        setClassrooms(data);
      } catch (err) {
        console.error('Error fetching classrooms:', err);
        setError(err.message || 'Failed to load classrooms');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassrooms();
  }, [getToken]);

  // Fetch published content when classroom is selected
  useEffect(() => {
    if (!selectedClassroom) return;

    const fetchPublishedContent = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const response = await fetch(`${API_URL}/api/content/classroom/${selectedClassroom}/published`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch published content');
        }
        
        const data = await response.json();
        setContents(data);
        setStep(2); // Move to content selection step
      } catch (err) {
        console.error('Error fetching published content:', err);
        setError(err.message || 'Failed to load published content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPublishedContent();
  }, [selectedClassroom, getToken]);

  const handleClassroomChange = (event) => {
    setSelectedClassroom(event.target.value);
  };

  const handleContentChange = (event) => {
    setSelectedContent(event.target.value);
  };

  const handleJoinGame = async () => {
  if (!selectedContent) {
    setError('Please select content first');
    return;
  }

  try {
    setLoading(true);
    const token = await getToken();
    const response = await fetch(`${API_URL}/api/waiting-room/content/${selectedContent}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to join game: ${response.status}`);
    }

    // Assuming the backend returns the waiting room ID in the response
    // const data = await response.json();
    navigate(`/waiting-room/${selectedContent}`);
    
  } catch (err) {
    console.error('Error joining game:', err);
    setError(err.message || 'Failed to join game session');
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: 2,
      backdropFilter: 'blur(2px)'
    }}>
      {/* Back Button */}
      <IconButton 
        onClick={() => step === 1 ? navigate('/homepage') : setStep(1)}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: '#5F4B8B',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          border: '2px solid #5F4B8B',
          borderRadius: '4px',
          width: '32px',
          height: '32px',
          '&:hover': {
            backgroundColor: 'rgba(95, 75, 139, 0.1)',
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <Container maxWidth="md">
        <Paper elevation={3} sx={{ 
          p: isMobile ? 2 : 4, 
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
            opacity: 0.8
          }
        }}>
          <Typography variant="h5" sx={{ 
            ...pixelHeading,
            fontWeight: 'bold', 
            mb: 3,
            color: '#2d3748',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            {step === 1 ? 'SELECT CLASSROOM' : 'SELECT CONTENT'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ 
              mb: 3,
              '& .MuiAlert-message': pixelText
            }}>
              {error}
            </Alert>
          )}
          
          {step === 1 ? (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={pixelText}>Select Classroom</InputLabel>
              <Select
                value={selectedClassroom}
                onChange={handleClassroomChange}
                label="Select Classroom"
                sx={{
                  '& .MuiSelect-select': {
                    ...pixelText,
                    py: isMobile ? 1 : 1.5
                  }
                }}
              >
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <MenuItem key={classroom.id} value={classroom.id} sx={pixelText}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <School sx={{ 
                          color: '#5F4B8B', 
                          mr: 1,
                          fontSize: isMobile ? '16px' : '20px'
                        }} />
                        {classroom.name}
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled sx={pixelText}>
                    {loading ? 'Loading classrooms...' : 'No classrooms available'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={pixelText}>Select Content</InputLabel>
              <Select
                value={selectedContent}
                onChange={handleContentChange}
                label="Select Content"
                sx={{
                  '& .MuiSelect-select': {
                    ...pixelText,
                    py: isMobile ? 1 : 1.5
                  }
                }}
              >
                {contents.length > 0 ? (
                  contents.map((content) => (
                    <MenuItem key={content.id} value={content.id} sx={pixelText}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Class sx={{ 
                          color: '#5F4B8B', 
                          mr: 1,
                          fontSize: isMobile ? '16px' : '20px'
                        }} />
                        {content.title}
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled sx={pixelText}>
                    {loading ? 'Loading content...' : 'No content available'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
          
          <Box display="flex" justifyContent="space-between" flexDirection={isMobile ? 'column' : 'row'} gap={2}>
            <Button 
              variant="contained"
              onClick={() => step === 1 ? navigate('/homepage') : setStep(1)}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4px',
                px: 3,
                py: isMobile ? 1 : 1.5,
                minWidth: isMobile ? '100%' : 'auto',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
                order: isMobile ? 2 : 1
              }}
            >
              {step === 1 ? 'CANCEL' : 'BACK'}
            </Button>
            
            {step === 2 && (
              <Button 
                variant="contained" 
                onClick={handleJoinGame} 
                disabled={loading || !selectedContent}
                sx={{
                  ...pixelButton,
                  backgroundColor: '#6c63ff',
                  '&:hover': { 
                    backgroundColor: '#5a52e0',
                    transform: 'translateY(-2px)'
                  },
                  borderRadius: '4px',
                  px: 3,
                  py: isMobile ? 1 : 1.5,
                  minWidth: isMobile ? '100%' : 'auto',
                  borderStyle: 'outset',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                  transition: 'all 0.1s ease',
                  '&:active': {
                    transform: 'translateY(1px)',
                    boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                    borderStyle: 'inset'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#a0a0a0',
                    borderStyle: 'none',
                    boxShadow: 'none'
                  },
                  order: 1
                }}
              >
                {loading ? (
                  <CircularProgress 
                    size={24} 
                    sx={{ 
                      color: 'inherit',
                      filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                    }} 
                  />
                ) : (
                  'JOIN GAME SESSION'
                )}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default GamePage;