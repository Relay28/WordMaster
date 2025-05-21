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
  Alert,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

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
  const [showUsedWords, setShowUsedWords] = useState(false); // New state for toggling used words visibility
  const [wordUsedNotification, setWordUsedNotification] = useState(false);
  const [usedWordMessage, setUsedWordMessage] = useState('');
  const [cycleTransitionActive, setCycleTransitionActive] = useState(false);
  const [showCycleTransition, setShowCycleTransition] = useState(false);
  const [previousCycle, setPreviousCycle] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
  const chatEndRef = useRef(null);

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
    console.log('[GamePlay Debug] Attempting to submit sentence:', sentence.trim());

    try {
      // Get the authentication token
      const token = await getToken();
      if (!token) {
        console.error('No authentication token found. Cannot submit sentence.');
        setSubmitting(false);
        alert('Authentication error. Please log in again.');
        return;
      }

      // Define headers, including the Authorization Bearer token
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Call sendMessage with the destination, message body, and headers
      // Note: Your sendMessage function needs to be able to accept headers
      // If your current sendMessage doesn't, you'll need to adjust it (see explanation below)
      sendMessage(
        `/app/game/${gameState.sessionId}/word`, // Use '/submit' as per your backend controller
        { word: sentence.trim() }, // Sending as an object with 'sentence'
        headers // Pass the headers here
      );

      console.log('[GamePlay Debug] Sentence sent to backend with token. Clearing input.');
      setSentence(''); // Clear input immediately on successful send
      // The state update (like used words, turn advance) will come from the WebSocket subscriptions
      // when the backend broadcasts them.

    } catch (error) {
      console.error('Error sending sentence via WebSocket:', error);
      alert('Failed to send sentence. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add this new component at the top of your file after imports
const CycleTransitionOverlay = ({ isActive, cycle }) => {
  if (!isActive) return null;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        color: 'white',
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: '600px', p: 4 }}>
        <Typography variant="h3" sx={{ mb: 2, color: '#5F4B8B' }}>
          Cycle {cycle-1} Completed!
        </Typography>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Starting Cycle {cycle}
        </Typography>
        <CircularProgress size={60} sx={{ color: '#5F4B8B' }} />
        <Typography variant="body1" sx={{ mt: 4, fontStyle: 'italic' }}>
          New story prompts and word availability are being refreshed...
        </Typography>
      </Box>
    </Box>
  );
};

  // Add this effect to detect cycle changes
  useEffect(() => {
    if (previousCycle !== null && 
        gameState.currentCycle && 
        gameState.currentCycle > previousCycle) {
      
      // Show transition overlay when cycle changes
      setShowCycleTransition(true);
      console.log(`Transitioning from cycle ${previousCycle} to ${gameState.currentCycle}`);
      
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setShowCycleTransition(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Track previous cycle
    if (gameState.currentCycle) {
      setPreviousCycle(gameState.currentCycle);
    }
  }, [gameState.currentCycle, previousCycle]);

  // In the game status header
const totalCycles = Math.ceil(gameState.totalTurns / (gameState.players?.length || 1));
const isLastCycle = gameState.currentCycle === totalCycles;

  return (
    <>
      <CycleTransitionOverlay
        isActive={showCycleTransition}
        cycle={gameState.currentCycle || 1}
      />
      
      <Box sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Game Status Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h5" sx={{ fontWeight: '500', color: '#5F4B8B' }}>
                  {gameState.contentInfo?.title || 'Game Session'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={`Cycle ${gameState.currentCycle || 1} of ${totalCycles || '?'}`} 
                    color={isLastCycle ? "error" : "secondary"}
                    size="medium"
                    variant="outlined"
                    sx={{ 
                      fontWeight: 'bold',
                      ...(isLastCycle && { animation: 'pulse 2s infinite' })
                    }}
                  />
                  <Chip 
                    label={`Turn ${gameState.currentTurn || '?'} of ${gameState.totalTurns || '?'}`} 
                    color="primary" 
                    size="medium"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" mt={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: isMyTurn ? '#5F4B8B' : '#e0e0e0',
                    color: isMyTurn ? 'white' : 'text.primary',
                    mr: 2
                  }}
                >
                  {gameState.currentPlayer?.name?.charAt(0) || '?'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={isMyTurn ? 'bold' : 'medium'}>
                    {isMyTurn ? "Your turn!" : `${gameState.currentPlayer?.name || 'Waiting for player'}'s turn`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {gameState.currentPlayer?.role && `Role: ${gameState.currentPlayer.role}`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <Typography variant="subtitle1" mr={1}>
                    Time: {gameState.timeRemaining || 0}s
                  </Typography>
                  <Box sx={{ width: '120px' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={timePercent}
                      color={getTimerColor()}
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: 'rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* User's role display and AI Role Hint */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', bgcolor: '#f8f5ff' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Your Role</Typography>
                  <Chip 
                    label={gameState.players?.find(p => p.userId === user?.id)?.role || 'No role assigned'} 
                    color="primary"
                    size="medium"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                
                {rolePrompt && (
                  <Box mt={1} p={2} bgcolor="#e3f2fd" borderRadius="8px" borderLeft="4px solid #2196f3">
                    <Typography variant="subtitle2" fontWeight="bold" color="#1e88e5">Role Hint:</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {rolePrompt}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Chip 
                        size="small" 
                        label={`Updated for Cycle ${gameState.currentCycle}`} 
                        color="info" 
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                )}
                
                <Typography variant="body2" mt={rolePrompt ? 1 : 0}>
                  Play according to your role to earn more points! Your role may change between cycles.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* AI Story Prompt */}
          {storyPrompt && (
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: '8px', 
                bgcolor: '#fff8e1',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="#f57c00">Story Prompt:</Typography>
                    <Chip 
                      label={`Cycle ${gameState.currentCycle}`} 
                      color="warning" 
                      size="small"
                    />
                  </Box>
                  <Typography variant="body1" sx={{ 
                    fontStyle: 'italic', 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6 
                  }}>
                    {storyPrompt}
                  </Typography>
                </Box>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, right: 0, 
                  width: '150px', 
                  height: '150px', 
                  background: 'radial-gradient(circle, rgba(255,193,7,0.2) 0%, rgba(255,255,255,0) 70%)',
                  zIndex: 1
                }} />
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
                   alignItems: msg.senderId === user?.id ? 'flex-end' : 'flex-start'
                 }}
               >
                 <Box 
                   sx={{
                     bgcolor: msg.senderId === user?.id ? '#5F4B8B' : (gameState.backgroundImage ? 'rgba(255, 255, 255, 0.9)' : '#e0e0e0'),
                     color: msg.senderId === user?.id ? 'white' : 'inherit',
                     p: 1.5,
                     borderRadius: '12px',
                     maxWidth: '80%',
                     boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                   }}
                 >
                   <Box display="flex" alignItems="center" mb={1}>
                     <Avatar 
                       sx={{ 
                         width: 24, 
                         height: 24, 
                         mr: 1,
                         fontSize: '0.75rem',
                         bgcolor: msg.senderId === user?.id ? '#4a3a6d' : '#9e9e9e'
                       }}
                     >
                       {msg.senderName?.charAt(0) || 'P'}
                     </Avatar>
                     <Typography variant="subtitle2" fontWeight="bold">
                       {msg.senderName || 'Player'} 
                       {msg.role && ` (${msg.role})`}
                     </Typography>
                   </Box>
                   <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                   <Box mt={1} display="flex" justifyContent="flex-end" alignItems="center">
                     {msg.containsWordBomb && (
                       <Chip 
                         label="Word Bomb!" 
                         size="small" 
                         color="error"
                         sx={{ mr: 1, fontSize: '0.6rem' }}
                       />
                     )}
                     {msg.wordUsed && (
                       <Chip 
                         label={`Used: ${msg.wordUsed}`} 
                         size="small" 
                         color="success"
                         sx={{ fontSize: '0.6rem' }}
                       />
                     )}
                   </Box>
                 </Box>
                 <Typography variant="caption" sx={{ mt: 0.5, color: gameState.backgroundImage ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
                   {new Date(msg.timestamp).toLocaleTimeString()}
                 </Typography>
               </Box>
             ))}
             <div ref={chatEndRef} />
           </Box>
                       
              
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
                      It's your turn! Type your sentence using the word bank.
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
                {/* Use the `leaderboard` state here instead of `gameState.leaderboard` */}
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

          {/* Word Bank Display - Enhanced Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 3, borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="medium">
                  Word Bank 
                  <Chip 
                    label={`Cycle ${gameState.currentCycle || 1}`} 
                    size="small" 
                    color="secondary" 
                    sx={{ ml: 2 }}
                  />
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showUsedWords} 
                      onChange={(e) => setShowUsedWords(e.target.checked)} 
                    />
                  }
                  label="Show used words"
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Words can only be used once per cycle. They'll become available again in the next cycle.
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {gameState.wordBank && gameState.wordBank
                  // Modify the word bank filter logic
                  .filter(wordItem => {
                    // Only consider a word used if it was used in the current cycle
                    const isWordUsedInCurrentCycle = gameState.usedWords?.includes(wordItem.word.toLowerCase()) && 
                                                  (!gameState.usedWordsCycle || 
                                                    gameState.usedWordsCycle[wordItem.word.toLowerCase()] === gameState.currentCycle);
                    return showUsedWords || !isWordUsedInCurrentCycle;
                  })
                  .map((wordItem, index) => {
                    const isUsedInCurrentCycle = gameState.usedWords?.includes(wordItem.word.toLowerCase()) && 
                                                gameState.usedWordsCycle?.[wordItem.word.toLowerCase()] === gameState.currentCycle;
                    
                    return (
                      <Tooltip
                        key={index}
                        title={
                          <React.Fragment>
                            <Typography color="inherit" variant="subtitle2">Description:</Typography>
                            <Typography variant="body2">
                              {wordItem.description || "No description available"}
                            </Typography>
                            <Typography color="inherit" variant="subtitle2" sx={{ mt: 1 }}>Example:</Typography>
                            <Typography variant="body2" fontStyle="italic">
                              {wordItem.exampleUsage ? `"${wordItem.exampleUsage}"` : "No example available"}
                            </Typography>
                          </React.Fragment>
                        }
                        arrow
                        placement="top"
                        disableHoverListener={isUsedInCurrentCycle}
                      >
                        <Chip 
                          label={wordItem.word}
                          color={isUsedInCurrentCycle ? "default" : "primary"}
                          variant={isUsedInCurrentCycle ? "default" : "outlined"}
                          disabled={isUsedInCurrentCycle}
                          sx={{ 
                            fontWeight: 'medium',
                            opacity: isUsedInCurrentCycle ? 0.6 : 1,
                            textDecoration: isUsedInCurrentCycle ? 'line-through' : 'none',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&:hover': { 
                              backgroundColor: isUsedInCurrentCycle ? 'inherit' : 'rgba(95, 75, 139, 0.1)',
                              cursor: isUsedInCurrentCycle ? 'not-allowed' : 'pointer',
                              transform: isUsedInCurrentCycle ? 'none' : 'translateY(-2px)'
                            },
                            // Add a small indicator dot if the word has a description
                            '&::after': wordItem.description ? {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: '6px',
                              height: '6px',
                              backgroundColor: '#5F4B8B',
                              borderRadius: '50%',
                              transform: 'translate(-2px, -2px)'
                            } : {}
                          }}
                          onClick={() => {
                            if (!isUsedInCurrentCycle) {
                              setSentence(prev => prev ? `${prev} ${wordItem.word}` : wordItem.word);
                            } else {
                              setUsedWordMessage(`"${wordItem.word}" has already been used in this cycle`);
                              setWordUsedNotification(true);
                            }
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                {(!gameState.wordBank || gameState.wordBank.length === 0) && (
                  <Typography variant="body2" color="text.secondary">No words available in word bank.</Typography>
                )}
              </Box>
              
              <Box mt={2} p={2} bgcolor="rgba(95, 75, 139, 0.05)" borderRadius="8px">
                <Typography variant="body2" color="text.secondary">
                  <strong>Tip:</strong> Using multiple word bank items in a single sentence will earn you bonus points!
                </Typography>
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

        {/* Word Used Notification */}
        <Snackbar
          open={wordUsedNotification}
          autoHideDuration={2000}
          onClose={() => setWordUsedNotification(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setWordUsedNotification(false)} 
            severity="warning"
            sx={{ width: '100%' }}
          >
            {usedWordMessage}
          </Alert>
        </Snackbar>

        {/* Cycle transition overlay - Add this to show/hide the overlay based on game state */}
        <CycleTransitionOverlay 
          isActive={cycleTransitionActive} 
          cycle={gameState.currentCycle || 1} // Default to 1 if undefined
        />

        {/* Cycle change notification - New addition to show notification on cycle change */}
        {showCycleTransition && (
          <Box 
            sx={{ 
              position: 'fixed', 
              top: 16, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              bgcolor: '#5F4B8B', 
              color: 'white', 
              p: 2, 
              borderRadius: '8px', 
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)', 
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            <Typography variant="h6" fontWeight="medium">
              Cycle {gameState.currentCycle - 1} Completed! 
            </Typography>
            <CircularProgress size={24} sx={{ color: 'white' }} />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Starting Cycle {gameState.currentCycle}...
            </Typography>
          </Box>
        )}
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
          }
        `}
      </style>
    </>
  );
};

export default GamePlay;