import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Tooltip,
  Collapse,
  useTheme,
  useMediaQuery,
  Fade,
  IconButton,
  
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import { BagClosed, BagOpen } from '../../assets/BagIcons';
import { Close, Games } from '@mui/icons-material';
import bgGamePlay from '../../assets/bg-gameplay.png';

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';


const GamePlay = ({ gameState, stompClient, sendMessage, onGameStateUpdate, gameEnded, onProceedToResults }) => {
  const { sessionId } = useParams(); // Ensure sessionId is available if used directly for subscriptions
  const { user, getToken } = useUserAuth();
  const [sentence, setSentence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState(gameState?.storyPrompt || ''); // For AI-generated story prompts
  const [rolePrompt, setRolePrompt] = useState('');   // For AI-generated role-specific hints
  const [pointsNotification, setPointsNotification] = useState(false);
  const [pointsData, setPointsData] = useState({ points: 0, reason: '' });
  const [showUsedWords, setShowUsedWords] = useState(false); // New state for toggling used words visibility
  const [wordUsedNotification, setWordUsedNotification] = useState(false);
  const [usedWordMessage, setUsedWordMessage] = useState('');
  const [cycleTransitionActive, setCycleTransitionActive] = useState(false);
  const [showCycleTransition, setShowCycleTransition] = useState(false);
  const [previousCycle, setPreviousCycle] = useState(gameState?.currentCycle || null); // Already present
  const [leaderboard, setLeaderboard] = useState([]); // Already present
  const chatEndRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isProcessing, setIsProcessing] = useState(false); // For single-player processing
  const [localMessages, setLocalMessages] = useState([]);
  const [optimisticGameState, setOptimisticGameState] = useState(gameState); // Add this line
  const processingTimeoutRef = useRef(null); // Add this line
  const isSinglePlayer = gameState.players?.length === 1;
  const [isWordBankOpen, setIsWordBankOpen] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(gameState.timeRemaining);
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef(null);
  const lastServerUpdateRef = useRef(Date.now());
  const [proceeding, setProceeding] = useState(false); // <-- Add this line
  
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
  useEffect(() => {
  if (gameState.messages) {
    // Sort messages by timestamp
    const sortedMessages = [...gameState.messages].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Add debug logging for roleAppropriate
    sortedMessages.forEach(msg => {
      console.log(`Message: "${msg.content.substring(0, 20)}..." - roleAppropriate: ${msg.roleAppropriate} (type: ${typeof msg.roleAppropriate})`);
    });
    
    setLocalMessages(sortedMessages);
  }
}, [gameState.messages]);

  
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
  }, [gameState?.storyPrompt]);

  

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
  // Fix the isMyTurn comparison by ensuring type consistency and always returning true for singleplayer
  const isMyTurn = React.useMemo(() => {
  if (isSinglePlayer) return true;
  
  if (!gameState.currentPlayer || !user || !currentUserInPlayers) return false;
  
  // Compare using userId consistently
  const isCurrentPlayer = String(gameState.currentPlayer.userId) === String(user.id);
  
  console.log('[Turn Debug]', {
    currentPlayerId: gameState.currentPlayer.userId,
    userId: user.id,
    isMatch: isCurrentPlayer
  });
  
  return isCurrentPlayer;
}, [gameState.currentPlayer, user, currentUserInPlayers, isSinglePlayer]);

