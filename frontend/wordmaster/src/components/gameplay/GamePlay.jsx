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
  Badge,
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import { BagClosed, BagOpen } from '../../assets/BagIcons';
import { 
  Close,
  Games,
  AutoFixHigh ,
  ExpandMore
} from '@mui/icons-material';
import bgGamePlay from '../../assets/bg-gameplay.png';
import bgpurple from '../../assets/bgpurple.gif';
// import CardDisplay from './CardDisplay';  // Import the CardDisplay component

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';


const GamePlay = ({ 
  gameState, 
  stompClient, 
  sendMessage, 
  sendAiForAnalysis,
  addOptimisticMessage,
  onGameStateUpdate, 
  gameEnded, 
  onProceedToResults,
  playerCards = [],
  onRefreshCards,
  loadingCards = false,
  selectedCard,
  onCardSelect,
  onCardDeselect,
  onUseCard,
  pendingCardUse = false
}) => {
  const { sessionId } = useParams(); // Ensure sessionId is available if used directly for subscriptions
  const { user, getToken } = useUserAuth();
  const [sentence, setSentence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [showTurnComplete, setShowTurnComplete] = useState(false);
  const [pointsData, setPointsData] = useState({ points: 0, reason: '' });
  const [pointsNotification, setPointsNotification] = useState(false);
  // Add processing state specifically for message processing
  const [messageProcessing, setMessageProcessing] = useState(false);
  const [rolePrompt, setRolePrompt] = useState('');
  const [previousCycle, setPreviousCycle] = useState(gameState.currentCycle);
  const [cycleTransitionActive, setCycleTransitionActive] = useState(false);
  const [showCycleTransition, setShowCycleTransition] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]); // Already present
  const [cardResult, setCardResult] = useState(null);
  const [cardResultOpen, setCardResultOpen] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [wordUsedNotification, setWordUsedNotification] = useState(false);
  const [usedWordMessage, setUsedWordMessage] = useState('');
  const chatEndRef = useRef(null);
  const theme = useTheme();
  const ismobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isProcessing, setIsProcessing] = useState(false); // For single-player processing
  const [localMessages, setLocalMessages] = useState([]);
  const [optimisticGameState, setOptimisticGameState] = useState(gameState); // Add this line
  const processingTimeoutRef = useRef(null); // Add this line
  const isSinglePlayer = gameState.players?.length === 1;
  const [localTimeRemaining, setLocalTimeRemaining] = useState(gameState.timeRemaining);
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef(null);
  const lastServerUpdateRef = useRef(Date.now());
  const [proceeding, setProceeding] = useState(false); // <-- Add this line
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [writingHints, setWritingHints] = useState([]); // Add this state
  const [openFeedbackIndex, setOpenFeedbackIndex] = useState(null);
  
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '12px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  // Helper: get normalized wordbank list from gameState
  const getWordBank = () => {
    if (!gameState || !gameState.wordBank) return [];
    return gameState.wordBank.map(w => (typeof w === 'string' ? w.trim().toLowerCase() : (w.word || '').toLowerCase()));
  };

  // Render message text with highlighted wordbank terms
  const renderHighlighted = (text) => {
    if (!text) return text;
    const words = getWordBank();
    if (!words || words.length === 0) return text;

    // Build regex to match whole words (case-insensitive)
    const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (escaped.length === 0) return text;
    const re = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'ig');

    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) parts.push({ text: text.substring(lastIndex), highlight: false });

    return parts.map((p, i) => p.highlight ? (
      <span key={i} style={{ fontWeight: '700', textDecoration: 'underline', color: '#FF5722' }}>{p.text}</span>
    ) : (
      <span key={i}>{p.text}</span>
    ));
  };
//   useEffect(() => {
//   if (gameState.messages) {
//     // Sort messages by timestamp
//     const sortedMessages = [...gameState.messages].sort((a, b) => 
//       new Date(a.timestamp) - new Date(b.timestamp)
//     );
    
//     // Add debug logging for roleAppropriate
//     sortedMessages.forEach(msg => {
//       console.log(`Message: "${msg.content.substring(0, 20)}..." - roleAppropriate: ${msg.roleAppropriate} (type: ${typeof msg.roleAppropriate})`);
//     });
    
//     setLocalMessages(sortedMessages);
//   }
// }, [gameState.messages]);

useEffect(() => {
  if (gameState.messages) {
    // Sort messages by timestamp
    const sortedMessages = [...gameState.messages].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
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
    if (!sentence.trim() || submitting || messageProcessing) return;
    
    setSubmitting(true);
    setMessageProcessing(true); // Start processing state
    const currentSentence = sentence.trim();
    
    // Immediately clear input
    setSentence('');
    
    // Create optimistic message with better ID
    const optimisticMessage = {
      id: `optimistic-${user.id}-${Date.now()}`, // Better unique ID
      senderId: user.id,
      senderName: `${user.fname} ${user.lname}`,
      content: currentSentence,
      timestamp: new Date(),
      grammarStatus: 'PROCESSING',
      grammarFeedback: 'Processing your message...',
      isOptimistic: true,
      containsWordBomb: false,
      wordUsed: '',
      roleAppropriate: null
    };
    
    // Add optimistic message immediately to canonical state
    if (typeof addOptimisticMessage === 'function') {
      addOptimisticMessage({
        id: optimisticMessage.id,
        senderId: optimisticMessage.senderId,
        senderName: optimisticMessage.senderName,
        content: optimisticMessage.content,
        timestamp: optimisticMessage.timestamp,
        grammarStatus: optimisticMessage.grammarStatus,
        grammarFeedback: optimisticMessage.grammarFeedback,
        isOptimistic: true
      });
    } else {
      setLocalMessages(prev => [...prev, optimisticMessage]);
    }
    
    try {
      const token = await getToken();
      if (!token) {
        // Remove optimistic message on auth error
        setLocalMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setSubmitting(false);
        setMessageProcessing(false); // Reset processing state
        alert('Authentication error. Please log in again.');
        return;
      }

      // Send to backend
      const headers = { 'Authorization': `Bearer ${token}` };
  await sendMessage(`/app/game/${gameState.sessionId}/word`, 
           { word: currentSentence, clientMessageId: optimisticMessage.id });

      // Trigger AI grammar analysis (background). If parent passed a helper, use it; otherwise call endpoint directly
      if (typeof sendAiForAnalysis === 'function') {
        try { sendAiForAnalysis(currentSentence); } catch (e) { console.error('sendAiForAnalysis error', e); }
      } else {
        try {
          fetch(`${API_URL}/api/ai/submit?sessionId=${sessionId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: currentSentence, task: 'grammar_check' })
          }).catch(e => console.error('AI submit failed', e));
        } catch (e) { console.error('AI submit error', e); }
      }

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
      // Remove optimistic message on error and restore input
      setLocalMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setSentence(currentSentence);
      setMessageProcessing(false); // Reset processing state on error
      alert('Failed to send sentence. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Add effect to monitor message processing completion
  useEffect(() => {
    if (messageProcessing && localMessages.length > 0) {
      // Check if the latest message from current user has completed processing
      const userMessages = localMessages.filter(msg => msg.senderId === user?.id);
      const latestUserMessage = userMessages[userMessages.length - 1];
      
      if (latestUserMessage && 
          latestUserMessage.grammarStatus !== 'PROCESSING' && 
          latestUserMessage.grammarFeedback !== 'Processing your message...' &&
          !latestUserMessage.isOptimistic) {
        console.log('Message processing completed, re-enabling input');
        setMessageProcessing(false);
      }
    }
  }, [localMessages, messageProcessing, user?.id]);

  // Enhanced handleUseCard function
  // const handleUseCard = async (cardId) => {
  //   if (!sentence.trim()) {
  //     setCardResult({
  //       success: false,
  //       message: 'Please write a sentence first before using a card!'
  //     });
  //     setCardResultOpen(true);
  //     return;
  //   }

  //   if (!isMyTurn) {
  //     setCardResult({
  //       success: false,
  //       message: "You can only use cards during your turn."
  //     });
  //     setCardResultOpen(true);
  //     return;
  //   }

  //   if (pendingCardUse) {
  //     setCardResult({
  //       success: false,
  //       message: "A card is already being processed..."
  //     });
  //     setCardResultOpen(true);
  //     return;
  //   }

  //   try {
  //     // Use the provided onUseCard function from props if available
  //     if (onUseCard) {
  //       const result = await onUseCard(cardId, sentence);
  //       setCardResult(result);
  //       setCardResultOpen(true);

  //       // If the card was used successfully, show points notification
  //       if (result.success) {
  //         setPointsData({
  //           points: result.pointsAwarded || 0,
  //           reason: `Card bonus: ${result.cardName || 'Power Card'}`
  //         });
  //         setPointsNotification(true);
  //       }
  //       return;
  //     }

  //     // Fallback implementation if parent didn't provide onUseCard
  //     const token = await getToken();
  //     const response = await fetch(`${API_URL}/api/cards/use/${cardId}`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({ message: sentence })
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       setCardResult(result);
  //       setCardResultOpen(true);
        
  //       if (result.success) {
  //         setPointsData({
  //           points: result.pointsAwarded || 10,
  //           reason: `Card bonus!`
  //         });
  //         setPointsNotification(true);
          
  //         // Refresh cards to update the UI
  //         if (onRefreshCards) {
  //           onRefreshCards();
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error using card:', error);
  //     setCardResult({
  //       success: false,
  //       message: 'Error using card: ' + (error.message || 'Unknown error')
  //     });
  //     setCardResultOpen(true);
  //   }
  // };

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
      position: 'relative',
      p: 4, // Added horizontal padding
      gap: 2, // Reduced gap

    }}>
   
      {/* Story Prompt Section */}
      <Paper sx={{ 
  p: 3,
  width: '96.5%',
  borderRadius: '12px',
  bgcolor: 'rgba(255, 255, 255, 0.9)',
  border: '4px solid #5F4B8B',
  boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
  height: '130px', // Fixed height instead of maxHeight
  minHeight: '130px', // Ensures it won't shrink below this
  overflowY: 'auto',  // Enable scrolling
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0,0,0,0.05)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#5F4B8B',
    borderRadius: '3px',
  }
}}>
       <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    flexShrink: 0, // Prevent header from shrinking
    mb: 2 // Add some margin below header
  }}>
          <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
            Story Prompt
          </Typography>
          <Chip 
            label={`${isSinglePlayer ? `Turn ${gameState.currentTurn}` : `Cycle ${gameState.currentCycle}`}`}
            color="warning" 
            size="small"
          />
        </Box>
        {/* Scrollable content area */}
  <Box sx={{
    flex: 1, // Take up remaining space
    overflowY: 'auto', // Enable vertical scrolling
    pr: 1, // Add padding to prevent content from touching scrollbar
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(95, 75, 139, 0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#5F4B8B',
      borderRadius: '4px',
      '&:hover': {
        background: '#4a3a6d',
      }
    }
  }}>
    <Typography sx={{ 
      whiteSpace: 'pre-wrap',
      fontSize: '1.1rem',
      lineHeight: '1.6'
    }}>
      {storyPrompt}
    </Typography>
  </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex',
        flex: 1,
        gap: 2,
        height: '100vh',
        paddingBottom: 4,
        width: '99%',
        margin: 0,
      }}>
        {/* Left Side - Players Circle and Input */}
        <Box sx={{ 
          position: 'relative',
          flex: 1, // Changed from flex: 2 to flex: 1
          display: 'flex',
          flexDirection: 'column',
          minWidth: '40vh', // Added to ensure minimum width
          maxWidth: '130vh', 
           border: '4px solid #5F4B8B',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgpurple})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: '20px', // <-- Add this line for rounded corners
          overflow: 'hidden',
          minHeight: '80vh', // Ensure it has a minimum height
          
        }}>

       {/* Trophy Button with Hover Leaderboard */}
<Box
  sx={{
    position: 'absolute',
    top: 24, // adjust as needed
    left: 0,
    width: '100%',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    px: 3,
    pointerEvents: 'none',

  }}
>
  {/* Main container for icon and cycle indicator */}
  {/* Left: Trophy + Leaderboard */}
  <Box
    sx={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      pointerEvents: 'auto',
      top: 55,
      '&:hover .leaderboard-popup': {
        opacity: 1,
        visibility: 'visible'
      }
    }}
  >
    <IconButton
      sx={{
        color: '#FFD700',
        backgroundColor: 'rgba(0,0,0,0.3)',
        '&:hover': {
          backgroundColor: 'rgba(0,0,0,0.5)'
        }
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M19 5H5V19H19V5Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 9V15" stroke="currentColor" strokeWidth="2"/>
        <path d="M15 12H9" stroke="currentColor" strokeWidth="2"/>
        <path d="M7 19V15" stroke="currentColor" strokeWidth="2"/>
        <path d="M17 19V15" stroke="currentColor" strokeWidth="2"/>
      </svg>
    </IconButton>

    {/* Leaderboard Popup */}
    <Box
      className="leaderboard-popup"
      sx={{
        position: 'absolute',
        top: 40,
        left: 0,
        width: 280,
        maxHeight: '70vh',
        borderRadius: '8px',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(54, 57, 63, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        opacity: 0,
        visibility: 'hidden',
        transition: 'all 0.2s ease',
        mt: 1,
        zIndex: 200,
      }}
    >
      {/* Leaderboard Header */}
      <Box sx={{
        backgroundColor: 'rgba(47, 49, 54, 0.7)',
        p: 1.5,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Typography sx={{
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          flexGrow: 1
        }}>
          LEADERBOARD
        </Typography>
        <Box sx={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#43b581',
          mr: 1
        }}/>
        <Typography sx={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px'
        }}>
          {leaderboard.length} players
        </Typography>
      </Box>
      {/* Leaderboard List */}
      <List dense sx={{ p: 0 }}>
        {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
          <ListItem key={player.id} sx={{
            px: 2,
            py: 1,
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(79, 84, 92, 0.3)'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Rank */}
              <Typography sx={{
                minWidth: '24px',
                color: index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                fontSize: '14px',
                textAlign: 'center',
                mr: 1.5
              }}>
                #{index + 1}
              </Typography>
              {/* Avatar */}
              <Avatar sx={{
                width: 32,
                height: 32,
                mr: 1.5,
                backgroundColor: 'rgba(114, 137, 218, 0.7)'
              }}>
                {player.name?.charAt(0) || '?'}
              </Avatar>
              {/* Name + Role */}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {player.name || 'Player'}
                </Typography>
                <Typography sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px'
                }}>
                  {player.role || ' '}
                </Typography>
              </Box>
              {/* Score */}
              <Box sx={{
                backgroundColor: 'rgba(114, 137, 218, 0.2)',
                borderRadius: '4px',
                px: 1.5,
                py: 0.5,
                color: 'white',
                fontWeight: 600,
                fontSize: '12px'
              }}>
                {player.score}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  </Box>
  {/* Right: Cycle/Turn Indicator */}
  <Box
    sx={{
      borderRadius: '20px',
      bgcolor: 'rgba(0,0,0,0.7)',
      px: 2,
      py: 1,
      display: 'flex',
      alignItems: 'center',
      minWidth: '60px',
      pointerEvents: 'auto',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.1)',
      left: -50,
      top: 55,
      position: 'relative',
    }}
  >
    <Typography sx={{
      color: 'white',
      fontSize: '13px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap'
    }}>
      {cycleDisplayString}
    </Typography>
  </Box>
</Box>


          {/* Players Circle Area */}
          <Paper sx={{ 
            height: '100%',
            p: 3,
            borderRadius: '12px',
            backgroundColor: 'transparent',
             border: '4px solid #5F4B8B',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
          }}>
            {/* Turn Indicator Header */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '97.5%',
              p: 2,
              backgroundColor: 'rgba(95, 75, 139, 0.85)',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              textAlign: 'center',
              backdropFilter: 'blur(-4px)'
            }}>
              <Typography sx={{
                ...pixelHeading,
                color: 'white',
                textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                fontSize: '13px'
              }}>
                {/* {isMyTurn ? "YOUR TURN" : "CURRENT TURN"} */}
                {isMyTurn ? "YOUR TURN" : `${gameState.currentPlayer?.name || "Player"}'s TURN`}
              </Typography>
            </Box>

            {/* Current Player Spotlight */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              mt: 2,
              p: 3,
              borderRadius: '50%',
              width: 230,
              height: 230,
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.3) 100%)',
              boxShadow: isMyTurn ? '0 0 25px 10px rgba(95, 75, 139, 0.6)' : 'none',
              border: isMyTurn ? '4px solid #FFD700' : '4px solid #5F4B8B',
              animation: isMyTurn ? 'pulse 2s infinite' : 'none'
            }}>
              <Avatar
                src={gameState.currentPlayer?.profilePicture || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: '#5F4B8B',
                  border: '4px solid white',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  mb: 2
                }}
              >
                {gameState.currentPlayer?.name?.charAt(0) || '?'}
              </Avatar>
              <Typography sx={{
                ...pixelHeading,
                color: '#5F4B8B',
                fontSize: '14px',
                textAlign: 'center',
                mb: 0.5
              }}>
                {gameState.currentPlayer?.name || 'Unknown Player'}
              </Typography>
              {gameState.currentPlayer?.role && (
                <Tooltip title={gameState.currentPlayer.role}
                  arrow
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: '0.9rem', // Increase as needed
                        letterSpacing: '0.5px',
                        p: 2,
                      }
                    }
                  }}
                >                 
                   <Chip 
                    label={gameState.currentPlayer.role} 
                    size="small"
                    sx={{ 
                      ...pixelText,
                      bgcolor: 'rgba(95, 75, 139, 0.2)',
                      border: '1px solid #5F4B8B'
                    }}
                  />
                </Tooltip>
              )}
            </Box>

            {/* Other Players in Circle
            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
              mt: 2
            }}>
              {gameState.players?.map((player, index) => {
                // Skip current player as they're shown in the spotlight
                if (player.userId === gameState.currentPlayer?.userId) return null;
                
                return (
                  <Box 
                    key={player.userId}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: 0.7,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <Avatar
                      src={player.profilePicture || undefined}
                      sx={{
                        width: 50,
                        height: 50,
                        bgcolor: '#9575CD',
                        border: '2px solid white'
                      }}
                    >
                      {player.name?.charAt(0) || '?'}
                    </Avatar>
                    <Typography sx={{
                      ...pixelText,
                      fontSize: '8px',
                      mt: 0.5
                    }}>
                      {player.name || 'Player'}
                    </Typography>
                  </Box>
                );
              })}
            </Box> */}

            {/* Add animated style for turn indicator pulse effect */}
            <style jsx="true">{`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
              }
            `}</style>
          </Paper>

   {/* Word Bank Container - Always visible with matching aesthetics */}
<Paper sx={{ 
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '97%',
  p: 3, // Increased padding to match left pane style
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(8px)',
  borderTop: '4px solid #5F4B8B', // Thicker border to match left pane style
  maxHeight: '15%',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 5,
  borderRadius: '0 0 16px 16px',
  boxShadow: '0 -4px 8px rgba(0,0,0,0.1)', // Add subtle shadow for depth
}}>
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    mb: 2 // Increased margin
  }}>
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{ 
        ...pixelHeading, 
        color: '#5F4B8B', 
        fontSize: ismobile ? '12px' : '14px', // Match the font size from other headings
        textShadow: '1px 1px 0px rgba(255,255,255,0.8)' // Add subtle text shadow
      }}>
        WORD BANK
      </Typography>
      {gameState.wordBank && gameState.wordBank.length > 0 && (
        <Typography sx={{ 
          ...pixelText, 
          fontSize: '8px', 
          color: '#5F4B8B', 
          opacity: 0.6,
          mt: 0.5
        }}>
          CLICK A WORD TO ADD IT TO YOUR MESSAGE
        </Typography>
      )}
    </Box>
    <Chip 
      label={`${getWordBank().length || 0} words`} 
      size="small"
      sx={{ 
        bgcolor: 'rgba(95, 75, 139, 0.2)', // Slightly darker to match theme
        borderRadius: '8px',
        height: '22px', // Slightly larger
        border: '2px solid #5F4B8B', // Add border to match theme
        '& .MuiChip-label': {
          px: 1.5,
          fontSize: '0.7rem',
          fontWeight: 'bold',
          color: '#5F4B8B'
        }
      }}
    />
  </Box>
  
  {/* Word bank content area */}
  <Box sx={{ 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: 1.5, // Increased gap for better spacing
    pb: 1 // Add padding at bottom
  }}>
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
        placement="top"
      >
        <Chip 
          label={typeof wordItem === 'string' ? wordItem : wordItem.word}
          sx={{
            ...pixelText,
            backgroundColor: 'white',
            border: '2px solid #5F4B8B',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', // Add pixel-style shadow
            py: 0.5, // Slightly taller
            px: 0.5, // More horizontal padding
            '&:hover': {
              backgroundColor: '#f0edf5',
              transform: 'translateY(-2px) scale(1.05)', // Enhanced hover effect
              boxShadow: '3px 3px 0px rgba(95, 75, 139, 0.3)', // Deeper shadow on hover
            },
            transition: 'all 0.2s ease',
            cursor: 'pointer' // Indicate clickable
          }}
          onClick={() => {
            setSentence(prev => prev ? 
              `${prev} ${typeof wordItem === 'string' ? wordItem : wordItem.word}` : 
              (typeof wordItem === 'string' ? wordItem : wordItem.word)
            );
          }}
        />
      </Tooltip>
    ))}
    {(!gameState.wordBank || gameState.wordBank.length === 0) && (
      <Typography sx={{ 
        ...pixelText, 
        color: '#5F4B8B', 
        width: '100%', 
        textAlign: 'center', 
        py: 2,
        opacity: 0.7
      }}>
        NO WORDS AVAILABLE IN WORD BANK.
      </Typography>
    )}
  </Box>
