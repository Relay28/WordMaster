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
          
          // Add retries to ensure questions are available
          let attempts = 0;
          let maxAttempts = 5;
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
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          if (questions) {
            setComprehensionQuestions(questions);
          } else {
            console.warn("No questions available after all attempts");
            setShowResults(true);
          }
        } catch (e) {
          console.error("Error fetching comprehension questions:", e);
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

  // Add this useEffect after the existing ones to detect game completion
useEffect(() => {
  // Check if game should be marked as ended based on server state
  const shouldGameEnd = (
    gameState.status === 'COMPLETED' || 
    gameState.status === 'ENDED' ||
    (gameState.currentTurn > gameState.totalTurns && gameState.totalTurns > 0)
  );
  
  if (shouldGameEnd && !gameEnded) {
    console.log('[GameCore] Detecting game completion from server state:', {
      status: gameState.status,
      currentTurn: gameState.currentTurn,
      totalTurns: gameState.totalTurns,
      gameEnded
    });
    setGameEnded(true);
  }
}, [gameState.status, gameState.currentTurn, gameState.totalTurns, gameEnded]);
// In GameCore.js
// Replace the existing handleChatMessage function

const handleChatMessage = (message) => {
  try {
    const chatData = JSON.parse(message.body);
    console.log('Chat message received:', chatData);
    
    setGameState(prev => {
      const messages = prev.messages || [];
      
      // Only replace optimistic messages when we have COMPLETED processing
      const existingIndex = messages.findIndex(msg => 
        msg.isOptimistic && 
        msg.senderId === chatData.senderId && 
        msg.content === chatData.content &&
        // Fix: Only replace when grammar processing is truly complete
        chatData.grammarStatus && 
        chatData.grammarStatus !== 'PROCESSING' &&
        chatData.grammarFeedback && 
        chatData.grammarFeedback !== 'Processing...' &&
        chatData.grammarFeedback !== 'Processing your message...'
      );
      
      if (existingIndex !== -1) {
        // Replace optimistic message with real processed message
        const updatedMessages = [...messages];
        updatedMessages[existingIndex] = { 
          ...chatData, 
          isOptimistic: false 
        };
        
        return {
          ...prev,
          messages: updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        };
      } else {
        // Handle updates to existing real messages (for progressive updates)
        const existingRealIndex = messages.findIndex(msg => 
          !msg.isOptimistic && 
          msg.id === chatData.id
        );
        
        if (existingRealIndex !== -1) {
          // Update existing real message with new processing status
          const updatedMessages = [...messages];
          updatedMessages[existingRealIndex] = chatData;
          return {
            ...prev,
            messages: updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          };
        }
        
        // Add new message if it doesn't exist
        const isDuplicate = messages.some(msg => 
          msg.id === chatData.id
        );
        
        if (!isDuplicate) {
          return {
            ...prev,
            messages: [...messages, chatData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          };
        }
        
        return prev;
      }
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
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
  }
}, [sessionId, getToken]);

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
  
  const handlePersonalResponses = (message) => {
    try {
      const response = JSON.parse(message.body);
      console.log('Personal response received:', response);
      
      // Handle role prompts
      if (response.rolePrompt) {
        // This will be handled by the GamePlay component through its own subscription
        console.log('Role prompt received:', response.rolePrompt);
      }
    } catch (error) {
      console.error('Error handling personal response:', error);
    }
  };
  
  // Add this to GameCore.jsx
  const handleGameStateUpdate = (updatedState) => {
    // Update your game state here
    setGameState(updatedState); // Assuming you have a state setter like this
  };
  
  // Function to send a message through WebSocket
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
        destination: destination,
        body: JSON.stringify(body),
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [stompClient, getToken]);
  
  // Fetch player cards when game state changes
  // const fetchPlayerCards = useCallback(async () => {
  //   if (!gameState.sessionId || !user?.id) return;
    
  //   try {
  //     setLoadingCards(true);
  //     const token = await getToken();
  //     const response = await fetch(
  //       `${API_URL}/api/cards/player/${gameState.sessionId}/user/${user.id}`,
  //       { headers: { 'Authorization': `Bearer ${token}` } }
  //     );
      
  //     if (response.ok) {
  //       const cards = await response.json();
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