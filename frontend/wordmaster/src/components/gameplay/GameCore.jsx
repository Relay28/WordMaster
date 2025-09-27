import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { Box, Typography, Container, CircularProgress, Paper } from '@mui/material';
import WaitingRoom from './WaitingRoom';
import GamePlay from './GamePlay';
import GameResults from './GameResults';
import ComprehensionQuiz from './ComprehensionQuiz';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import picbg from '../../assets/picbg.png';
// import CardDisplay from './CardDisplay'; // Import the CardDisplay component
// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL ;

const GameCore = () => {
  const { sessionId } = useParams();
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const [storyPrompt, setStoryPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState({});
  const [stompClient, setStompClient] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [showComprehension, setShowComprehension] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [comprehensionQuestions, setComprehensionQuestions] = useState(null);
  const [loadingComprehension, setLoadingComprehension] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  // const [playerCards, setPlayerCards] = useState([]);
  // const [loadingCards, setLoadingCards] = useState(false);
  // const [selectedCard, setSelectedCard] = useState(null);
  // const [pendingCardUse, setPendingCardUse] = useState(false);

  const handleProceedToComprehension = () => {
    setLoadingComprehension(true);
    setShowComprehension(true);
  };

  const handleShowResults = (quizResults) => {
    if (quizResults) {
      // If we have results, it means the quiz was completed
      setQuizCompleted(true);
      // Store completion status in localStorage to persist across page reloads
      localStorage.setItem(`quiz_completed_${gameState.sessionId}_${user?.id}`, 'true');
    }
    setShowResults(true);
  };

  // Check if quiz was previously completed
  useEffect(() => {
    if (gameState.sessionId && user?.id) {
      const wasCompleted = localStorage.getItem(`quiz_completed_${gameState.sessionId}_${user?.id}`);
      if (wasCompleted === 'true') {
        setQuizCompleted(true);
      }
    }
  }, [gameState.sessionId, user?.id]);

  // Fetch comprehension questions when showComprehension is triggered
  useEffect(() => {
    if (showComprehension && gameState.sessionId && user?.id) {
      const fetchQuestions = async () => {
        try {
          setLoadingComprehension(true);
          const token = await getToken();
          let attempts = 0;
          const maxAttempts = 5;
          let questions = null;
          while (attempts < maxAttempts && !questions) {
            const response = await fetch(
              `${API_URL}/api/teacher-feedback/comprehension/${gameState.sessionId}/student/${user.id}/questions`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                questions = data;
                console.log(`Got ${data.length} questions on attempt ${attempts + 1}`);
              }
            }
            if (!questions) {
              attempts++;
              if (attempts < maxAttempts) {
                console.log(`No questions yet, retrying in 1 second... (attempt ${attempts}/${maxAttempts})`);
                await new Promise(res => setTimeout(res, 1000));
              }
            }
          }
          if (questions) {
            setComprehensionQuestions(questions);
          } else {
            console.warn('No questions available after all attempts');
            setShowResults(true);
          }
        } catch (e) {
          console.error('Error fetching comprehension questions:', e);
          setComprehensionQuestions([]);
        } finally {
          setLoadingComprehension(false);
        }
      };
      fetchQuestions();
    }
  }, [showComprehension, gameState.sessionId, user, getToken]);

  // Initialize WebSocket connection
  useEffect(() => {
    let client = null;

    const initializeWebSocket = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError('Authentication token not available');
          return;
        }
        
        // Create SockJS instance with token in query parameter as fallback
        const socket = new SockJS(`${API_URL}/ws?token=${token}`);

        client = new Client({
          webSocketFactory: () => socket,
          
          // Set headers to include the token in the STOMP handshake
          connectHeaders: {
            'Authorization': `Bearer ${token}`
          },
          
          debug: function (str) {
            console.log('STOMP: ' + str);
          },
          
          reconnectDelay: 5000,
          
          onConnect: () => {
            console.log('Connected to WebSocket');
            
            // Subscribe with better error handling
            client.subscribe(`/topic/game/${sessionId}/timer`, (message) => {
              try {
                handleTimerUpdate(message);
              } catch (error) {
                console.error('Timer update error:', error);
                // Fallback: fetch fresh game state
                setTimeout(fetchGameState, 1000);
              }
            });
            
            client.subscribe(`/topic/game/${sessionId}/turn`, (message) => {
              try {
                handleTurnUpdate(message);
                // Ensure we get fresh state after turn changes
                setTimeout(fetchGameState, 500);
              } catch (error) {
                console.error('Turn update error:', error);
                setTimeout(fetchGameState, 1000);
              }
            });
            client.subscribe(`/topic/game/${sessionId}/status`, handleGameStatus);
            client.subscribe(`/topic/game/${sessionId}/scores`, handleScoreUpdate);
            client.subscribe(`/topic/game/${sessionId}/players`, handlePlayerUpdate);
            client.subscribe(`/topic/game/${sessionId}/updates`, handleGameUpdates);
            client.subscribe(`/topic/game/${sessionId}/chat`, handleChatMessage); 

            // Subscribe to AI streaming topic for this session
            try {
              // Subscribe to AI stream topic. We will NOT append partial chunks to the
              // main message list to avoid showing intermediate streaming text.
              // Instead we set an aiLoading flag while waiting and only append the
              // final message when payload.type === 'final'. This keeps the UI clean.
              client.subscribe(`/topic/ai/${sessionId}`, (message) => {
                try {
                  const payload = JSON.parse(message.body);
                  // payload.type = 'partial' | 'final' | 'error', payload.text
                  if (payload.type === 'partial') {
                    // Mark that AI is producing output; show a single 'Analyzing...' indicator on AI side
                    setGameState(prev => ({ ...prev, __aiLoading: true }));
                    return;
                  }

                  // For errors, clear loading and optionally show an error message
                  if (payload.type === 'error') {
                    setGameState(prev => ({ ...prev, __aiLoading: false }));
                    // Optionally append a short error message from AI
                    setGameState(prev => {
                      const messages = prev.messages ? [...prev.messages] : [];
                      messages.push({ id: `ai-error-${Date.now()}`, sender: 'AI', content: 'Analysis failed', timestamp: new Date().toISOString() });
                      return { ...prev, messages };
                    });
                    return;
                  }

                  // payload.type === 'final'
                  setGameState(prev => {
                    const messages = prev.messages ? [...prev.messages] : [];
                    // Remove any existing optimistic AI placeholder (isOptimistic or content 'Analyzing...')
                    const filtered = messages.filter(m => !(m.isOptimistic && m.sender === 'AI') && !(String(m.content).trim() === 'Analyzing...'));
                    filtered.push({ id: `ai-${Date.now()}`, sender: 'AI', content: payload.text, timestamp: new Date().toISOString() });
                    return { ...prev, messages: filtered, __aiLoading: false };
                  });
                } catch (e) {
                  console.error('Error parsing AI stream message', e);
                }
              });
            } catch (e) {
              console.warn('AI topic subscription failed', e);
            }
            
            // Subscribe to user-specific queue
            if (user && user.id) {
              client.subscribe(`/user/queue/responses`, handlePersonalResponses);
            }
            
            // Fetch initial game state
            fetchGameState();
            
            // Set up periodic state refresh as backup
            const stateRefreshInterval = setInterval(() => {
              if (gameState.status === 'TURN_IN_PROGRESS' || gameState.status === 'ACTIVE') {
                fetchGameState();
              }
            }, 30000); // Every 30 seconds
            
            // Store interval for cleanup
            client.stateRefreshInterval = stateRefreshInterval;
          },
          
          onDisconnect: () => {
            console.log('WebSocket disconnected');
            if (client.stateRefreshInterval) {
              clearInterval(client.stateRefreshInterval);
            }
          },
          
          onStompError: (frame) => {
            console.error('STOMP error', frame);
            setError('Connection error. Please try again.');
          },
          
          onWebSocketClose: () => {
            console.log('WebSocket connection closed');
          },
          
          onWebSocketError: (event) => {
            console.error('WebSocket error', event);
            setError('WebSocket connection error');
          }
        });
        
        client.activate();
        setStompClient(client);
      } catch (err) {
        setError('Failed to connect to game server');
        console.error('WebSocket initialization error:', err);
      }
    };
    
    initializeWebSocket();
    
    // Cleanup function
    return () => {
      if (client) {
        if (client.stateRefreshInterval) {
          clearInterval(client.stateRefreshInterval);
        }
        if (client.connected) {
          client.deactivate();
        }
      }
    };
  }, [sessionId, getToken, user]);

  // Unified helper to append/merge a message avoiding duplicates (by id or optimistic content)
  const safeAppendMessage = useCallback((incoming) => {
    setGameState(prev => {
      const list = prev.messages ? [...prev.messages] : [];
      const norm = s => (s || '').toString().trim().toLowerCase().replace(/\s+/g,' ');
      // If same id already present -> optionally upgrade optimistic
      const sameIdIdx = list.findIndex(m => m.id && incoming.id && m.id === incoming.id);
      if (sameIdIdx !== -1) {
        // Merge to keep newest fields; drop isOptimistic flag
        const updated = { ...list[sameIdIdx], ...incoming, isOptimistic: false };
        list[sameIdIdx] = updated;
        return { ...prev, messages: list };
      }
      // If incoming has clientMessageId referencing an optimistic
      if (incoming.clientMessageId) {
        const optimisticIdx = list.findIndex(m => m.id === incoming.clientMessageId);
        if (optimisticIdx !== -1) {
          list[optimisticIdx] = { ...incoming, id: incoming.clientMessageId, isOptimistic: false };
          return { ...prev, messages: list };
        }
      }
      // Fallback: match optimistic by sender + normalized content
      const incContent = norm(incoming.content);
      const optimisticIdx2 = list.findIndex(m => m.isOptimistic && String(m.senderId) === String(incoming.senderId) && norm(m.content) === incContent);
      if (optimisticIdx2 !== -1) {
        list[optimisticIdx2] = { ...list[optimisticIdx2], ...incoming, isOptimistic: false };
        return { ...prev, messages: list };
      }
      // Avoid adding duplicate AI finals with identical normalized content adjacent
      if ((incoming.sender === 'AI' || incoming.senderName === 'AI') && incContent.length) {
        const lastAi = [...list].reverse().find(m => (m.sender === 'AI' || m.senderName === 'AI') && !m.isOptimistic);
        if (lastAi && norm(lastAi.content) === incContent) {
          return prev; // skip duplicate
        }
      }
      list.push(incoming);
      return { ...prev, messages: list };
    });
  }, []);

  // Helper to send text to AI service and create optimistic UI placeholder (single placeholder only)
  const sendAiForAnalysis = async (text) => {
    try {
      const token = await getToken();
      if (!token) return;
      // Instead of pushing a visible placeholder message (which caused duplicates),
      // just set a flag; UI shows a single global "Analyzing" indicator.
      setGameState(prev => ({ ...prev, __aiLoading: true }));

      // Fire and forget; the AsyncAIService will stream updates to /topic/ai/{sessionId}
      await fetch(`${API_URL}/api/ai/submit?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text, task: 'grammar_check' })
      });
    } catch (err) {
      console.error('Failed to send AI analysis', err);
    }
  };

  // Add an optimistic message into the canonical gameState.messages array
  const addOptimisticMessage = (message) => {
    setGameState(prev => {
      const messages = prev.messages ? [...prev.messages] : [];
      if (!messages.some(m => m.id === message.id)) {
        messages.push(message);
      }
      return { ...prev, messages };
    });
  };
// Add this after the fetchGameState function

const fetchSessionMessages = useCallback(async () => {
  try {
    const token = await getToken();
    if (!token) {
      console.error('Authentication token not available');
      return;
    }

    const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat messages: ${response.status}`);
    }

    const messages = await response.json();
    console.log('Chat messages received:', messages);
    setGameState(prev => ({
      ...prev,
      messages: messages
    }));
  } catch (error) {
    console.error('Error fetching chat messages:', error);
  }
}, [sessionId, getToken]);
  
  // Fetch game state from the backend
const fetchGameState = useCallback(async () => {
  try {
    const token = await getToken();
    if (!token) {
      setError('Authentication token not available');
      return;
    }
    
    // Fetch game state
    const [gameResponse, messagesResponse] = await Promise.all([
      fetch(`${API_URL}/api/sessions/${sessionId}/state`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }),
      fetch(`${API_URL}/api/chat/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
    ]);

    if (!gameResponse.ok || !messagesResponse.ok) {
      throw new Error('Failed to fetch game data');
    }

    const [gameData, messages] = await Promise.all([
      gameResponse.json(),
      messagesResponse.json()
    ]);

    // Calculate cycle information
    const playersPerCycle = gameData.players?.length || 1;
    const currentCycle = Math.ceil(gameData.currentTurn / playersPerCycle);
    const turnsInCurrentCycle = gameData.currentTurn % playersPerCycle || playersPerCycle;
    
    setGameState({
      ...gameData,
      messages,
      playersPerCycle,
      currentCycle,
      turnsInCurrentCycle,
      totalCycles: Math.ceil(gameData.totalTurns / playersPerCycle)
    });

    setLoading(false);
  } catch (err) {
    setError('Error loading game state');
    console.error('Game state fetch error:', err);
    // Ensure the loading spinner is cleared even on error
    setLoading(false);
  }
}, [sessionId, getToken]);

  // Fallback initial fetch in case websocket connect is delayed
  useEffect(() => {
    if (loading) {
      fetchGameState();
      // Safety timeout: clear loading after 8s if still true
      const timeout = setTimeout(() => {
        setLoading(prev => {
          if (prev) {
            console.warn('[GameCore] Forcing loading=false after timeout');
            return false;
          }
          return prev;
        });
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [loading, fetchGameState]);

  // Add this after the first useEffect

useEffect(() => {
  // Fetch messages initially
  fetchSessionMessages();

  // Set up periodic refresh
  const refreshInterval = setInterval(fetchSessionMessages, 10000); // Refresh every 10 seconds

  return () => {
    clearInterval(refreshInterval);
  };
}, [fetchSessionMessages]);
  
  // WebSocket message handlers
  const handleGameStatus = (message) => {
    try {
      const data = JSON.parse(message.body);
      if (data.event === 'gameStarted') {
        // Game has started
        fetchGameState();
      } else if (data.event === 'gameEnded') {
        // Game has ended, show congrats in gameplay, not results
        setGameEnded(true);
        setGameState(prev => ({
          ...prev,
          status: 'COMPLETED',
          leaderboard: data.leaderboard
        }));
      }
    } catch (error) {
      console.error('Error handling game status:', error);
    }
  };
  const handleTurnUpdate = (message) => {
  try {
    const turnData = JSON.parse(message.body);
    console.log('[Timer Debug] Turn update received:', turnData);
    
    setGameState(prev => {
      const currentCycle = Math.ceil(turnData.turnNumber / (prev.playersPerCycle || 1));
      const turnsInCurrentCycle = turnData.turnNumber % (prev.playersPerCycle || 1) || (prev.playersPerCycle || 1);
      
      const currentPlayer = {
        userId: turnData.playerId,
        id: turnData.playerId,
        name: turnData.playerName,
        role: turnData.roleName
      };

      const newState = {
        ...prev,
        currentPlayer,
        timeRemaining: turnData.timeRemaining || prev.timePerTurn || 30, // Ensure initial time is set
        currentTurn: turnData.turnNumber,
        currentCycle,
        turnsInCurrentCycle,
        totalCycles: Math.ceil(prev.totalTurns / (prev.playersPerCycle || 1)),
        lastTimerUpdate: Date.now() // Add timestamp for debugging
      };
      
      console.log('[Timer Debug] New game state after turn update:', {
        timeRemaining: newState.timeRemaining,
        currentTurn: newState.currentTurn,
        timePerTurn: newState.timePerTurn
      });
      
      return newState;
    });
  } catch (error) {
    console.error('Error handling turn update:', error);
  }
};
  
  const handleTimerUpdate = (message) => {
    try {
      const timerData = JSON.parse(message.body);
      console.log('[Timer Debug] Timer update received:', timerData);
      
      setGameState(prev => {
        const newState = {
          ...prev,
          timeRemaining: timerData.timeRemaining,
          lastTimerUpdate: Date.now()
        };
        
        console.log('[Timer Debug] Timer updated:', {
          oldTime: prev.timeRemaining,
          newTime: timerData.timeRemaining,
          timestamp: new Date().toISOString()
        });
        
        return newState;
      });
    } catch (error) {
      console.error('Error handling timer update:', error);
    }
  };
  
  const handleScoreUpdate = (message) => {
    // Refresh leaderboard when scores change
    fetchGameState();
  };
  
  const handlePlayerUpdate = (message) => {
    try {
      const players = JSON.parse(message.body);

      // Remove duplicate players by userId
      const uniquePlayers = [];
      const seenUserIds = new Set();
      for (const player of players) {
        if (!seenUserIds.has(player.userId)) {
          uniquePlayers.push(player);
          seenUserIds.add(player.userId);
        }
      }

      setGameState(prevState => ({
        ...prevState,
        players: uniquePlayers
      }));
    } catch (error) {
      console.error('Error handling player update:', error);
    }
  };
  
  const handleGameUpdates = (message) => {
    try {
      const updateData = JSON.parse(message.body);
      console.log('Game update received:', updateData);
      
      if (updateData.type === "storyUpdate") {
        setStoryPrompt(updateData.content);
        console.log('New story prompt received:', updateData.content);
      } else if (updateData.type === "storyRefresh") {
        // Just refresh existing story, don't treat as new
        setStoryPrompt(updateData.content);
      } else if (updateData.type === "cycleChange") {
        console.log('Cycle changed to:', updateData.cycle);
        // Handle cycle change UI updates if needed
      }
    } catch (error) {
      console.error('Error handling game update:', error);
    }
  };
  
  const handleChatMessage = (message) => {
    try {
      const chatData = JSON.parse(message.body);
      const isStreamFlag = chatData.type === 'partial' || chatData.partial || chatData.preview || chatData.isAiStream || chatData.temporary;
      const senderLooksLikeAi = (chatData.sender === 'AI' || chatData.senderName === 'AI' || chatData.fromAi === true);
      const content = (chatData.content || '').toString().trim();
      const shortFragment = content.length > 0 && content.length < 30;
      const placeholderTexts = ['analyzing...', 'processing...', 'analysis in progress'];
      if (isStreamFlag || (senderLooksLikeAi && (shortFragment || placeholderTexts.includes(content.toLowerCase())))) {
        setGameState(prev => ({ ...prev, __aiLoading: true }));
        return;
      }
      // Merge/append safely
      safeAppendMessage({ ...chatData, isOptimistic: false });
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  };

  // Provide handler to allow child component to push a full updated game state
  const handleGameStateUpdate = useCallback((updatedState) => {
    if (!updatedState || typeof updatedState !== 'object') return;
    setGameState(prev => ({ ...prev, ...updatedState }));
  }, []);

  // Function to send a message through WebSocket (restored after refactor)
  const sendMessage = useCallback(async (destination, body) => {
    if (!stompClient || !stompClient.connected) {
      setError('WebSocket connection not established');
      return false;
    }
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not available');
        return false;
      }
      stompClient.publish({
        destination,
        body: JSON.stringify(body),
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, [stompClient, getToken]);
  //       setPlayerCards(cards);
  //       console.log('[Cards Debug] Fetched cards:', cards);
  //     } else {
  //       console.error('[Cards Debug] Failed to fetch cards:', response.status);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching player cards:', error);
  //   } finally {
  //     setLoadingCards(false);
  //   }
  // }, [gameState.sessionId, user?.id, getToken]);

  // // Handle card selection
  // const handleCardSelect = useCallback((card) => {
  //   console.log('[Cards Debug] Card selected:', card);
  //   setSelectedCard(card);
  // }, []);

  // // Handle card deselection
  // const handleCardDeselect = useCallback(() => {
  //   console.log('[Cards Debug] Card deselected');
  //   setSelectedCard(null);
  // }, []);

  // // Enhanced card usage with sentence integration
  // const handleUseCard = useCallback(async (cardId, sentence) => {
  //   if (!sentence?.trim()) {
  //     console.error('[Cards Debug] No sentence provided for card use');
  //     return { success: false, message: 'Please write a sentence first before using a card!' };
  //   }

  //   if (pendingCardUse) {
  //     console.log('[Cards Debug] Card use already in progress');
  //     return { success: false, message: 'Card use already in progress' };
  //   }

  //   try {
  //     setPendingCardUse(true);
  //     console.log('[Cards Debug] Using card:', cardId, 'with sentence:', sentence);
      
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
  //       console.log('[Cards Debug] Card use result:', result);
        
  //       if (result.success) {
  //         // Refresh cards to update the UI
  //         await fetchPlayerCards();
  //         // Clear selected card after successful use
  //         setSelectedCard(null);
  //         // Return success with points info
  //         return {
  //           success: true,
  //           pointsAwarded: result.pointsAwarded || 0,
  //           cardName: result.cardName || 'Power Card',
  //           message: result.message || 'Card used successfully!'
  //         };
  //       } else {
  //         return {
  //           success: false,
  //           message: result.message || 'Card conditions not met'
  //         };
  //       }
  //     } else {
  //       return {
  //         success: false,
  //         message: 'Failed to use card'
  //       };
  //     }
  //   } catch (error) {
  //     console.error('Error using card:', error);
  //     return {
  //       success: false,
  //       message: 'Error using card: ' + error.message
  //     };
  //   } finally {
  //     setPendingCardUse(false);
  //   }
  // }, [getToken, fetchPlayerCards, pendingCardUse]);
  
  // // Fetch cards when game state is loaded
  // useEffect(() => {
  //   if (gameState.sessionId && user?.id && 
  //       (gameState.status === 'ACTIVE' || gameState.status === 'TURN_IN_PROGRESS')) {
  //     fetchPlayerCards();
  //   }
  // }, [gameState.sessionId, gameState.status, user?.id, fetchPlayerCards]);

  // // Debug card state
  // useEffect(() => {
  //   if (playerCards.length > 0) {
  //     console.log('[Cards Debug] Available cards:', playerCards);
  //   }
  // }, [playerCards]);

  // Determine which component to render based on game state
  const renderGameContent = () => {
    // Use appropriate component based on user role and game status
    if (showResults) {
      return <GameResults 
               gameState={gameState} 
               quizCompleted={quizCompleted}
             />;
    }
    
    if (loadingComprehension && !comprehensionQuestions) {
      return (
        <Box sx={{ 
          height: '100vh', 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Paper elevation={3} sx={{ 
            p: 5, 
            borderRadius: '16px',
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '4px solid #5F4B8B',
            maxWidth: '600px',
            width: '90%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Progress bar at the top */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              bgcolor: '#5F4B8B',
              overflow: 'hidden'
            }}>
              <Box
                sx={{
                  width: '30%',
                  height: '100%',
                  bgcolor: '#9575CD',
                  position: 'absolute',
                  animation: 'loadingBar 2s infinite ease-in-out'
                }}
              />
            </Box>
            
            <Typography 
              sx={{ 
                fontFamily: '"Press Start 2P", cursive',
                fontSize: { xs: '16px', sm: '24px' }, 
                color: '#5F4B8B', 
                mb: 3 
              }}
            >
              Preparing Questions...
            </Typography>
            
            {/* Single clean progress indicator */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3 
            }}>
              <CircularProgress 
                size={80}
                thickness={5}
                sx={{ 
                  color: '#5F4B8B',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
            </Box>
            
            <Typography sx={{ 
              fontFamily: '"Press Start 2P", cursive',
              fontSize: { xs: '10px', sm: '12px' },
              color: '#666',
              maxWidth: '80%',
              mx: 'auto'
            }}>
              Let's see how much you've learned!
            </Typography>
          </Paper>
          
          {/* Custom animation keyframes */}
          <style jsx="true">{`
            @keyframes loadingBar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(200%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
        </Box>
      );
    }
    
    if (showComprehension && comprehensionQuestions) {
      return (
        <ComprehensionQuiz
          sessionId={gameState.sessionId}
          studentId={user?.id}
          questions={comprehensionQuestions}
          onComplete={handleShowResults}
        />
      );
    }
    
    if (
      gameState.status === 'WAITING_TO_START' ||
      gameState.status === 'PENDING'
    ) {
      return <WaitingRoom gameState={gameState} isTeacher={user?.role === 'USER_TEACHER'} />;
    } else if (
      gameState.status === 'TURN_IN_PROGRESS' ||
      gameState.status === 'WAITING_FOR_PLAYER' ||
      gameState.status === 'ACTIVE' ||
      (gameState.status === 'COMPLETED' && !showResults && !showComprehension)
    ) {
      return (
        <GamePlay
          gameState={gameState}
          stompClient={stompClient}
          sendMessage={sendMessage}
            sendAiForAnalysis={sendAiForAnalysis}
            addOptimisticMessage={addOptimisticMessage}
          onGameStateUpdate={handleGameStateUpdate}
          gameEnded={gameEnded}
          onProceedToResults={handleProceedToComprehension}
          // playerCards={playerCards}
          // onRefreshCards={fetchPlayerCards}
          // loadingCards={loadingCards}
          // selectedCard={selectedCard}
          // onCardSelect={handleCardSelect}
          // onCardDeselect={handleCardDeselect}
          // onUseCard={handleUseCard}
          // pendingCardUse={pendingCardUse}
        />);
    } else {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6">Loading game or unknown status: {gameState.status}</Typography>
        </Box>
      );
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Replace the return statement in GameCore component
return (
  <Box sx={{ 
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  margin: 0,
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
  overflow: 'hidden',
  background: `
    linear-gradient(to bottom, 
      rgba(249, 249, 249, 10) 0%, 
      rgba(249, 249, 249, 10) 40%, 
      rgba(249, 249, 249, 0.1) 100%),
    url(${picbg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  imageRendering: 'pixelated',
}}>
    <Box sx={{ 
      flex: 1,
      width: '100%',
      overflow: 'auto',
      // Custom scrollbar styling
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(95, 75, 139, 0.1)',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#5F4B8B',
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: '#4a3a6d',
        },
      },
    }}>
      <Container maxWidth="2xl">
        {renderGameContent()}
      </Container>
    </Box>
  </Box>
);
};

export default GameCore;