</Paper>

      {/* Power Cards Button - Added next to Word Bank
      <Box sx={{
        position: 'absolute',
        bottom: 20,
        right: 110, // Position it to the left of the word bank
        zIndex: 2
      }}>
        <Badge
          badgeContent={playerCards.length}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '10px',
              height: '20px',
              minWidth: '20px',
            }
          }}
        >
          <IconButton 
            onClick={() => setShowCards(!showCards)}
            sx={{
              bgcolor: '#5F4B8B',
              color: 'white',
              width: 50,
              height: 50,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              '&:hover': {
                bgcolor: '#4a3a6d',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.3s ease',
              animation: showCards ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            <AutoFixHigh />
          </IconButton>
        </Badge>
      </Box> */}

      {/* Power-Up Cards Floating at Bottom */}
{/* <Box
  sx={{
    position: 'absolute',
    bottom: 45,
    left: '48.5%',
    transform: 'translateX(-50%)',
    width: 350,
    height: 120,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 10,
    pointerEvents: 'none', // so it doesn't block other UI
    px:0,
    margin: 0
  }}
>
  {[0, 1, 2].map((i) => (
    <Box
      key={i}
      sx={{
        position: 'relative',
        width: 120,
        height: 180,
        mx: -0.2, // overlap a bit
        pointerEvents: 'auto', // enable hover/click
        zIndex: 5 + i,
        transition: 'transform 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s',
        transform: 'translateY(80px) scale(0.85)', // only top part visible
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: '12px',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-10px) scale(1.05)',
          boxShadow: '0 8px 24px rgba(95,75,139,0.25)',
          zIndex: 100,
        },
      }}
    >
      {/* <CardDisplay
        card={playerCards[i]}
        isSelected={selectedCard?.id === playerCards[i]?.id}
        onUse={handleUseCard}
        disabled={!isMyTurn || pendingCardUse}
        isProcessing={pendingCardUse && selectedCard?.id === playerCards[i]?.id}
        pixelText={pixelText}
      /> 
    </Box>
  ))}
</Box> */}

  
          </Box>

        {/* Right Side - Chat */}
        <Box sx={{ 
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: '85vh',
        }}>
          

          {/* Chat Area */}
          <Paper sx={{ 
            height: '100vh',
            flex: 1,
            display: 'flex',
            width: '100%',
            flexDirection: 'column',
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
             border: '4px solid #5F4B8B',
            boxShadow: '8px 8px 0px rgba(0,0,0,0.2)',
          '&::-webkit-scrollbar': {        // Customize scrollbar
            width: '8px'
          },
            position: 'relative',
            
          }}>
