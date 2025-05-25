import React, { useEffect }  from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  CircularProgress
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

const WaitingRoom = ({ gameState, isTeacher }) => {
    const { sessionId } = useParams();
    const { getToken } = useUserAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        console.log('WaitingRoom gameState:', gameState.players);
        console.log('Available game state properties:', Object.keys(gameState || {}));
        if (gameState && gameState.players) {
          console.log('Player list:', gameState.players);
          console.log('Player count:', gameState.players.length);
        }
        if (gameState && gameState.contentInfo) {
          console.log('ContentInfo details:', gameState.contentInfo);
        }
      }, [gameState.player]);
    
    // Start game (teacher only)
    const handleStartGame = async () => {
        try {
          const token = await getToken();
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          
          // Use the complete URL with API_URL
          await fetch(`${API_URL}/api/sessions/${sessionId}/start`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          // Game start will be handled by WebSocket connection
        } catch (err) {
          console.error('Failed to start game:', err);
        }
      };
  
  return (
    <Box sx={{ py: 4 }}>
      <Card 
        elevation={3}
        sx={{ 
          borderRadius: '16px', 
          overflow: 'hidden',
          backgroundImage: gameState.backgroundImage ? `url(${gameState.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        {/* Dark overlay if background image exists */}
        {gameState.backgroundImage && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.6)' 
            }} 
          />
        )}
        
        <CardContent sx={{ position: 'relative', p: 4 }}>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            mb={1}
            color={gameState.backgroundImage ? 'white' : 'inherit'}
          >
            Waiting Room
          </Typography>
          
          <Typography 
            variant="h5" 
            mb={3}
            color={gameState.backgroundImage ? 'white' : 'inherit'}
          >
            {gameState.contentInfo?.title || 'Game Session'}
          </Typography>
          
          <Box 
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)', 
              borderRadius: '8px',
              p: 3,
              mb: 3
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Session Code: <b>{gameState?.sessionCode || sessionId || 'Loading...'}</b></Typography>
            <Chip 
                label={`${gameState.players?.length || 0} players joined`} 
                color="primary" 
            />
            </Box>
            
            {/* Display session details */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <b>Time per turn:</b> {gameState.timePerTurn || 30} seconds
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <b>Total turns:</b> {gameState.totalTurns || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Players list */}
            <Typography variant="h6" mb={1}>Players</Typography>
            <Paper elevation={0} sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px', maxHeight: '300px', overflow: 'auto' }}>
            {gameState.players && gameState.players.length > 0 ? (
            <List disablePadding>
            {gameState.players.map(player => (
              <ListItem key={player.id} divider>
                <Avatar sx={{ mr: 2, bgcolor: '#5F4B8B' }}>
                  {player.name?.charAt(0) || 'P'}
                </Avatar>
                <ListItemText 
                  primary={player.playerName} 
                  secondary={player.role || 'No role assigned'} 
                />
              </ListItem>
            ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No players have joined yet
            </Typography>
          )}
            </Paper>
          </Box>
          
          {/* Teacher controls */}
          {isTeacher && (
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                size="large"
                onClick={handleStartGame}
                disabled={!gameState.players || gameState.players.length === 0}
                sx={{
                  bgcolor: '#5F4B8B',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': { bgcolor: '#4a3a6d' },
                }}
              >
                Start Game
              </Button>
            </Box>
          )}
          
          {/* Student view */}
          {!isTeacher && (
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.9)', 
                borderRadius: '8px',
                p: 3,
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" mb={2}>Waiting for teacher to start the game</Typography>
              <CircularProgress sx={{ color: '#5F4B8B' }} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WaitingRoom;