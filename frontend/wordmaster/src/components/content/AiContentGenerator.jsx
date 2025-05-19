import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';

const AIContentGenerator = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      
      const response = await fetch(`${API_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate content');
      }
      
      const content = await response.json();
      console.log('Generated content:', content);
      
      // Navigate to create game session with the new content ID
      navigate(`/game/create?contentId=${content.id}`);
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
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
  );
};

export default AIContentGenerator;