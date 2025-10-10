import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, CircularProgress, Button, 
  Paper, Alert, FormControl, Select, MenuItem,
  useMediaQuery, useTheme
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import apiConfig from '../../services/apiConfig';
import { sanitizePlainText } from '../../utils/sanitize';

const CreateGameSession = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

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

  // Fetch available content
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication token not available');
        }

        console.log('Fetching published content...');
        console.log('Using API URL:', apiConfig.API_URL);

        // Check if there's a pre-selected content from URL params
        const params = new URLSearchParams(location.search);
        const contentId = params.get('contentId');
        if (contentId) {
          setSelectedContent(contentId);
        }

        const response = await fetch(`${apiConfig.API_URL}/api/content/published`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched content:', data);
        
        // Ensure data is an array
        const contentArray = Array.isArray(data) ? data : [];
        setContents(contentArray);
        
        if (contentArray.length === 0) {
          setError('No published content available. Please create and publish content first.');
        }
        
      } catch (err) {
        console.error('Content fetch error:', err);
        setError(err.message || 'Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContents();
  }, [getToken, location.search]);

  const handleContentChange = (event) => {
    setSelectedContent(event.target.value);
    setError(null); // Clear any previous errors
  };

  const handleCreateSession = async () => {
    if (!selectedContent) {
      setError('Please select content first');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }

      console.log('Creating session for content:', selectedContent);

      const response = await fetch(`${apiConfig.API_URL}/api/waiting-room/content/${selectedContent}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to join game: ${response.status}`);
      }

      // Navigate to waiting room
      navigate(`/waiting-room/${selectedContent}`);
      
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.message || 'Failed to create game session');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#5F4B8B', mb: 2 }} />
          <Typography sx={pixelText}>Loading content...</Typography>
        </Paper>
      </Box>
    );
  }

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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: 2
    }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.9)',
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
            fontSize: '16px'
          }}>
            CREATE NEW GAME SESSION
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ 
              mb: 3,
              '& .MuiAlert-message': pixelText
            }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <Select
                value={selectedContent}
                onChange={handleContentChange}
                sx={{
                  minWidth: 0,
                  transition: 'width 0.2s ease',
                  '& .MuiSelect-select': {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    py: 1.5,
                    minHeight: 'auto',
                    width: '100%',
                    boxSizing: 'border-box'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: '8px'
                  }
                }}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Typography sx={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        color: '#999',
                        padding: '8px',
                      }}>
                        Select Content
                      </Typography>
                    );
                  }
                  const selectedItem = contents.find(content => content.id === selected);
                  return selectedItem ? sanitizePlainText(selectedItem.title) : '';
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxWidth: '100%',
                      width: 'auto'
                    }
                  }
                }}
              >
                {contents.length > 0 ? (
                  contents.map((content) => (
                    <MenuItem 
                      key={content.id} 
                      value={content.id} 
                      sx={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        minHeight: 'auto',
                        py: 1
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        width: '100%',
                        overflow: 'hidden'
                      }}>
                        <Typography sx={{
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {sanitizePlainText(content.title)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem 
                    disabled 
                    sx={{
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '14px',
                      minHeight: 'auto'
                    }}
                  >
                    No content available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          
          <Box display="flex" justifyContent="space-between" flexDirection="row" gap={2}>
            <Button 
              variant="contained"
              onClick={() => navigate('/homepage')}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4px',
                px: 3,
                py: 1.5,
                minWidth: 'auto',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                height: 'auto',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                }
              }}
            >
              BACK TO HOME
            </Button>
            
            <Button 
              variant="contained"
              onClick={handleCreateSession}
              disabled={creating || !selectedContent}
              sx={{
                ...pixelButton,
                backgroundColor: '#6c63ff',
                '&:hover': { 
                  backgroundColor: '#5a52e0',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4px',
                px: 3,
                py: 1.5,
                minWidth: 'auto',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                height: 'auto',
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
                }
              }}
            >
              {creating ? (
                <CircularProgress 
                  size={24}
                  sx={{ 
                    color: 'inherit',
                    filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                  }} 
                />
              ) : (
                'CREATE SESSION'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateGameSession;