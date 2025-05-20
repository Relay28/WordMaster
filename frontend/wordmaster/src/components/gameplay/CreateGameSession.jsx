import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, Button, 
  Paper, CircularProgress, Alert, 
  FormControl, InputLabel, Select, MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import { useLocation } from 'react-router-dom';
import { Class, PersonOutline } from "@mui/icons-material";
import picbg from '../../assets/picbg.png';

const CreateGameSession = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

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
      setCreating(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const contentIdValue = parseInt(selectedContent, 10);

      const response = await fetch(`${apiUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contentId: contentIdValue })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      if (!response.ok) {
        const errorMsg = data && data.error ? data.error : `Failed to create session: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (!data || !data.id) {
        throw new Error('Malformed session response from server');
      }

      navigate(`/game/${data.id}`);
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err.message || 'Failed to create game session. Please try again.');
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
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        backdropFilter: 'blur(2px)'
      }}>
        <CircularProgress />
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
      p: 2,
      backdropFilter: 'blur(2px)'
    }}>
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
                <MenuItem disabled sx={pixelText}>No content available</MenuItem>
              )}
            </Select>
          </FormControl>
          
          <Box display="flex" justifyContent="space-between" flexDirection={isMobile ? 'column' : 'row'} gap={2}>
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
              {creating ? (
                <CircularProgress 
                  size={24} 
                  sx={{ 
                    color: 'inherit',
                    filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                  }} 
                />
              ) : (
                'CREATE GAME SESSION'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateGameSession;