import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AIContentGenerator = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get classroom ID from URL query parameters if it exists
  const queryParams = new URLSearchParams(location.search);
  const classroomId = queryParams.get('classroomId');

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
        classroomId: classroomId || null // Include the classroom ID if available
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
      console.log('Generated content:', content);
      
      // If content was generated for a classroom, redirect to classroom page
      if (classroomId) {
        navigate(`/classroom/${classroomId}`, {
          state: {
            message: 'Content generated successfully',
            success: true,
            refreshOnReturn: true // Add this line
          }
        });
      } else {
        // Otherwise go to the content dashboard
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
      backgroundColor: '#f9f9f9'
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2,
        px: { xs: 2, md: 6 }
      }}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" color="#5F4B8B">
            {classroomId ? 'Generate Content for Classroom' : 'Generate AI Content'}
          </Typography>
        </Box>
      </Box>
      
      {/* Content */}
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2, flex: 1 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Generate AI Content
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
          />
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleGenerateContent}
            disabled={loading}
            sx={{
              bgcolor: '#5F4B8B',
              py: 1.5,
              '&:hover': { bgcolor: '#4a3a6d' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate AI Content'}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default AIContentGenerator;
