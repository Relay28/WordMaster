import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Container, Button, 
  Paper, CircularProgress, Alert, 
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import { useLocation } from 'react-router-dom';

const CreateGameSession = () => {
  const { getToken } = useUserAuth();
  const navigate = useNavigate();
  
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  // Fetch available content
  useEffect(() => {
    const fetchContents = async () => {
      try {
        const token = await getToken();
        
        // Default to localhost if not defined
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        console.log('Using API URL:', apiUrl);

        // Parse content ID from URL if present
        const params = new URLSearchParams(location.search);
        const contentId = params.get('contentId');
        if (contentId) {
          setSelectedContent(contentId);
        }

        // Use the complete path to the endpoint
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

  // Handle content selection
  const handleContentChange = (event) => {
    setSelectedContent(event.target.value);
  };

  // Create game session
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: '12px' }}>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Create New Game Session
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Content</InputLabel>
          <Select
            value={selectedContent}
            onChange={handleContentChange}
            label="Select Content"
          >
            {contents.length > 0 ? (
              contents.map((content) => (
                <MenuItem key={content.id} value={content.id}>
                  {content.title}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No content available</MenuItem>
            )}
          </Select>
        </FormControl>
        
        <Box display="flex" justifyContent="space-between">
          <Button 
            variant="outlined" 
            onClick={() => navigate('/homepage')}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateSession}
            disabled={creating || !selectedContent}
            sx={{
              backgroundColor: '#6c63ff',
              '&:hover': { backgroundColor: '#5a52e0' }
            }}
          >
            {creating ? <CircularProgress size={24} /> : 'Create Game Session'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateGameSession;