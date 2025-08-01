import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, Button, 
  Paper, CircularProgress, Alert, 
  FormControl, Select, MenuItem,
  useTheme, useMediaQuery, IconButton
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import { useLocation } from 'react-router-dom';
import { Class, PersonOutline } from "@mui/icons-material";
import picbg from '../../assets/picbg.png';
import API_URL from '../../services/apiConfig';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const CreateGameSession = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '6px' : isTablet ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '10px' : isTablet ? '12px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '6px' : isTablet ? '8px' : '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  // Fetch available content - functionality remains exactly the same
  useEffect(() => {
    const fetchContents = async () => {
      try {
        const token = await getToken();
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        console.log('Using API URL:', apiUrl);

        const params = new URLSearchParams(location.search);
        const contentId = params.get('contentId');
        if (contentId) {
          setSelectedContent(contentId);
        }

        const response = await fetch(`${apiUrl}/api/content/published`, {
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
        setContents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Content fetch error:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContents();
  }, [getToken, location.search]);

  // Handle content selection - functionality remains the same
  const handleContentChange = (event) => {
    setSelectedContent(event.target.value);
  };

  // Create game session - functionality remains the same
  const handleCreateSession = async () => {
  
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
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: isMobile ? 1 : 2,
        backdropFilter: 'blur(2px)'
      }}>
        <CircularProgress size={isMobile ? 20 : 40} />
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
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: isMobile ? 1 : 2,
      backdropFilter: 'blur(2px)'
    }}>
      {/* Back Button */}
      <IconButton 
        onClick={() => navigate('/homepage')}
        sx={{
          position: 'absolute',
          top: isMobile ? 4 : 8,
          left: isMobile ? 4 : 8,
          color: '#5F4B8B',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          border: '2px solid #5F4B8B',
          borderRadius: '4px',
          width: isMobile ? '24px' : '32px',
          height: isMobile ? '24px' : '32px',
          '&:hover': {
            backgroundColor: 'rgba(95, 75, 139, 0.1)',
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <ChevronLeftIcon fontSize={isMobile ? "small" : "medium"} />
      </IconButton>
      
      <Container maxWidth={isMobile ? "sm" : "md"}>
        <Paper elevation={3} sx={{ 
          p: isMobile ? 1.5 : 4, 
          borderRadius: isMobile ? '8px' : '12px',
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
            height: isMobile ? '4px' : '6px',
            background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
            opacity: 0.8
          }
        }}>
          <Typography variant="h5" sx={{ 
            ...pixelHeading,
            fontWeight: 'bold', 
            mb: isMobile ? 2 : isTablet ? 2.5 : 3,
            color: '#2d3748',
            fontSize: isMobile ? '10px' : isTablet ? '13px' : '16px'
          }}>
            CREATE NEW GAME SESSION
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ 
              mb: isMobile ? 2 : 3,
              '& .MuiAlert-message': pixelText
            }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: isMobile ? 1 : 3 }}>
            
            <FormControl fullWidth>
              <Select
                value={selectedContent}
                onChange={handleContentChange}
                sx={{
                  minWidth: 0,
                  transition: 'width 0.2s ease',
                  '& .MuiSelect-select': {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: isMobile ? '10px' : isTablet ? '12px' : '14px',
                    py: isMobile ? 0.75 : isTablet ? 1 : 1.5,
                    minHeight: isMobile ? '20px' : isTablet ? '28px' : 'auto',
                    width: '100%',
                    boxSizing: 'border-box'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderRadius: isMobile ? '4px' : isTablet ? '6px' : '8px'
                  },
                  '& .MuiSelect-icon': {
                    right: '8px'
                  }
                }}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Typography sx={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: isMobile ? '10px' : isTablet ? '12px' : '14px',
                        color: '#999',
                        padding: isMobile ? '4px' : isTablet ? '6px' : '8px',
                      }}>
                        Select Content
                      </Typography>
                    );
                  }
                  const selectedItem = contents.find(content => content.id === selected);
                  return selectedItem ? selectedItem.title : '';
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
                        fontSize: isMobile ? '12px' : isTablet ? '13px' : '14px',
                        minHeight: 'auto',
                        py: isMobile ? 0.5 : isTablet ? 0.75 : 1
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        width: '100%',
                        overflow: 'hidden'
                      }}>
                        <Class sx={{ 
                          color: '#5F4B8B', 
                          mr: isMobile ? 0.5 : isTablet ? 0.75 : 1,
                          fontSize: isMobile ? '12px' : isTablet ? '16px' : '20px',
                          flexShrink: 0
                        }} />
                        <Typography sx={{
                          fontFamily: 'Arial, sans-serif',
                          fontSize: isMobile ? '12px' : isTablet ? '13px' : '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {content.title}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem 
                    disabled 
                    sx={{
                      fontFamily: 'Arial, sans-serif',
                      fontSize: isMobile ? '12px' : isTablet ? '13px' : '14px',
                      minHeight: 'auto'
                    }}
                  >
                    No content available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          
          <Box display="flex" justifyContent="space-between" flexDirection="row" gap={isMobile ? 1 : isTablet ? 1.5 : 2}>
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
                px: isMobile ? 1.5 : isTablet ? 2 : 3,
                py: isMobile ? 0.5 : isTablet ? 1 : 1.5,
                minWidth: isMobile ? 'auto' : 'auto',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                height: isMobile ? '28px' : isTablet ? '32px' : 'auto',
                flex: isMobile ? '0 0 auto' : 'none',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                }
              }}
            >
              CANCEL
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
                px: isMobile ? 1.5 : isTablet ? 2 : 3,
                py: isMobile ? 0.5 : isTablet ? 1 : 1.5,
                minWidth: isMobile ? 'auto' : 'auto',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                height: isMobile ? '28px' : isTablet ? '32px' : 'auto',
                flex: isMobile ? '0 0 auto' : 'none',
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
                  size={isMobile ? 16 : isTablet ? 20 : 24} 
                  sx={{ 
                    color: 'inherit',
                    filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                  }} 
                />
              ) : (
                isMobile ? 'CREATE GAME SESSION' : 'CREATE GAME SESSION'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateGameSession;