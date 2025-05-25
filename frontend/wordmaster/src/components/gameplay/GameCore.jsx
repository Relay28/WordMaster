import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { Box, Typography, Container, CircularProgress } from '@mui/material';
import WaitingRoom from './WaitingRoom';
import GamePlay from './GamePlay';
import GameResults from './GameResults';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import picbg from '../../assets/picbg.png';
// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GameCore = () => {
  const { sessionId } = useParams();
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const [storyPrompt, setStoryPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState({});
  const [stompClient, setStompClient] = useState(null);

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
// In GameCore.js
// Replace the existing handleChatMessage function

const handleChatMessage = (message) => {
  try {
    const chatData = JSON.parse(message.body);
    console.log('Chat message received:', chatData);
    
    // Update messages immediately in the game state
    setGameState(prev => ({
      ...prev,
      messages: [...(prev.messages || []), chatData].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      )
    }));
    
    // Also fetch latest messages to ensure consistency
    fetchSessionMessages();
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
        // Game has ended, show results
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
  
  // Determine which component to render based on game state
// Determine which component to render based on game state
    const renderGameContent = () => {
    // Use appropriate component based on user role and game status
    if (gameState.status === 'WAITING_TO_START' || gameState.status === 'PENDING') {
      return <WaitingRoom gameState={gameState} isTeacher={user?.role === 'USER_TEACHER'} />;
    } else if (gameState.status === 'TURN_IN_PROGRESS' || gameState.status === 'WAITING_FOR_PLAYER' || 
               gameState.status === 'ACTIVE') {
      return <GamePlay 
        gameState={gameState} 
        stompClient={stompClient} 
        sendMessage={sendMessage}
        onGameStateUpdate={handleGameStateUpdate}
      />;
    } else if (gameState.status === 'COMPLETED') {
      return <GameResults gameState={gameState} />;
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