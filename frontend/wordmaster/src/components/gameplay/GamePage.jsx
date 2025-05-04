import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Container, CircularProgress, Button, Paper, TextField } from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import GameCore from './GameCore';
import WaitingRoom from './WaitingRoom';
import GamePlay from './GamePlay';
import GameResults from './GameResults';

const GamePage = () => {
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [sessionId, setSessionId] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check for session ID in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const sid = params.get('sessionId');
    if (sid) {
      setSessionId(sid);
    }
  }, [search]);
  
  // Join a game session with code
  const handleJoinGame = async () => {
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      // Fix: Change this URL format to match the backend endpoint
      const response = await fetch(`${API_URL}/api/sessions/${sessionCode}/join-by-code`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Invalid session code or unable to join game');
      }
      
      const data = await response.json();
      navigate(`/game/${data.id}`);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Invalid session code or unable to join game');
    } finally {
      setLoading(false);
    }
  };
  
  // If we have a session ID, render the game core
  if (sessionId) {
    return <GameCore sessionId={sessionId} />;
  }
  
  // If no session ID yet, show join screen
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: '12px' }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold" color="#5F4B8B" mb={4}>
          Join a Game Session
        </Typography>
        
        <Box component="form" onSubmit={(e) => { e.preventDefault(); }}>
          <TextField
            fullWidth
            label="Enter Session Code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            variant="outlined"
            placeholder="e.g. ABC123"
            error={!!error}
            helperText={error}
            sx={{ mb: 3 }}
          />
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleJoinGame}
            disabled={loading || !sessionCode.trim()}
            sx={{
              bgcolor: '#5F4B8B',
              py: 1.5,
              '&:hover': { bgcolor: '#4a3a6d' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Join Game'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default GamePage;