import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Container
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const AIContentGenerator = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const queryParams = new URLSearchParams(location.search);
  const classroomId = queryParams.get('classroomId');
  const isMobile = window.innerWidth < 768;

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

  const handleGenerateContent = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const payload = { 
        topic,
        classroomId: classroomId || null
      };
      
      const response = await fetch(`${API_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const content = await response.json();
      
      if (classroomId) {
        navigate(`/classroom/${classroomId}`, {
          state: {
            message: 'Content generated successfully',
            success: true,
            refreshOnReturn: true
          }
        });
      } else {
        navigate('/content/dashboard', {
          state: {
            message: 'Content generated successfully',
            success: true
          }
        });
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
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
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2.5,
        px: { xs: 2, md: 6 }
      }}>
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={() => navigate('/homepage')}
            sx={{
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
          <Typography sx={{ 
            ...pixelHeading,
            color: '#5F4B8B',
            fontSize: isMobile ? '14px' : '16px',
            marginLeft: '20px',
            marginTop: '4px',
          }}>
            {classroomId ? 'GENERATE CONTENT FOR CLASSROOM' : 'GENERATE AI CONTENT'}
          </Typography>
        </Box>
      </Box>
      
      {/* Main Content - Centered */}
      <Container maxWidth="md" sx={{ 
        py: 4, 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        
      }}>
        <Paper 
          elevation={0} 
          sx={{ 
            marginTop: '-80px',
            p: 5, 
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
              opacity: 0.8
            },
          }}
        >
          <Typography 
            sx={{ 
              ...pixelHeading,
              color: '#5F4B8B',
              fontSize: isMobile ? '14px' : '16px',
              mb: 3,
              textAlign: 'center'
            }}
          >
            GENERATE AI CONTENT
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': pixelText
              }}
            >
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Business Communication, World History, Climate Change"
            sx={{ mb: 3 }}
            InputProps={{ style: pixelText }}
            InputLabelProps={{ style: pixelText }}
          />
          
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              onClick={handleCancel}
              sx={{
                ...pixelText,
                background: 'linear-gradient(135deg, #ff5252, #e53935)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(229, 57, 53, 0.2)',
                textTransform: 'none',
                fontSize: isMobile ? '8px' : '10px',
                fontWeight: 150,
                height: isMobile ? '32px' : '40px',
                flex: 1,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #e53935, #c62828)',
                  boxShadow: '0 6px 8px rgba(229, 57, 53, 0.3)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 4px rgba(229, 57, 53, 0.3)'
                },
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
                  transform: 'rotate(45deg)',
                  transition: 'all 0.5s ease'
                },
                '&:hover::after': {
                  left: '100%'
                }
              }}
            >
              CANCEL
            </Button>
            
            <Button
              variant="contained"
              onClick={handleGenerateContent}
              disabled={loading}
              sx={{
                ...pixelText,
                background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)',
                textTransform: 'none',
                fontSize: isMobile ? '8px' : '10px',
                fontWeight: 150,
                height: isMobile ? '32px' : '40px',
                flex: 2,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
                  boxShadow: '0 6px 8px rgba(95, 75, 139, 0.3)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 4px rgba(95, 75, 139, 0.3)'
                },
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
                  transform: 'rotate(45deg)',
                  transition: 'all 0.5s ease'
                },
                '&:hover::after': {
                  left: '100%'
                }
              }}
            >
              {loading ? (
                <CircularProgress 
                  size={24} 
                  color="inherit" 
                  thickness={4}
                  sx={{ color: 'white' }}
                />
              ) : (
                'GENERATE AI CONTENT'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AIContentGenerator;