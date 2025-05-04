import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  LinearProgress, 
  CircularProgress,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GamePlay = ({ gameState, stompClient }) => {
  const { sessionId } = useParams();
  const { user, getToken } = useUserAuth();
  const [sentence, setSentence] = useState('');
  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timePercent, setTimePercent] = useState(100);
  const chatEndRef = useRef(null);

  // Update time percentage whenever timeRemaining changes
  useEffect(() => {
    if (gameState.timePerTurn) {
      setTimePercent((gameState.timeRemaining / gameState.timePerTurn) * 100);
    }
  }, [gameState.timeRemaining, gameState.timePerTurn]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  // Check if it's current user's turn
  const isMyTurn = gameState.currentPlayer?.userId === user?.id;

  // Extract word from sentence
  const handleSentenceChange = (e) => {
    const newSentence = e.target.value;
    setSentence(newSentence);
    
    // Simple extraction of potential word (for demonstration)
    const words = newSentence.trim().split(/\s+/);
    if (words.length > 0) {
      setWord(words[words.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase());
    } else {
      setWord('');
    }
  };

  // Submit word/sentence
  const handleSubmit = async () => {
    if (!isMyTurn || !sentence.trim() || !word) return;
    
    setSubmitting(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          word: word,
          sentence: sentence
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit word');
      }
      
      // Clear input after successful submission
      setSentence('');
      setWord('');
    } catch (err) {
      console.error('Failed to submit word:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine timer color based on time remaining
  const getTimerColor = () => {
    if (timePercent > 60) return 'success.main';
    if (timePercent > 30) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Game Status Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: '8px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5">{gameState.contentInfo?.title || 'Game Session'}</Typography>
              <Chip 
                label={`Turn ${gameState.currentTurn || '?'} of ${gameState.totalTurns || '?'}`} 
                color="primary" 
                size="medium"
              />
            </Box>
            <Box display="flex" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" mr={1}>
                {isMyTurn ? "Your turn!" : `${gameState.currentPlayer?.name || 'Player'}'s turn`}
                {gameState.currentPlayer?.role && ` (${gameState.currentPlayer.role})`}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                <Typography variant="subtitle1" mr={1}>
                  Time: {gameState.timeRemaining || 0}s
                </Typography>
                <Box sx={{ width: '100px' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={timePercent}
                    color={getTimerColor()}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Main Game Area */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              height: '500px', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundImage: gameState.backgroundImage ? `url(${gameState.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {/* Background overlay */}
            {gameState.backgroundImage && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)'
                }} 
              />
            )}
            
            {/* Chat/Messages Area */}
            <Box 
              sx={{ 
                flexGrow: 1, 
                overflowY: 'auto',
                p: 3,
                position: 'relative',
                zIndex: 1
              }}
            >
              {gameState.messages && gameState.messages.map((msg, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.userId === user?.id ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Box 
                    sx={{
                      bgcolor: msg.userId === user?.id ? '#5F4B8B' : 'rgba(255, 255, 255, 0.9)',
                      color: msg.userId === user?.id ? 'white' : 'inherit',
                      p: 2,
                      borderRadius: '8px',
                      maxWidth: '80%'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {msg.playerName} {msg.roleName ? `(${msg.roleName})` : ''}:
                    </Typography>
                    <Typography variant="body1">{msg.content}</Typography>
                  </Box>
                  {msg.wordUsed && (
                    <Chip 
                      label={`Used word: ${msg.wordUsed}`} 
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Box>
            
            {/* Input Area */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                position: 'relative',
                zIndex: 1
              }}
            >
              {isMyTurn ? (
                <Box display="flex" alignItems="center">
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your sentence..."
                    value={sentence}
                    onChange={handleSentenceChange}
                    disabled={submitting || !isMyTurn}
                    sx={{
                      mr: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '50px'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || !sentence.trim() || !isMyTurn}
                    sx={{
                      bgcolor: '#5F4B8B',
                      borderRadius: '50px',
                      px: 3,
                      '&:hover': { bgcolor: '#4a3a6d' },
                      '&.Mui-disabled': { bgcolor: '#c5c5c5' }
                    }}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Submit'}
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1" textAlign="center">
                  Wait for your turn to submit a word
                </Typography>
              )}
              
              {isMyTurn && gameState.currentPlayer?.wordBomb && (
                <Box mt={1} p={2} bgcolor="#ffebee" borderRadius="8px">
                  <Typography variant="subtitle2" color="error">
                    Your word bomb: <b>{gameState.currentPlayer.wordBomb}</b> (don't use this word!)
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
        
        {/* Sidebar - Leaderboard & Used Words */}
        <Grid item xs={12} md={4}>
          {/* Leaderboard */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
            <Typography variant="h6" mb={2}>Leaderboard</Typography>
            <List dense disablePadding>
              {gameState.leaderboard && gameState.leaderboard.map((player, index) => (
                <ListItem key={player.id} divider={index < gameState.leaderboard.length - 1}>
                  <Avatar sx={{ bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B', mr: 2, width: 30, height: 30 }}>
                    {index + 1}
                  </Avatar>
                  <ListItemText 
                    primary={player.name} 
                    secondary={player.role || 'Player'} 
                  />
                  <Typography variant="body1" fontWeight="bold">
                    {player.score}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
          
          {/* Used Words */}
          <Paper sx={{ p: 2, borderRadius: '8px' }}>
            <Typography variant="h6" mb={2}>Used Words</Typography>
            <Box 
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {gameState.usedWords && gameState.usedWords.map((word, index) => (
                <Chip 
                  key={index} 
                  label={word} 
                  size="small" 
                  variant="outlined"
                />
              ))}
              {(!gameState.usedWords || gameState.usedWords.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No words have been used yet
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GamePlay;