// Add an effect to log turn changes
useEffect(() => {
  console.log('[Turn Change]', {
    isMyTurn,
    currentPlayer: gameState.currentPlayer,
    userId: user?.id
  });
}, [isMyTurn, gameState.currentPlayer, user]);
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

  // Local timer countdown for smooth display
  useEffect(() => {
    // Clear existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Update local time when server sends updates
    setLocalTimeRemaining(gameState.timeRemaining);
    lastServerUpdateRef.current = Date.now();
    
    // Only start local countdown if it's my turn or single player
    const shouldRunTimer = (isMyTurn || isSinglePlayer) && gameState.timeRemaining > 0;
    setTimerActive(shouldRunTimer);

    if (shouldRunTimer) {
      console.log('[Timer Debug] Starting local timer countdown from:', gameState.timeRemaining);
      
      timerIntervalRef.current = setInterval(() => {
        setLocalTimeRemaining(prevTime => {
          const newTime = Math.max(0, prevTime - 1);
          
          // Sync with server every 5 seconds or when time gets low
          const timeSinceLastUpdate = Date.now() - lastServerUpdateRef.current;
          if (timeSinceLastUpdate > 5000 || newTime <= 3) {
            // Request fresh state from server
            fetchUpdatedGameState();
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState.timeRemaining, gameState.currentTurn, isMyTurn, isSinglePlayer]);

  // Use local time for display, fallback to server time
  const displayTimeRemaining = timerActive ? localTimeRemaining : gameState.timeRemaining;
  const timePercent = gameState.timePerTurn > 0 ? (displayTimeRemaining / gameState.timePerTurn) * 100 : 0;

  const getTimerColor = () => {
    if (gameState.timeRemaining > 10) return 'primary';
    if (gameState.timeRemaining > 5) return 'warning';
    return 'error';
  };

  const handleSentenceChange = (e) => {
    setSentence(e.target.value);
  };

    const updateOptimistically = (updates) => {
    setOptimisticGameState(prevState => ({ ...prevState, ...updates }));
  };
  
  const handleSubmit = async () => {
    if (!sentence.trim() || submitting) return;
    
    setSubmitting(true);
    const currentSentence = sentence.trim();
    
    // Immediately clear input and show optimistic message
    setSentence('');
    
    // Create optimistic message with pending status
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: `${user.fname} ${user.lname}`,
      content: currentSentence,
      timestamp: new Date(),
      grammarStatus: 'PROCESSING', // New status to show it's being processed
      grammarFeedback: 'Processing...',
      isOptimistic: true,
      containsWordBomb: false,
      wordUsed: '',
      roleAppropriate: null
    };
    
    // Add optimistic message immediately
    setLocalMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const token = await getToken();
      if (!token) {
        setSubmitting(false);
        alert('Authentication error. Please log in again.');
        return;
      }

      // Send to backend
      const headers = { 'Authorization': `Bearer ${token}` };
      await sendMessage(`/app/game/${gameState.sessionId}/word`, 
                       { word: currentSentence }, headers);

      // For single player, optimistically advance turn
      if (isSinglePlayer) {
        const nextTurn = (gameState.currentTurn || 0) + 1;
        setLocalTimeRemaining(gameState.timePerTurn || 30);
        
        updateOptimistically({
          currentTurn: nextTurn,
          currentCycle: nextTurn,
          timeRemaining: gameState.timePerTurn || 30
        });
      }

    } catch (error) {
      console.error('Error sending sentence:', error);
      // Remove optimistic message on error
      setLocalMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setSentence(currentSentence); // Restore input
      alert('Failed to send sentence. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Non-blocking state refresh
  const fetchUpdatedGameState = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/sessions/${gameState.sessionId}/state`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const updatedState = await response.json();
        if (typeof onGameStateUpdate === 'function') {
          onGameStateUpdate(updatedState);
        }
        setOptimisticGameState(updatedState);
      }
    } catch (error) {
      console.error('Error fetching updated game state:', error);
    }
  }, [gameState.sessionId, getToken, onGameStateUpdate]);

  // Use optimistic state for display
  const displayGameState = isSinglePlayer ? optimisticGameState : gameState;

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Update optimistic state when real game state changes
  useEffect(() => {
    if (!isSinglePlayer || !isProcessing) {
      setOptimisticGameState(gameState);
    }
  }, [gameState, isSinglePlayer, isProcessing]);

   // Add this new component at the top of your file after imports
  
    // const CycleTransitionOverlay = ({ isActive, cycle }) => {
    //   if (!isActive) return null;
      
    //   return (
    //     <Box sx={{ 
    //       height: '100vh',
    //       display: 'flex',
    //       flexDirection: 'column',
    //       overflow: 'hidden',
    //       bgcolor: '#f5f5f5'
    //     }}>
    //       <Box sx={{ textAlign: 'center', maxWidth: '600px', p: 4 }}>
    //         <Typography variant="h3" sx={{ mb: 2, color: '#5F4B8B' }}>
    //           Cycle {cycle-1} Completed!
    //         </Typography>
    //         <Typography variant="h5" sx={{ mb: 4 }}>
    //           Starting Cycle {cycle}
    //         </Typography>
    //         <CircularProgress size={60} sx={{ color: '#5F4B8B' }} />
    //         <Typography variant="body1" sx={{ mt: 4, fontStyle: 'italic' }}>
    //           New story prompts and word availability are being refreshed...
    //         </Typography>
    //       </Box>
    //     </Box>
    //   );
    // };

  // Add this effect to detect cycle changes
  useEffect(() => {
    // Only show cycle transitions in multiplayer mode
    if (!isSinglePlayer && gameState.currentCycle !== null && previousCycle !== null && gameState.currentCycle > previousCycle) {
      console.log(`[GamePlay Debug] Cycle changed from ${previousCycle} to ${gameState.currentCycle}`);
      setCycleTransitionActive(true); // Show full-screen overlay
      setShowCycleTransition(true);   // Show top banner notification

      // Hide full-screen overlay after a delay
      const fullScreenTimer = setTimeout(() => {
        setCycleTransitionActive(false);
      }, 4000); // Duration for full-screen overlay

      // Hide top banner after a shorter delay
      const bannerTimer = setTimeout(() => {
        setShowCycleTransition(false);
      }, 5000); // Duration for top banner

      setPreviousCycle(gameState.currentCycle);

      return () => {
        clearTimeout(fullScreenTimer);
        clearTimeout(bannerTimer);
      };
    } else if (previousCycle === null && gameState.currentCycle !== null) {
      // Initialize previousCycle if it's the first time we get a cycle number
      setPreviousCycle(gameState.currentCycle);
    }
  }, [gameState.currentCycle, previousCycle, isSinglePlayer]);

  // In the game status header
  const totalCycles = gameState.turnCyclesConfig || Math.ceil(gameState.totalTurns / (gameState.players?.length || 1));
  const isLastCycle = gameState.currentCycle === totalCycles;

// Update the cycle display string calculation
const cycleDisplayString = isSinglePlayer 
  ? `Turn: ${gameState.currentTurn || 0} / ${gameState.totalTurns || 0}`
  : `Cycle ${gameState.currentCycle || 0}/${gameState.totalCycles || 0} (Turn ${gameState.turnsInCurrentCycle || 0}/${gameState.playersPerCycle || 0})`;

  const turnDisplayString = `Turn: ${gameState.currentTurn || 0} / ${gameState.totalTurns || 0}`;

 return (
  <>
    
    
    <Box sx={{ 
      height: '90vh',
      display: 'flex',
      flexDirection: 'column', 
      p: 4, // Added horizontal padding
      gap: 2, // Reduced gap
    }}>
   
      {/* Story Prompt Section */}
      <Paper sx={{ 
        p: 3,
        borderRadius: '12px',
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        border: '4px solid #5F4B8B',
        boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
        transform: 'translateY(-2px)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
            Story Prompt
          </Typography>
          <Chip 
            label={`${isSinglePlayer ? `Turn ${gameState.currentTurn}` : `Cycle ${gameState.currentCycle}`}`}
            color="warning" 
            size="small"
          />
        </Box>
        <Typography sx={{ ...pixelText, mt: 1, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
          {storyPrompt}
        </Typography>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex',
        flex: 1,
        gap: 2,
      }}>
        {/* Left Side - Players Circle and Input */}
        <Box sx={{ 
          position: 'relative',
          flex: 1, // Changed from flex: 2 to flex: 1
          display: 'flex',
          flexDirection: 'column',
          minWidth: '40vh', // Added to ensure minimum width
          maxWidth: '130vh', 
        }}>
          {/* Players Circle Area */}
          <Paper sx={{ 
            height: '100%',
            p: 3,
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
             border: '4px solid #5F4B8B',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
            },
          backgroundImage: `url(${bgGamePlay})`,
          backgroundSize: 'cover',          // Use 'cover' to fill the box or 'contain' to show the whole image
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
          }}>
            {/* Center player */}
            <Box sx={{ 
              position: 'relative',
              width: '500px',
              height: '500px'
            }}>
              {/* Current Player in Center */}
              <Avatar
                sx={{
                  position: 'absolute',
                  top: '45%',
                  left: '72%',
                  transform: 'translate(-50%, -50%)',
                  width: 80,
                  height: 80,
                  bgcolor: '#5F4B8B',
                  border: '3px solid white',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                {gameState.currentPlayer?.name?.charAt(0) || '?'}
              </Avatar>

              {/* Other players in circle */}
              {gameState.players?.map((player, index, array) => {
                if (player.userId === gameState.currentPlayer?.userId) return null;
                const angle = (2 * Math.PI * index) / (array.length - 1);
                const radius = 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <Avatar
                    key={player.userId}
                    sx={{
                      position: 'absolute',
                      top: '75%',
                      left: '48%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      width: 80,
                      height: 80,
                      bgcolor: '#9575CD',
                      border: '2px solid white'
                    }}
                     src={player.profilePicture || undefined}
                  >
                   
                    {player.name?.charAt(0)}
                  </Avatar>
                );
              })}
            </Box>
          </Paper>
      {/* Word Bank Button */}
      <Box
        onClick={() => setIsWordBankOpen(!isWordBankOpen)}
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 80,
          height: 80,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          animation: isWordBankOpen ? 'float 2s ease-in-out infinite' : 'none',
          transform: isWordBankOpen ? 'rotate(-15deg)' : 'none',
          zIndex: 2,
          '&:hover': {
            transform: isWordBankOpen ? 'rotate(-15deg) scale(1.1)' : 'scale(1.1)',
          },
          '@keyframes float': {
            '0%, 100%': {
              transform: 'rotate(-15deg) translateY(0)',
            },
            '50%': {
              transform: 'rotate(-15deg) translateY(-10px)',
            },
          },
        }}
      >
        {isWordBankOpen ? <BagOpen /> : <BagClosed />}
      </Box>

      {/* Word Bank Popup */}
      <Fade in={isWordBankOpen}>
  <Paper sx={{ 
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 300,
    maxHeight: '60vh',
    overflowY: 'auto',
    p: 2,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    border: '2px solid #5F4B8B',
    // Add transition for smoother fade
    transition: 'opacity 0.3s ease',
    opacity: isWordBankOpen ? 1 : 0,
    visibility: isWordBankOpen ? 'visible' : 'hidden'
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>WORD BANK</Typography>
      <IconButton onClick={() => setIsWordBankOpen(false)}>
        <Close />
      </IconButton>
    </Box>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {gameState.wordBank && gameState.wordBank.map((wordItem, index) => (

        <Tooltip
        
          key={index}
          title={
            <Box sx={{ ...pixelText, p: 1 }}>
              <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                {wordItem.description || "NO DESCRIPTION AVAILABLE"}
              </Typography>
              {wordItem.exampleUsage && (
                <Typography sx={{ fontStyle: 'italic' }}>
                  EXAMPLE: "{wordItem.exampleUsage}"
                </Typography>
              )}
            </Box>
          }
          arrow
        >
          <Chip 
            label={wordItem.word}
            sx={{
              ...pixelText,
              backgroundColor: 'white',
              border: '2px solid #5F4B8B',
              '&:hover': {
                backgroundColor: '#f0edf5',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setSentence(prev => prev ? `${prev} ${wordItem.word}` : wordItem.word);
            }}
          />
        </Tooltip>
      ))}
      {(!gameState.wordBank || gameState.wordBank.length === 0) && (
        <Typography sx={{ ...pixelText, color: 'text.secondary' }}>
          NO WORDS AVAILABLE IN WORD BANK.
        </Typography>
      )}
    </Box>
  </Paper>
</Fade>
          </Box>

        {/* Right Side - Leaderboard and Chat */}
        <Box sx={{ 
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: '80vh',
        }}>
          {/* Leaderboard */}
          <Paper sx={{ 
            p: 3,
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            border: '4px solid #5F4B8B',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
            }
          }}>
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
              Leaderboard
            </Typography>
            <List dense disablePadding>
              {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
                <ListItem key={player.id || player.userId || index} divider={index < leaderboard.length - 1}>
                  <Avatar sx={{ bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B', mr: 2, width: 30, height: 30, fontSize: '0.875rem' }}>
                    {index + 1}
                  </Avatar>
                  <ListItemText 
                    primary={player.name || 'Player'} 
                    secondary={player.role || 'Role N/A'} 
                    sx={{ '& .MuiTypography-root': pixelText }}
                  />
                  <Typography variant="body1" fontWeight="bold" sx={pixelText}>
                    {player.score}
                  </Typography>
                </ListItem>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={pixelText}>Leaderboard is empty.</Typography>
              )}
            </List>
          </Paper>

          {/* Chat Area */}
          <Paper sx={{ 
            flex: 1,
            display: 'flex',
              overflowY: 'auto',
            flexDirection: 'column',
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
             border: '4px solid #5F4B8B',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
            transform: 'translateY(-2px)',
              maxHeight: 'calc(60vh - 120px)', // Add max height
          '&::-webkit-scrollbar': {        // Customize scrollbar
            width: '8px'
          },
                    transition: 'all 0.2s ease',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
            },
            position: 'relative'
          }}>
<Box sx={{ 
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  p: 2,
  borderBottom: '1px solid rgba(0,0,0,0.12)',
  position: 'relative',
  zIndex: 1,
  bgcolor: gameState.backgroundImage ? 'rgba(0,0,0,0.5)' : 'transparent'
}}>
  <Typography sx={{ 
    ...pixelHeading,
    color: '#5F4B8B',
  }}>
    Chat Here
  </Typography>

  <Box sx={{ 
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  }}>
    <LinearProgress 
      variant="determinate" 
      value={timePercent}
      color={getTimerColor()}
      sx={{
        width: 80,
        height: 8,
        border: '2px solid #5F4B8B',
        borderRadius: '5px',
        bgcolor: 'rgba(255,255,255,0.2)',
        '& .MuiLinearProgress-bar': {
          borderRadius: '5px',
          transition: 'transform 1s linear'
        }
      }}
    />
    <Typography sx={{
      ...pixelText,
      color:'#5F4B8B',
      minWidth: 40,
      fontSize: '0.8rem'
    }}>
      {Math.ceil(gameState.timeRemaining)}s
    </Typography>
  </Box>
</Box>

            
            
            <Box sx={{ 
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              position: 'relative',
              zIndex: 1
            }}>
     
{localMessages.map((msg, index) => (
  <Box
    key={msg.id || index}
    sx={{
      display: 'flex',
      justifyContent: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
      mb: 1,
      opacity: msg.isOptimistic ? 0.7 : 1, // Dim optimistic messages
    }}
  >
    <Box sx={{
      maxWidth: '70%',
      p: 1,
      borderRadius: '8px',
      bgcolor: msg.senderId === user?.id ? '#5F4B8B' : '#f0f0f0',
      color: msg.senderId === user?.id ? 'white' : 'black',
      position: 'relative'
    }}>
      {/* Add processing indicator */}
      {msg.grammarStatus === 'PROCESSING' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <CircularProgress size={12} sx={{ mr: 1, color: 'inherit' }} />
          <Typography sx={{ ...pixelText, fontSize: '6px' }}>
            Processing...
          </Typography>
        </Box>
      )}
      
      <Typography sx={{fontSize: isMobile ? '14px' : '18px' }}>
        <strong>{msg.senderName}:</strong> {msg.content}
      </Typography>
      
      {/* Show role if available */}
      {msg.role && (
        <Typography sx={{ 

          fontSize: '16px', 
          opacity: 0.8,
          fontStyle: 'italic' 
        }}>
          as {msg.role}
        </Typography>
      )}
      
      <Typography sx={{ 

        fontSize: '16px', 
        opacity: 0.7, 
        mt: 0.5 
      }}>
        {new Date(msg.timestamp).toLocaleTimeString()}
      </Typography>
      
      {/* Grammar feedback - only show for user's own messages and when not processing */}
      {msg.grammarFeedback && msg.senderId === user?.id && msg.grammarStatus !== 'PROCESSING' && (
        <Collapse in={true}>
          <Paper sx={{ 
            mt: 1, 
            p: 1, 
            bgcolor: 'rgba(255,255,255,0.9)',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '0.75rem'
          }}>
            <Typography sx={{whiteSpace: 'pre-wrap', color: 'black' }}>
              {msg.grammarFeedback}
            </Typography>
          </Paper>
        </Collapse>
      )}
    </Box>
  </Box>
))}
              <div ref={chatEndRef} />
            </Box>

            {/* Congratulatory notice and proceed button after game ends */}
            {gameEnded && (
              <Box sx={{
                p: 2,
                borderTop: '1px solid rgba(0,0,0,0.12)',
                bgcolor: 'rgba(255,255,255,0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                mt: 2
              }}>
                <Typography sx={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '14px',
                  color: '#5F4B8B',
                  fontWeight: 'bold',
                  mb: 1,
                  textAlign: 'center'
                }}>
                  🎉 Congratulations! You've finished the game! 🎉
                </Typography>
                <Typography sx={{
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '10px',
                  color: '#333',
                  mb: 2,
                  textAlign: 'center'
                }}>
                  Click below to proceed to the comprehension check and see your results.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: '12px',
                    backgroundColor: '#5F4B8B',
                    borderRadius: '8px',
                    px: 4,
                    py: 1.5,
                    boxShadow: '2px 2px 0px rgba(0,0,0,0.2)',
                    '&:hover': { backgroundColor: '#4a3a6d' }
                  }}
                  disabled={proceeding}
                  onClick={() => {
                    setProceeding(true);
                    if (onProceedToResults) onProceedToResults(); // <-- This should call the prop
                  }}
                >
                  Proceed to Comprehension Check
                </Button>
              </Box>
            )}

            {/* Input Area - Hide if game ended */}
            {!gameEnded && (
              <Box sx={{ 
                p: 2,
                borderTop: '1px solid rgba(0,0,0,0.12)',
                bgcolor: 'rgba(255,255,255,0.95)',
                position: 'relative',
                zIndex: 1
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={isMyTurn ? "Type your message..." : "Waiting for your turn..."}
                    value={sentence}
                    onChange={handleSentenceChange}
                    disabled={!isMyTurn || submitting}
                    onKeyPress={(ev) => {
                      if (ev.key === 'Enter' && !ev.shiftKey && isMyTurn) {
                        handleSubmit();
                        ev.preventDefault();
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '50px',
                        bgcolor: 'white'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!isMyTurn || submitting || !sentence.trim()}
                    sx={{
                      bgcolor: '#5F4B8B',
                      borderRadius: '50px',
                      minWidth: '40px',
                      width: '40px',
                      height: '40px',
                      p: 0,
                      '&:hover': { bgcolor: '#4a3a6d' },
                      '&.Mui-disabled': { bgcolor: '#c5c5c5' }
                    }}
                  >
                    {submitting ? <CircularProgress size={20} color="inherit"/> : '➤'}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

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

        {/* Cycle change notification */}
        {/* {showCycleTransition && (
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
      )} */}

      {/* Single-player turn notification */}
      <Snackbar
        open={isSinglePlayer && isProcessing}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          Turn {gameState.currentTurn} completed. Starting next turn...
        </Alert>
      </Snackbar>

      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
          }
        `}
      </style>
    </Box>
   

  </>
);
};

export default GamePlay;