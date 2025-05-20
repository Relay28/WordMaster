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
  Avatar,
  Snackbar,
  Alert
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

const PowerUpCard = ({ card, isSelected, onSelect, isMyTurn }) => {
  return (
    <Card 
      sx={{ 
        width: 150, 
        height: 200,
        cursor: isMyTurn && !card.used ? 'pointer' : 'default',
        opacity: card.used ? 0.6 : 1,
        transform: isSelected ? 'scale(1.05)' : 'none',
        transition: 'transform 0.2s, opacity 0.2s',
        position: 'relative',
        overflow: 'visible',
        bgcolor: card.used ? '#f5f5f5' : '#ffffff'
      }}
      onClick={() => isMyTurn && !card.used && onSelect(card)}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          position: 'absolute', 
          top: -10, 
          right: -10, 
          width: 30, 
          height: 30, 
          borderRadius: '50%', 
          bgcolor: '#5F4B8B', 
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}>
          +{card.pointsBonus}
        </Box>
        
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 'bold', 
          fontSize: '1rem',
          mb: 1,
          color: card.used ? 'text.secondary' : 'text.primary'
        }}>
          {card.name}
        </Typography>
        
        <Typography variant="body2" sx={{ 
          flexGrow: 1,
          color: card.used ? 'text.secondary' : 'text.primary'
        }}>
          {card.description}
        </Typography>
        
        {card.used && (
          <Chip 
            label="Used" 
            size="small" 
            sx={{ 
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: '0.6rem'
            }} 
          />
        )}
      </CardContent>
    </Card>
  );
};
// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GamePlay = ({ gameState, stompClient, sendMessage }) => {
  const { sessionId } = useParams(); // Ensure sessionId is available if used directly for subscriptions
  const { user, getToken } = useUserAuth();
  const [sentence, setSentence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState(''); // For AI-generated story prompts
  const [rolePrompt, setRolePrompt] = useState('');   // For AI-generated role-specific hints
  const [pointsNotification, setPointsNotification] = useState(false);
  const [pointsData, setPointsData] = useState({ points: 0, reason: '' });
  const chatEndRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]); 
  const [playerCards, setPlayerCards] = useState([]);
const [selectedCard, setSelectedCard] = useState(null);
const [cardError, setCardError] = useState(null);