<Box sx={{ 
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  p: 2,
  borderBottom: '1px solid rgba(0,0,0,0.12)',
  position: 'relative',
  bgcolor: gameState.backgroundImage ? 'rgba(0,0,0,0.5)' : 'transparent',
  flexShrink: 0
}}>
  <Typography sx={{ 
    ...pixelHeading,
    color: '#5F4B8B',
  }}>
    Chat Here
  </Typography>

 <Box sx={{ 
    p: 0,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 1,
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
      fontSize: '0.8rem',
      ml: 1
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

  {/* Render messages, but filter out internal AI streaming chunks (isAiStream/partial)
      Also filter out the noisy AI suggestion message the user asked to hide. */}
  {localMessages
    // First, reduce to a list without duplicate (senderId+normalizedContent+timestamp second) combos
    .filter((m, idx, arr) => {
      if (!m) return false;
      const norm = (s) => (s||'').toString().trim().toLowerCase().replace(/\s+/g,' ');
      const sig = `${m.senderId||m.sender}|${norm(m.content)}|${new Date(m.timestamp).getSeconds()}`; // coarse signature
      const firstIdx = arr.findIndex(x => {
        if (!x) return false; 
        const sig2 = `${x.senderId||x.sender}|${norm(x.content)}|${new Date(x.timestamp).getSeconds()}`;
        return sig2 === sig;
      });
      return firstIdx === idx; // keep only first occurrence
    })
    .filter(m => {
    if (!m) return false;
    const content = (m.content || '').toString();
    // Hide any AI streaming/preview/temporary markers or placeholders
    if (m.isAiStream || m.partial || m.preview || m.temporary || m.isPlaceholder) return false;
    // Hide messages that are clearly just a short analyzing/processing placeholder
    const trimmed = content.trim().toLowerCase();
    if (trimmed === 'analyzing...' || trimmed === 'processing...' || trimmed === 'analysis in progress') return false;
    // Hide overly short fragments likely coming from AI partials (heuristic)
    if ((m.sender === 'AI' || m.senderName === 'AI' || m.fromAi) && trimmed.length < 20) return false;
    // If this is an optimistic user message (created locally) keep it until server replaces it
    if (m.isOptimistic && (m.senderId === user?.id || m.sender === user?.id)) return true;
    // Hide the specific noisy AI suggestion messages the user reported
    if (content.includes("Keep practicing your sentence structure") || content.includes("you'll improve even more")) return false;
    // Otherwise show final messages only
    return true;
  }).map((msg, index) => (
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
      maxWidth: '60%',
      wordBreak: 'break-word',
      p: 1,
      borderRadius: '8px',
      bgcolor: msg.senderId === user?.id ? '#5F4B8B' : '#f0f0f0',
      color: msg.senderId === user?.id ? 'white' : 'black',
      position: 'relative'
    }}>
  {/* Per-message processing indicator removed — global analyzing indicator is shown below submit button */}
      
      <Typography sx={{fontSize: ismobile ? '14px' : '18px' }}>
        <strong>{msg.senderName}:</strong> {renderHighlighted(msg.content)}
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
  <Box sx={{ position: 'relative', width: '100%' }}>
    {/* Feedback summary bar below the bubble */}
    <Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mt: 1.5,
    ml: 0,
    bgcolor: 'white',
    borderRadius: '12px',
    px: 2,
    py: 0.7,
    minWidth: '55%',
    boxShadow: '0 2px 8px rgba(95,75,139,0.10)',
    border: `1.5px solid ${getGrammarStatusColor(msg.grammarStatus)}`,
    wordBreak: 'break-word',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',

  }}
>
  <Typography
    sx={{
      fontSize: '12px',
      color: getGrammarStatusColor(msg.grammarStatus),
      fontWeight: 700,
      userSelect: 'none'
    }}
  >
    {getGrammarStatusLabel(msg.grammarStatus)}
  </Typography>
  <IconButton
    onClick={() => setOpenFeedbackIndex(openFeedbackIndex === index ? null : index)}
    sx={{
      bgcolor: '#ffffffff',
      color: 'black',
      width: 24,
      height: 24,
      borderRadius: '50%',
      p: 0,
      ml: 0.5,
      '&:hover': { bgcolor: '#cdc1e7ff' },
    }}
    size="small"
  >
    <ExpandMore sx={{ fontSize: 18 }} />
  </IconButton>
</Box>
    {/* Feedback Dropdown */}
    {openFeedbackIndex === index && (
      <Box
        ref={el => {
          if (el && el.parentElement && el.parentElement.parentElement) {
            const bubble = el.parentElement.parentElement;
            el.style.width = `${bubble.offsetWidth}px`;
          }
        }}
        sx={{
          position: 'absolute',
          right: 0,
          top: '110%',
          left: '-12px',
          minWidth: 220,
          bgcolor: 'rgba(255,255,255,0.99)',
          borderRadius: 3,
          boxShadow: '0 8px 32px 0 rgba(95,75,139,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.08)',
          border: '3px solid #5F4B8B',
          zIndex: 2000,
          p: 0,
          textAlign: 'left',
          animation: 'fadeIn 0.18s',
          overflow: 'hidden',
          mt: 1,
        }}
      >
        {/* Accent bar */}
        <Box sx={{
          width: '100%',
          height: 10,
          bgcolor: getGrammarStatusColor(msg.grammarStatus),
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          mb: 1,
        }} />
        <Box sx={{ p: 3, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: getGrammarStatusColor(msg.grammarStatus),
              mr: 1.5
            }} />
            <Typography sx={{
              fontWeight: 700,
              color: getGrammarStatusColor(msg.grammarStatus),
              fontSize: '1rem',
              letterSpacing: 0.2,
              textShadow: '0 1px 0 #fff'
            }}>
              {getGrammarStatusLabel(msg.grammarStatus)}
            </Typography>
          </Box>
          <Typography sx={{
            whiteSpace: 'pre-wrap',
            color: '#222',
            fontSize: '0.9rem',
            lineHeight: 1.7,
          }}>
            {msg.grammarFeedback}
          </Typography>
        </Box>
      </Box>
    )}
  </Box>
)}
{msg.grammarStatus === 'PERFECT' && msg.senderId === user?.id && (
  <Box sx={{ 
    position: 'absolute',
    top: -10,
    right: -10,
    animation: 'bounce 0.6s ease-in-out',
    '@keyframes bounce': {
      '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
      '40%': { transform: 'translateY(-10px)' },
      '60%': { transform: 'translateY(-5px)' }
    }
  }}>
    ⭐
  </Box>
)}
    </Box>
  </Box>
))}

  {/* NOTE: Per request, do NOT show the AI "Analyzing..." bubble inside the chat area. */}
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
                zIndex: 1,
                borderRadius: '0 0 12px 12px',
              }}>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={
                      messageProcessing 
                        ? "Processing message..." 
                        : isMyTurn 
                          ? "Type your message..." 
                          : "Waiting for your turn..."
                    }
                    value={sentence}
                    onChange={handleSentenceChange}
                    disabled={!isMyTurn || submitting || messageProcessing}
                    onKeyPress={(ev) => {
                      if (ev.key === 'Enter' && !ev.shiftKey && isMyTurn && !messageProcessing) {
                        handleSubmit();
                        ev.preventDefault();
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '50px',
                        bgcolor: messageProcessing ? '#f5f5f5' : 'white',
                        '& input': {
                          color: messageProcessing ? '#999' : 'inherit'
                        }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!isMyTurn || submitting || !sentence.trim() || messageProcessing}
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
                    {submitting || messageProcessing ? (
                      <CircularProgress size={20} color="inherit"/>
                    ) : (
                      '➤'
                    )}
                  </Button>
                </Box>
                
                {/* Analyzing indicator shown below the submit button (not inside chat) */}
                {(messageProcessing || (gameState && gameState.__aiLoading)) && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 1,
                    py: 0.5,
                    px: 2,
                    bgcolor: 'rgba(95, 75, 139, 0.06)',
                    borderRadius: '12px',
                    border: '1px solid rgba(95, 75, 139, 0.12)'
                  }}>
                    <CircularProgress size={14} sx={{ mr: 1, color: '#5F4B8B' }} />
                    <Typography sx={{
                      ...pixelText,
                      color: '#5F4B8B',
                      fontSize: '10px'
                    }}>
                      Analyzing... Please wait
                    </Typography>
                  </Box>
                )}
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

      {/* Add Card Result Notification */}
      <Snackbar
        open={cardResultOpen}
        autoHideDuration={4000}
        onClose={() => setCardResultOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setCardResultOpen(false)} 
          severity={cardResult?.success ? "success" : "warning"}
          sx={{ width: '100%' }}
        >
          {cardResult?.message || 'Card operation completed'}
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

