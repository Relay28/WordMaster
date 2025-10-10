import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, CircularProgress, Button, 
  Paper, Alert, FormControl, InputLabel, Select, MenuItem,
  useMediaQuery, useTheme, IconButton,
  Divider
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Class, School, PersonOutline } from "@mui/icons-material";
import { useUserAuth } from '../context/UserAuthContext';
import GameCore from './GameCore';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import apiConfig from '../../services/apiConfig'; // Import API configuration
import { sanitizePlainText } from '../../utils/sanitize';

const GamePage = ({
  // content
}) => {
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  // Removed responsive design variable
  
  // State for classroom/content selection
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');

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


  // Fetch user's classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true);
        const token = await getToken();   
        const response = await fetch(`${apiConfig.API_URL}/api/classrooms`, {
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
    if (!selectedClassroom) {
      // Clear content selection when classroom changes
      setContents([]);
      setSelectedContent('');
      return;
    }

    const fetchPublishedContent = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        const response = await fetch(`${apiConfig.API_URL}/api/content/classroom/${selectedClassroom}/published`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch published content');
        }
        
        const data = await response.json();
        setContents(data);
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
    const response = await fetch(`${apiConfig.API_URL}/api/waiting-room/content/${selectedContent}/join`, {
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
        onClick={() => navigate('/homepage')}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: '#5F4B8B',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          border: '2px solid #5F4B8B',
          borderRadius: '4px',
          width: '32px',
          height: '32px',
          boxShadow: '0 2px 4px rgba(95, 75, 139, 0.15)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(95, 75, 139, 0.2)',
            color: '#6c63ff'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <Container maxWidth="md">
        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 10px 32px rgba(31, 38, 135, 0.15), 0 4px 8px rgba(95, 75, 139, 0.1)',
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
            opacity: 0.85,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }
        }}>
          <Typography variant="h5" sx={{ 
            ...pixelHeading,
            fontWeight: 'bold', 
            mb: 3,
            color: '#2d3748',
            fontSize: '16px',
            textShadow: '1px 1px 0px rgba(95, 75, 139, 0.2)',
            letterSpacing: '1.5px'
          }}>
            GAME SESSION
          </Typography>
          <Divider sx={{ 
            mb: 3, 
            background: 'linear-gradient(90deg, rgba(95, 75, 139, 0.2) 0%, rgba(108, 99, 255, 0.4) 50%, rgba(95, 75, 139, 0.2) 100%)', 
            height: '2px',
            borderRadius: '1px',
            opacity: 0.8
          }} />
          
          {error && (
            <Alert severity="error" sx={{ 
              mb: 3,
              '& .MuiAlert-message': pixelText
            }}>
              {error}
            </Alert>
          )}
          
          {/* Classroom Selection */}
          <Typography sx={{
            ...pixelText,
            fontWeight: 'bold',
            mb: 2,
            color: '#4a3a6d',
            textShadow: '0.5px 0.5px 0px rgba(95, 75, 139, 0.2)',
            letterSpacing: '1px'
          }}>
            SELECT CLASSROOM
          </Typography>
          <FormControl fullWidth sx={{ mb: 5 }}>
            <Select
              value={selectedClassroom}
              onChange={handleClassroomChange}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{...pixelText, opacity: 0.5}}>Select a classroom</span>;
                }
                const match = classrooms.find(c => c.id === selected);
                return match ? sanitizePlainText(match.name) : '';
              }}
              sx={{
                '& .MuiSelect-select': {
                  ...pixelText,
                  py: 2
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: '2px solid rgba(95, 75, 139, 0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(95, 75, 139, 0.4)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.07)'
                },
                '&.Mui-focused': {
                  borderColor: '#5F4B8B',
                  boxShadow: '0 0 0 2px rgba(95, 75, 139, 0.2)'
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
                        fontSize:'20px'
                      }} />
                      {sanitizePlainText(classroom.name)}
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

          {/* Content Selection - Only enabled if classroom is selected */}
          <Typography sx={{
            ...pixelText,
            fontWeight: 'bold',
            mb: 2,
            color: '#4a3a6d',
            opacity: selectedClassroom ? 1 : 0.6,
            textShadow: '0.5px 0.5px 0px rgba(95, 75, 139, 0.2)',
            letterSpacing: '1px'
          }}>
            SELECT CONTENT
          </Typography>
          <FormControl fullWidth sx={{ mb: 3 }} disabled={!selectedClassroom || loading}>
            <Select
              value={selectedContent}
              onChange={handleContentChange}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{...pixelText, opacity: 0.5}}>Select a content</span>;
                }
                const match = contents.find(c => c.id === selected);
                return match ? sanitizePlainText(match.title) : '';
              }}
              sx={{
                '& .MuiSelect-select': {
                  ...pixelText,
                  py: 2
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: '2px solid rgba(95, 75, 139, 0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(95, 75, 139, 0.4)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.07)'
                },
                '&.Mui-focused': {
                  borderColor: '#5F4B8B',
                  boxShadow: '0 0 0 2px rgba(95, 75, 139, 0.2)'
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
                        fontSize: '20px'
                      }} />
                      {sanitizePlainText(content.title)}
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled sx={pixelText}>
                  {loading && selectedClassroom ? 'Loading content...' : 'No content available'}
                </MenuItem>
              )}
            </Select>
          </FormControl>
          
          <Box display="flex" justifyContent="space-between" flexDirection="row" gap={2}>
            <Button 
              variant="contained"
              onClick={() => navigate('/homepage')}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)',
                  boxShadow: '4px 6px 0px rgba(0,0,0,0.35), 0 0 10px rgba(95, 75, 139, 0.2)'
                },
                borderRadius: '6px',
                px: 3,
                py: 1.5,
                minWidth: 'auto',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3), 0 0 5px rgba(95, 75, 139, 0.1)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.15s ease-in-out',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
                order: 1
              }}
            >
              CANCEL
            </Button>
            
            <Button 
              variant="contained" 
              onClick={handleJoinGame} 
              disabled={loading || !selectedContent}
              sx={{
                  ...pixelButton,
                  backgroundColor: '#6c63ff',
                  '&:hover': { 
                    backgroundColor: '#5a52e0',
                    transform: 'translateY(-2px)',
                    boxShadow: '4px 6px 0px rgba(0,0,0,0.35), 0 0 10px rgba(95, 75, 139, 0.2)'
                  },
                  borderRadius: '6px',
                  px: 3,
                  py: 1.5,
                  minWidth: 'auto',
                  borderStyle: 'outset',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.3), 0 0 5px rgba(95, 75, 139, 0.1)',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                  transition: 'all 0.15s ease-in-out',
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
            
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default GamePage;