// Add this useEffect to fetch cards when the game starts
useEffect(() => {
  const fetchPlayerCards = async () => {
    if (!gameState.sessionId || !user?.id) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/cards/player/${gameState.players?.find(p => p.userId === user.id)?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
   
      if (!response.ok) throw new Error('Failed to fetch cards');
      
      const data = await response.json();
      setPlayerCards(data);
    } catch (err) {
      console.error('Error fetching player cards:', err);
      setCardError('Could not load power-up cards');
    }
  };

  fetchPlayerCards();
}, [gameState.sessionId, user?.id, gameState.players]);


  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.messages]);
  // Initialize story prompt from gameState if available
  useEffect(() => {
    if (gameState && gameState.storyPrompt) {
      console.log('[GamePlay Debug] Initial story prompt from gameState:', gameState.storyPrompt);
      setStoryPrompt(gameState.storyPrompt);
    }
  }, [gameState]);

   useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!sessionId) {
        console.log('No sessionId available for leaderboard fetch.');
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.error('No authentication token found. Cannot fetch leaderboard.');
          return;
        }

        const response = await fetch(`${API_URL}/api/game/${sessionId}/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLeaderboard(data);
        console.log('Leaderboard fetched:', data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboard();
    // Fetch periodically or when a game state update suggests scores might have changed significantly
    const interval = setInterval(fetchLeaderboard, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [sessionId, getToken, gameState.currentTurn]); // Re-fetch when session changes or turn advances (as scores might change)


  // Subscription for AI-generated story prompts
  useEffect(() => {
    if (stompClient && stompClient.connected && gameState.sessionId) {
      console.log('[GamePlay Debug] Subscribing to story updates for session:', gameState.sessionId);
      const subscription = stompClient.subscribe(`/topic/game/${gameState.sessionId}/updates`, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('[GamePlay Debug] Received story update:', data);
          if (data.type === "storyUpdate" && data.content) {
            setStoryPrompt(data.content);
          }
        } catch (error) {
          console.error('Error handling story update:', error);
        }
      });
      return () => {
        console.log('[GamePlay Debug] Unsubscribing from story updates.');
        subscription.unsubscribe();
      };
    } else {
      if (!stompClient?.connected) console.log('[GamePlay Debug] Story updates: StompClient not connected.');
      if (!gameState.sessionId) console.log('[GamePlay Debug] Story updates: gameState.sessionId is missing.');
    }
  }, [stompClient, gameState.sessionId]);

  // Subscription for AI-generated role-specific prompts/hints
  useEffect(() => {
    if (stompClient && stompClient.connected && user && user.email) {
      console.log('[GamePlay Debug] Subscribing to role prompts for user:', user.email);
      const subscription = stompClient.subscribe(`/user/${user.email}/queue/responses`, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log('[GamePlay Debug] Received role prompt/personal response:', data);
          if (data.rolePrompt) {
            setRolePrompt(data.rolePrompt);
          }
        } catch (error) {
          console.error('Error handling personal response (role prompt):', error);
        }
      });
      return () => {
        console.log('[GamePlay Debug] Unsubscribing from role prompts.');
        subscription.unsubscribe();
      };
    } else {
      if (!stompClient?.connected) console.log('[GamePlay Debug] Role prompts: StompClient not connected.');
      if (!user?.email) console.log('[GamePlay Debug] Role prompts: user.email is missing.');
    }
  }, [stompClient, user]);

  // Subscription for score updates
  useEffect(() => {
    if (stompClient && stompClient.connected && user && user.id) {
      const subscription = stompClient.subscribe(`/user/${user.email}/queue/score`, (message) => {
        try {
          const data = JSON.parse(message.body);
          // Show notification when points are awarded
          if (data.points) {
            setPointsData({
              points: data.points,
              reason: data.reason || 'Points awarded'
            });
            setPointsNotification(true);
          }
        } catch (error) {
          console.error('Error handling score update:', error);
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [stompClient, user]);

  // Determine if it's the current user's turn
  const currentUserInPlayers = gameState.players?.find(p => p.userId === user?.id);
 // Fix the isMyTurn comparison by ensuring type consistency
  const isMyTurn = !!(gameState.currentPlayer && currentUserInPlayers && user &&
                 String(gameState.currentPlayer.id) === String(currentUserInPlayers.id));

  // Debugging for isMyTurn calculation and related states
  useEffect(() => {
    console.log('-------------------------------------------');
    console.log('[GamePlay Debug] gameState:', JSON.parse(JSON.stringify(gameState))); // Deep copy for logging
    console.log('[GamePlay Debug] user from useUserAuth():', user);
    console.log('[GamePlay Debug] stompClient connected:', stompClient?.connected);
    console.log('--- isMyTurn Calculation ---');
    console.log('[GamePlay Debug] gameState.currentPlayer:', gameState.currentPlayer);
    console.log('[GamePlay Debug] currentUserInPlayers (found by user.id in gameState.players):', currentUserInPlayers);
    if (gameState.currentPlayer && currentUserInPlayers) {
      console.log(`[GamePlay Debug] Comparing currentPlayer.id (${gameState.currentPlayer.id}, type: ${typeof gameState.currentPlayer.id}) with currentUserInPlayers.id (${currentUserInPlayers.id}, type: ${typeof currentUserInPlayers.id})`);
    }
    console.log('[GamePlay Debug] Calculated isMyTurn:', isMyTurn);
    console.log('-------------------------------------------');
  }, [user, gameState, stompClient, currentUserInPlayers, isMyTurn]);

  // Add near the top of your component
  useEffect(() => {
    if (gameState && Object.keys(gameState).length > 0) {
      console.log("Current game state:", gameState);
      console.log("Is current user's turn:", isMyTurn);
      console.log("Current player:", gameState.currentPlayer);
      console.log("Current user in players:", currentUserInPlayers);
    }
  }, [gameState, isMyTurn, currentUserInPlayers]);

  const timePercent = gameState.timePerTurn > 0 ? (gameState.timeRemaining / gameState.timePerTurn) * 100 : 0;

  const getTimerColor = () => {
    if (gameState.timeRemaining > 10) return 'primary';
    if (gameState.timeRemaining > 5) return 'warning';
    return 'error';
  };

  const handleSentenceChange = (e) => {
    setSentence(e.target.value);
  };

  
  const handleSubmit = async () => {
  if (!sentence.trim() || submitting || !gameState.sessionId || !isMyTurn) {
    console.log('Submission prevented: Sentence empty, already submitting, no session, or not my turn.');
    return;
  }

  setSubmitting(true);

  try {
    const token = await getToken();
    if (!token) {
      console.error('No authentication token found.');
      setSubmitting(false);
      return;
    }

    // Prepare the request body
    const requestBody = {
      word: sentence.trim(),
      cardId: selectedCard?.id || null
    };

    // Call sendMessage with the destination, message body, and headers
    sendMessage(
      `/app/game/${gameState.sessionId}/word`,
      requestBody,
      { 'Authorization': `Bearer ${token}` }
    );

    // Clear selection after submit
    if (selectedCard) {
      setSelectedCard(null);
      // Optimistically update cards state
      setPlayerCards(prev => prev.map(card => 
        card.id === selectedCard.id ? {...card, used: true} : card
      ));
    }

    setSentence('');
  } catch (error) {
    console.error('Error sending sentence:', error);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <Box sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Game Status Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: '8px' }}>
            {/* Enhance the display of game information */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h5">
                {gameState.contentInfo?.title || 'Game Session'}
              </Typography>
              <Box>
                <Chip 
                  label={`Turn ${gameState.currentTurn || '?'} of ${gameState.totalTurns || '?'}`} 
                  color="primary" 
                  size="medium"
                  sx={{ mr: 1 }}
                />
                {gameState.currentCycle && (
                  <Chip 
                    label={`Cycle ${gameState.currentCycle}`} 
                    color="secondary" 
                    size="medium"
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" mr={1}>
                {isMyTurn ? "Your turn!" : `${gameState.currentPlayer?.name || 'Waiting for player'}'s turn`}
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

        {/* User's role display and AI Role Hint */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', bgcolor: '#f8f5ff' }}>
            <Typography variant="h6" mb={1}>Your Role: {gameState.players?.find(p => p.userId === user?.id)?.role || 'No role assigned'}</Typography>
            {rolePrompt && (
              <Box mt={1} p={2} bgcolor="#e3f2fd" borderRadius="8px" borderLeft="4px solid #2196f3">
                <Typography variant="subtitle2" fontWeight="bold" color="#1e88e5">Role Hint:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {rolePrompt}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" mt={rolePrompt ? 1 : 0}>
              Play according to your role to earn more points!
            </Typography>
          </Paper>
        </Grid>

        {/* AI Story Prompt */}
        {storyPrompt && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', bgcolor: '#fff8e1' }}>
              <Typography variant="h6" mb={1} color="#f57c00">Story Prompt:</Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                {storyPrompt}
              </Typography>
            </Paper>
          </Grid>
        )}
        
        {/* Main chat area and input field */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              height: '500px', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundImage: gameState.backgroundImage ? `url(${gameState.backgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {gameState.backgroundImage && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
            )}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, position: 'relative', zIndex: 1 }}>
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
                      bgcolor: msg.userId === user?.id ? '#5F4B8B' : (gameState.backgroundImage ? 'rgba(255, 255, 255, 0.9)' : '#e0e0e0'),
                      color: msg.userId === user?.id ? 'white' : 'inherit',
                      p: 1.5,
                      borderRadius: '12px',
                      maxWidth: '80%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold">
                      {msg.playerName || 'Player'} {msg.roleName ? `(${msg.roleName})` : ''}:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                  </Box>
                  {msg.wordUsed && (
                    <Chip label={`Used word: ${msg.wordUsed}`} size="small" sx={{ mt: 0.5, alignSelf: msg.userId === user?.id ? 'flex-end' : 'flex-start' }} />
                  )}
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Box>
            
            {/* Power-up Cards Section */}
            {console.log('Rendering cards section - isMyTurn:', isMyTurn, 'playerCards:', playerCards)}
{isMyTurn && playerCards.length > 0 && (
  <Box sx={{ 
    p: 2, 
    mb: 2,
    bgcolor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  }}>
    <Typography variant="subtitle1" fontWeight="bold" mb={1}>
      Power-up Cards
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>
      Select a card before submitting to earn bonus points!
    </Typography>
    
    <Box sx={{ 
      display: 'flex', 
      gap: 2,
      overflowX: 'auto',
      pb: 1,
      '&::-webkit-scrollbar': {
        height: '6px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#5F4B8B',
        borderRadius: '3px',
      }
    }}>
      {playerCards.map(card => (
        <PowerUpCard
          key={card.id}
          card={card}
          isSelected={selectedCard?.id === card.id}
          onSelect={setSelectedCard}
          isMyTurn={isMyTurn}
        />
      ))}
    </Box>
    
    {selectedCard && (
      <Box mt={1} p={1} bgcolor="#e8f5e9" borderRadius="4px">
        <Typography variant="body2">
          Selected: <b>{selectedCard.name}</b> - {selectedCard.description}
        </Typography>
      </Box>
    )}
    
    {cardError && (
      <Alert severity="error" sx={{ mt: 1 }}>
        {cardError}
      </Alert>
    )}
  </Box>
)}
            {/* Input area */}
            <Box sx={{ p: 2, bgcolor: gameState.backgroundImage ? 'rgba(0,0,0,0.6)' : 'rgba(245,245,245,1)', position: 'relative', zIndex: 1, borderTop: gameState.backgroundImage ? '1px solid rgba(255,255,255,0.2)' : '1px solid #ddd' }}>
              {isMyTurn ? (
                <Box display="flex" flexDirection="column">
                  <Typography 
                    variant="subtitle1" 
                    color="primary" 
                    fontWeight="bold" 
                    mb={1}
                    sx={{ 
                      backgroundColor: "rgba(95, 75, 139, 0.1)", 
                      p: 1, 
                      borderRadius: '4px',
                      textAlign: 'center' 
                    }}
                  >
                     It's your turn! {selectedCard && `+${selectedCard.pointsBonus} points for: ${selectedCard.name}`}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Type your sentence..."
                      value={sentence}
                      onChange={handleSentenceChange}
                      disabled={submitting}
                      sx={{
                        mr: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '50px',
                          backgroundColor: gameState.backgroundImage ? 'rgba(255,255,255,0.9)' : 'white',
                          borderColor: '#5F4B8B',
                          borderWidth: '2px'
                        }
                      }}
                      onKeyPress={(ev) => {
                        if (ev.key === 'Enter') {
                          handleSubmit();
                          ev.preventDefault();
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
                        py: 1.5,
                        '&:hover': { bgcolor: '#4a3a6d' },
                        '&.Mui-disabled': { bgcolor: '#c5c5c5' }
                      }}
                    >
                      {submitting ? <CircularProgress size={24} color="inherit"/> : 'Submit'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1" textAlign="center" sx={{
                  color: gameState.backgroundImage ? 'white' : 'text.secondary',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  p: 2,
                  borderRadius: '8px'
                }}>
                  Wait for your turn to submit a response. Current player: {gameState.currentPlayer?.name}
                </Typography>
              )}
              {isMyTurn && gameState.currentPlayer?.wordBomb && (
                <Box mt={1} p={1} bgcolor="#ffebee" borderRadius="8px" textAlign="center">
                  <Typography variant="subtitle2" color="error.main">
                    Your word bomb: <b>{gameState.currentPlayer.wordBomb}</b> (don't use this word!)
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
        
        {/* Side panels: Leaderboard and Used Words */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
            <Typography variant="h6" mb={2}>Leaderboard</Typography>
            <List dense disablePadding>
               {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
                <ListItem key={player.id || player.userId || index} divider={index < leaderboard.length - 1}>
                  <Avatar sx={{ bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B', mr: 2, width: 30, height: 30, fontSize: '0.875rem' }}>
                    {index + 1}
                  </Avatar>
                  <ListItemText 
                    primary={player.name || 'Player'} 
                    secondary={player.role || 'Role N/A'} 
                  />
                  <Typography variant="body1" fontWeight="bold">
                    {player.score}
                  </Typography>
                </ListItem>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                  <Typography variant="body2" color="text.secondary">Leaderboard is empty.</Typography>
              )}
            </List>
          </Paper>
          
          <Paper sx={{ p: 2, borderRadius: '8px' }}>
            <Typography variant="h6" mb={2}>Used Words</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: '200px', overflowY: 'auto' }}>
              {gameState.usedWords && gameState.usedWords.map((word, index) => (
                <Chip key={index} label={word} size="small" variant="outlined"/>
              ))}
              {(!gameState.usedWords || gameState.usedWords.length === 0) && (
                <Typography variant="body2" color="text.secondary">No words have been used yet.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Word Bank Display - New Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <Typography variant="h6" fontWeight="medium" mb={1}>Word Bank</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {gameState.wordBank && gameState.wordBank.map((word, index) => (
                <Chip 
                  key={index} 
                  label={word}
                  color="primary"
                  variant={gameState.usedWords && gameState.usedWords.includes(word.toLowerCase()) ? "default" : "outlined"}
                  sx={{ 
                    fontWeight: 'medium',
                    opacity: gameState.usedWords && gameState.usedWords.includes(word.toLowerCase()) ? 0.6 : 1,
                    textDecoration: gameState.usedWords && gameState.usedWords.includes(word.toLowerCase()) ? 'line-through' : 'none',
                    '&:hover': { 
                      backgroundColor: 'rgba(95, 75, 139, 0.1)',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => {
                    if (!gameState.usedWords || !gameState.usedWords.includes(word.toLowerCase())) {
                      setSentence(prev => prev ? `${prev} ${word}` : word);
                    }
                  }}
                />
              ))}
              {(!gameState.wordBank || gameState.wordBank.length === 0) && (
                <Typography variant="body2" color="text.secondary">No words available in word bank.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Notification for points awarded */}
      <Snackbar
        open={pointsNotification}
        autoHideDuration={3000}
        onClose={() => setPointsNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setPointsNotification(false)} 
          severity={pointsData.points > 0 ? "success" : "error"}
          sx={{ width: '100%' }}
        >
          {pointsData.points > 0 ? `+${pointsData.points}` : pointsData.points} points: {pointsData.reason}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GamePlay;