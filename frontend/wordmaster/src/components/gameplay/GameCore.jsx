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
    const initializeWebSocket = async () => {
      try {
        const token = await getToken();
        // Use API_URL constant for WebSocket connection
        const socket = new SockJS(`${API_URL}/ws?token=${token}`);
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            Authorization: `Bearer ${token}`
          },
          debug: function (str) {
            console.log('STOMP: ' + str);
          },
          reconnectDelay: 5000,
          onConnect: () => {
            // Subscribe to game updates
            client.subscribe(`/topic/game/${sessionId}/status`, handleGameStatus);
            client.subscribe(`/topic/game/${sessionId}/turn`, handleTurnUpdate);
            client.subscribe(`/topic/game/${sessionId}/timer`, handleTimerUpdate);
            client.subscribe(`/topic/game/${sessionId}/scores`, handleScoreUpdate);
            client.subscribe(`/topic/game/${sessionId}/players`, handlePlayerUpdate);
            
            // Fetch initial game state
            fetchGameState();
          },
          onStompError: (frame) => {
            console.error('STOMP error', frame);
            setError('Connection error. Please try again.');
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
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, [sessionId, getToken]);
  
  // Fetch game state from the backend
  const fetchGameState = useCallback(async () => {
    try {
      const token = await getToken();
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
      setGameState(data);
      setLoading(false);
    } catch (err) {
      setError('Error loading game state');
      console.error('Game state fetch error:', err);
    }
  }, [sessionId, getToken]);
  
  // WebSocket message handlers
  const handleGameStatus = (message) => {
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
  };
  
  const handleTurnUpdate = (message) => {
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
  };
  
  const handleTimerUpdate = (message) => {
    const timerData = JSON.parse(message.body);
    setGameState(prev => ({
      ...prev,
      timeRemaining: timerData.timeRemaining
    }));
  };
  
  const handleScoreUpdate = (message) => {
    // Refresh leaderboard when scores change
    fetchGameState();
  };
  
  const handlePlayerUpdate = (message) => {
    const players = JSON.parse(message.body);
    setGameState(prev => ({
      ...prev,
      players: players
    }));
  };
  
  // Determine which component to render based on game state
  const renderGameContent = () => {
    // Use appropriate component based on user role and game status
    if (gameState.status === 'WAITING_TO_START') {
      return <WaitingRoom gameState={gameState} isTeacher={user?.role === 'USER_TEACHER'} />;
    } else if (gameState.status === 'TURN_IN_PROGRESS' || gameState.status === 'WAITING_FOR_PLAYER') {
      return <GamePlay gameState={gameState} stompClient={stompClient} />;
    } else if (gameState.status === 'COMPLETED') {
      return <GameResults gameState={gameState} />;
    }
    
    return <Typography>Unknown game state</Typography>;
  };
  
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