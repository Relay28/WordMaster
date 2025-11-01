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
  Chip,
  Snackbar,
  Alert,
  useTheme,
  IconButton,
  Badge,
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import bgpurple from '../../assets/bgpurple.gif';
import StoryPromptPanel from './Gameplay Components/StoryPromptPanel';
import LeaderboardOverlay from './Gameplay Components/LeaderboardOverlay';
import PlayerSpotlight from './Gameplay Components/PlayerSpotlight';
import WordBank from './Gameplay Components/WordBank';
import ChartFeedbackBubble from './Gameplay Components/ChartFeedbackBubble';
import GameEndModal from './Gameplay Components/GameEndModal';
import { getGrammarStatusColor, getGrammarStatusLabel } from './Gameplay Components/grammarUtils';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { sanitizePlainText } from '../../utils/sanitize';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GamePlay = ({ 
  gameState, 
  stompClient, 
  sendMessage, 
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
  const { sessionId } = useParams();
  const { user, getToken } = useUserAuth();
  const [sentence, setSentence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [pointsData, setPointsData] = useState({ points: 0, reason: '' });
  const [pointsNotification, setPointsNotification] = useState(false);
  const [rolePrompt, setRolePrompt] = useState('');
  const [previousCycle, setPreviousCycle] = useState(gameState.currentCycle);
  const [cycleTransitionActive, setCycleTransitionActive] = useState(false);
  const [showCycleTransition, setShowCycleTransition] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cardResult, setCardResult] = useState(null);
  const [cardResultOpen, setCardResultOpen] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [wordUsedNotification, setWordUsedNotification] = useState(false);
  const [usedWordMessage, setUsedWordMessage] = useState('');
  const chatEndRef = useRef(null);
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [optimisticGameState, setOptimisticGameState] = useState(gameState);
  const processingTimeoutRef = useRef(null);
  const isSinglePlayer = gameState.players?.length === 1;
  const [localTimeRemaining, setLocalTimeRemaining] = useState(gameState.timeRemaining);
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef(null);
  const lastServerUpdateRef = useRef(Date.now());
  const [proceeding, setProceeding] = useState(false);
  const [openFeedbackIndex, setOpenFeedbackIndex] = useState(null);
  const [messageProcessing, setMessageProcessing] = useState(false);
  const [waitingForFeedback, setWaitingForFeedback] = useState(false);
  const messageCountBeforeSubmitRef = useRef(0);
  
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize:'10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const getWordBank = () => {
    if (!gameState || !gameState.wordBank) return [];
    return gameState.wordBank.map(w => (typeof w === 'string' ? w.trim().toLowerCase() : (w.word || '').toLowerCase()));
  };

  const renderHighlighted = (text, wordVariations) => {
    if (!text) return text;
    const safe = sanitizePlainText(text);
    
    // Use wordVariations if available (actual detected forms), otherwise fall back to word bank
    let wordsToHighlight = [];
    if (wordVariations && wordVariations.trim()) {
      // wordVariations is a comma-separated string like "saw, ate, photos, beautiful"
      wordsToHighlight = wordVariations.split(',').map(w => w.trim()).filter(Boolean);
    } else {
      // Fallback to word bank base words
      const words = getWordBank();
      if (!words || words.length === 0) return safe;
      wordsToHighlight = words;
    }

    if (wordsToHighlight.length === 0) return safe;

    const escaped = wordsToHighlight.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (escaped.length === 0) return safe;
    const re = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'ig');

    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = re.exec(safe)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: safe.substring(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = re.lastIndex;
    }
    if (lastIndex < safe.length) parts.push({ text: safe.substring(lastIndex), highlight: false });

    return parts.map((p, i) => p.highlight ? (
      <span key={i} style={{ fontWeight: '700', color: '#e7d52eff', textShadow: `
            -0.8px -0.8px 0 #000,  
            0.8px -0.8px 0 #000,
            -0.8px  0.8px 0 #000,
            0.8px  0.8px 0 #000
          `
      }}>{p.text}</span>
    ) : (
      <span key={i}>{p.text}</span>
    ));
  };

  useEffect(() => {
    if (gameState.messages) {
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

  useEffect(() => {
    if (gameState && gameState.storyPrompt) {
      setStoryPrompt(gameState.storyPrompt);
    }
  }, [gameState?.storyPrompt]);

  useEffect(() => {
    if (stompClient && stompClient.connected && gameState.sessionId) {
      const subscription = stompClient.subscribe(`/topic/game/${gameState.sessionId}/updates`, (message) => {
        try {
          const data = JSON.parse(message.body);
          if (data.type === "storyUpdate" && data.content) {
            setStoryPrompt(data.content);
          }
        } catch (error) {
          console.error('Error handling story update:', error);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, gameState.sessionId]);

  useEffect(() => {
    if (stompClient && stompClient.connected && user && user.email) {
      const subscription = stompClient.subscribe(`/user/${user.email}/queue/responses`, (message) => {
        try {
          const data = JSON.parse(message.body);
          if (data.rolePrompt) {
            setRolePrompt(data.rolePrompt);
          }
        } catch (error) {
          console.error('Error handling personal response (role prompt):', error);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, user]);

  useEffect(() => {
    if (stompClient && stompClient.connected && user && user.id) {
      const subscription = stompClient.subscribe(`/user/${user.email}/queue/score`, (message) => {
        try {
          const data = JSON.parse(message.body);
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
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
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
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);

    return () => clearInterval(interval);
  }, [sessionId, getToken, gameState.currentTurn]);

  const currentUserInPlayers = gameState.players?.find(p => p.userId === user?.id);
  const isMyTurn = React.useMemo(() => {
    if (isSinglePlayer) return true;
    if (!gameState.currentPlayer || !user || !currentUserInPlayers) return false;
    const isCurrentPlayer = String(gameState.currentPlayer.userId) === String(user.id);
    return isCurrentPlayer;
  }, [gameState.currentPlayer, user, currentUserInPlayers, isSinglePlayer]);

  useEffect(() => {
    if (gameState && Object.keys(gameState).length > 0) {
    }
  }, [gameState, isMyTurn, currentUserInPlayers]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    setLocalTimeRemaining(gameState.timeRemaining);
    lastServerUpdateRef.current = Date.now();
    
    const shouldRunTimer = !gameState.paused && (isMyTurn || isSinglePlayer) && gameState.timeRemaining > 0;
    setTimerActive(shouldRunTimer);

    if (shouldRunTimer) {
      timerIntervalRef.current = setInterval(() => {
        setLocalTimeRemaining(prevTime => {
          const newTime = Math.max(0, prevTime - 1);
          const timeSinceLastUpdate = Date.now() - lastServerUpdateRef.current;
          if (timeSinceLastUpdate > 5000 || newTime <= 3) {
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
  }, [gameState.timeRemaining, gameState.currentTurn, isMyTurn, isSinglePlayer, gameState.paused]);

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
    const trimmed = sentence.trim();
    if (!trimmed || submitting || waitingForFeedback) return;
    if (trimmed.length < 5) {
      return;
    }
    
    setSubmitting(true);
    setWaitingForFeedback(true);
    const currentSentence = trimmed;
    setSentence('');
    
    // Count current real (non-optimistic) user messages before submitting
    const currentRealMessages = localMessages.filter(msg => 
      msg.senderId === user.id && 
      !msg.isOptimistic &&
      msg.grammarStatus &&
      msg.grammarStatus !== 'PROCESSING'
    ).length;
    messageCountBeforeSubmitRef.current = currentRealMessages;
    
    const optimisticMessage = {
      id: `optimistic-${user.id}-${Date.now()}`,
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
        setLocalMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setSubmitting(false);
        setWaitingForFeedback(false);
        alert('Authentication error. Please log in again.');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      await sendMessage(`/app/game/${gameState.sessionId}/word`, 
           { word: currentSentence, clientMessageId: optimisticMessage.id });

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
      setLocalMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setSentence(currentSentence);
      setWaitingForFeedback(false);
      alert('Failed to send sentence. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (messageProcessing && localMessages.length > 0) {
      const userMessages = localMessages.filter(msg => msg.senderId === user?.id);
      const latestUserMessage = userMessages[userMessages.length - 1];
      
      if (latestUserMessage && 
          latestUserMessage.grammarStatus !== 'PROCESSING' && 
          latestUserMessage.grammarFeedback !== 'Processing your message...' &&
          !latestUserMessage.isOptimistic) {
        setMessageProcessing(false);
      }
    }
  }, [localMessages, user?.id]);

  // Simple check: unlock when we get a new real message with feedback
  useEffect(() => {
    if (waitingForFeedback && localMessages.length > 0) {
      const currentRealMessages = localMessages.filter(msg => 
        msg.senderId === user.id && 
        !msg.isOptimistic &&
        msg.grammarStatus &&
        msg.grammarStatus !== 'PROCESSING'
      ).length;
      
      // If we have more real messages than before, feedback arrived
      if (currentRealMessages > messageCountBeforeSubmitRef.current) {
        setWaitingForFeedback(false);
      }
    }
  }, [localMessages, waitingForFeedback, user?.id]);

  // Clear waiting state when turn changes (multiplayer)
  useEffect(() => {
    if (!isSinglePlayer && waitingForFeedback && !isMyTurn) {
      setWaitingForFeedback(false);
    }
  }, [isMyTurn, isSinglePlayer, waitingForFeedback]);

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

  const displayGameState = isSinglePlayer ? optimisticGameState : gameState;

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSinglePlayer || !isProcessing) {
      setOptimisticGameState(gameState);
    }
  }, [gameState, isSinglePlayer, isProcessing]);

  const totalCycles = gameState.turnCyclesConfig || Math.ceil(gameState.totalTurns / (gameState.players?.length || 1));
  const isLastCycle = gameState.currentCycle === totalCycles;

  const cycleDisplayString = isSinglePlayer 
    ? `Turn: ${gameState.currentTurn || 0} / ${gameState.totalTurns || 0}`
    : `Cycle ${gameState.currentCycle || 0}/${gameState.totalCycles || 0} (Turn ${gameState.turnsInCurrentCycle || 0}/${gameState.playersPerCycle || 0})`;

  return (
    <>
      <Box sx={{ 
        height: '90vh',
        display: 'flex',
        flexDirection: 'column', 
        position: 'relative',
        p: 4,
        gap: 2,
      }}>
        <StoryPromptPanel 
          storyPrompt={storyPrompt}
          gameState={gameState}
          isSinglePlayer={isSinglePlayer}
          pixelHeading={pixelHeading}
        />
        <Box sx={{ 
          display: 'flex',
          flex: 1,
          gap: 2,
          height: '100vh',
          paddingBottom: 4,
          width: '99%',
          margin: 0,
        }}>
          <Box sx={{ 
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: '40vh',
            maxWidth: '130vh', 
            border: '4px solid #5F4B8B',
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgpurple})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: '80vh',
          }}>
            <LeaderboardOverlay leaderboard={leaderboard} cycleDisplayString={cycleDisplayString} />
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
              <PlayerSpotlight currentPlayer={gameState.currentPlayer} isMyTurn={isMyTurn} pixelHeading={pixelHeading} />
            </Paper>
            <WordBank 
              wordBank={gameState.wordBank || []}
              onWordClick={(word) => setSentence(prev => prev ? `${prev} ${word}` : word)}
              pixelHeading={pixelHeading}
              pixelText={pixelText}
              getWordBankCount={() => getWordBank().length}
            />
          </Box>
          <Box sx={{ 
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            maxWidth: '85vh',
          }}>
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
                {localMessages
                  .filter((m, idx, arr) => {
                    if (!m) return false;
                    const norm = (s) => (s||'').toString().trim().toLowerCase().replace(/\s+/g,' ');
                    const sig = `${m.senderId||m.sender}|${norm(m.content)}|${new Date(m.timestamp).getSeconds()}`;
                    const firstIdx = arr.findIndex(x => {
                      if (!x) return false; 
                      const sig2 = `${x.senderId||x.sender}|${norm(x.content)}|${new Date(x.timestamp).getSeconds()}`;
                      return sig2 === sig;
                    });
                    return firstIdx === idx;
                  })
                  .filter(m => {
                    if (!m) return false;
                    const content = (m.content || '').toString();
                    if (m.isAiStream || m.partial || m.preview || m.temporary || m.isPlaceholder) return false;
                    const trimmed = content.trim().toLowerCase();
                    if (trimmed === 'analyzing...' || trimmed === 'processing...' || trimmed === 'analysis in progress') return false;
                    if ((m.sender === 'AI' || m.senderName === 'AI' || m.fromAi) && trimmed.length < 20) return false;
                    if (m.isOptimistic && (m.senderId === user?.id || m.sender === user?.id)) return true;
                    if (content.includes("Keep practicing your sentence structure") || content.includes("you'll improve even more")) return false;
                    return true;
                  }).map((msg, index) => (
                  <Box
                    key={msg.id || index}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                      mb: 1,
                      opacity: msg.isOptimistic ? 0.7 : 1,
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
                      <Typography sx={{fontSize: '18px' }}>
                        <strong>{sanitizePlainText(msg.senderName)}:</strong> {renderHighlighted(msg.content, msg.wordVariations)}
                      </Typography>
                      {msg.role && (
                        <Typography sx={{ 
                          fontSize: '16px', 
                          opacity: 0.8,
                          fontStyle: 'italic' 
                        }}>
                          as {sanitizePlainText(msg.role)}
                        </Typography>
                      )}
                      <Typography sx={{ 
                        fontSize: '16px', 
                        opacity: 0.7, 
                        mt: 0.5 
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                      {msg.grammarFeedback && msg.senderId === user?.id && msg.grammarStatus !== 'PROCESSING' && (
                        <ChartFeedbackBubble
                          message={msg.content}
                          grammarStatus={msg.grammarStatus}
                          grammarFeedback={msg.grammarFeedback}
                          roleAppropriate={msg.roleAppropriate}
                          vocabularyFeedback={msg.vocabularyFeedback}
                        />
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
                <div ref={chatEndRef} />
              </Box>
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
                  <GameEndModal
                    open={gameEnded}
                    proceeding={proceeding}
                    onClose={() => setProceeding(false)}
                    onProceed={() => {
                      setProceeding(true);
                      if (onProceedToResults) onProceedToResults();
                    }}
                  />
                </Box>
              )}
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
                        waitingForFeedback
                          ? "Processing your message..."
                          : isMyTurn 
                            ? "Type your message..." 
                            : "Waiting for your turn..."
                      }
                      value={sentence}
                      onChange={handleSentenceChange}
                      disabled={!isMyTurn || submitting || waitingForFeedback}
                      onKeyPress={(ev) => {
                        if (ev.key === 'Enter' && !ev.shiftKey && isMyTurn && !waitingForFeedback) {
                          handleSubmit();
                          ev.preventDefault();
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '50px',
                          bgcolor: 'white',
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!isMyTurn || submitting || waitingForFeedback || !sentence.trim()}
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
                      {submitting || waitingForFeedback ? (
                        <CircularProgress size={20} color="inherit"/>
                      ) : (
                        '➤'
                      )}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
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
        <Snackbar
          open={isSinglePlayer && isProcessing}
          autoHideDuration={2000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="info" sx={{ width: '100%' }}>
            Turn {gameState.currentTurn} completed. Starting next turn...
          </Alert>
        </Snackbar>
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
      </Box>
    </>
  );
};

export default GamePlay;