const getGrammarFeedbackColor = (status) => {
  switch(status) {
    case 'PERFECT': return 'rgba(76, 175, 80, 0.1)';
    case 'MINOR_ERRORS': return 'rgba(255, 193, 7, 0.1)';
    case 'MAJOR_ERRORS': return 'rgba(244, 67, 54, 0.1)';
    default: return 'rgba(255,255,255,0.9)';
  }
};

const getGrammarStatusColor = (status) => {
  switch(status) {
    case 'PERFECT': return '#4CAF50';
    case 'MINOR_ERRORS': return '#FF9800';
    case 'MAJOR_ERRORS': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getGrammarStatusLabel = (status) => {
  switch(status) {
    case 'PERFECT': return 'Excellent English! 🌟';
    case 'MINOR_ERRORS': return 'Good work! 💡';
    case 'MAJOR_ERRORS': return 'Keep practicing! 📚';
    default: return 'Checking...';
  }
};

// Add writing hints based on user's role and context
const getWritingHints = () => {
  const hints = [
    "💡 Try using a word from the word bank!",
    "🎭 Remember to stay in character as " + (gameState.currentPlayer?.role || "your role"),
    "📚 Use descriptive adjectives to make your sentence more interesting",
    "🔗 Connect your idea to the story prompt above"
  ];
  
  return hints[Math.floor(Math.random() * hints.length)];
};

