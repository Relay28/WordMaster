import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { Box, Typography, Container, CircularProgress } from '@mui/material';
import WaitingRoom from './WaitingRoom';
import GamePlay from './GamePlay';
import GameResults from './GameResults';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const GameCore = () => {
  const { sessionId } = useParams();
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  
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
            
            // Subscribe to game updates
            client.subscribe(`/topic/game/${sessionId}/status`, handleGameStatus);
            client.subscribe(`/topic/game/${sessionId}/turn`, handleTurnUpdate);
            client.subscribe(`/topic/game/${sessionId}/timer`, handleTimerUpdate);
            client.subscribe(`/topic/game/${sessionId}/scores`, handleScoreUpdate);
            client.subscribe(`/topic/game/${sessionId}/players`, handlePlayerUpdate);
            client.subscribe(`/topic/game/${sessionId}/updates`, handleGameUpdates);
            
            // Subscribe to user-specific queue
            if (user && user.id) {
              client.subscribe(`/user/queue/responses`, handlePersonalResponses);
            }
            
            // Fetch initial game state
            fetchGameState();
          },
          
          beforeConnect: () => {
            console.log('Attempting to connect to WebSocket...');
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
      if (client && client.connected) {
        console.log('Deactivating STOMP client');
        client.deactivate();
      }
    };
  }, [sessionId, getToken, user]);
  
  // Fetch game state from the backend
  const fetchGameState = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not available');
        return;
      }
      
      // Use API_URL constant for fetch requests
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/state`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.status === 304) {
        // Don't try to parse JSON, just return (or handle as needed)
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error(`Failed to fetch game state: ${response.status} ${text}`);
      }

      const data = await response.json();
      console.log('Game state data received:', data); // Add this line to see the actual data
      setGameState(data);
      setLoading(false);
    } catch (err) {
      setError('Error loading game state');
      console.error('Game state fetch error:', err);
    }
  }, [sessionId, getToken]);
  
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
      setGameState(prev => ({
        ...prev,
        currentPlayer: {
          id: turnData.playerId,
          name: turnData.playerName,
          role: turnData.roleName
        },
        timeRemaining: turnData.timeRemaining,
        currentTurn: turnData.turnNumber
      }));
    } catch (error) {
      console.error('Error handling turn update:', error);
    }
  };
  
  const handleTimerUpdate = (message) => {
    try {
      const timerData = JSON.parse(message.body);
      setGameState(prev => ({
        ...prev,
        timeRemaining: timerData.timeRemaining
      }));
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
      // Handle general game updates
    } catch (error) {
      console.error('Error handling game update:', error);
    }
  };
  
  const handlePersonalResponses = (message) => {
    try {
      const response = JSON.parse(message.body);
      console.log('Personal response received:', response);
      // Handle personal responses
    } catch (error) {
      console.error('Error handling personal response:', error);
    }
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
      return <GamePlay gameState={gameState} stompClient={stompClient} sendMessage={sendMessage} />;
    } else if (gameState.status === 'COMPLETED') {
      return <GameResults gameState={gameState} />;
    }
    
    // For debugging
    console.log("Unrecognized game status:", gameState.status);
    return <Typography>Unknown game state: {gameState.status}</Typography>;
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

  return (
    <Container maxWidth="lg">
      {renderGameContent()}
    </Container>
  );
};

export default GameCore;