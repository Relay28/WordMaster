import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import API_URL from '../../services/apiConfig';

const WaitingRoomPage = () => {
  const { contentId } = useParams();
  const { user, getToken } = useUserAuth();
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/waiting-room/content/${contentId}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
        // Handle error
      }
    };

    fetchStudents();

    const initializeWebSocket = async () => {
      try {
        const token = await getToken();
        const socket = new SockJS(`${API_URL}/ws?token=${token}`);
        const client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            'Authorization': `Bearer ${token}`
          },
          debug: function (str) {
            console.log('STOMP: ' + str);
          },
          reconnectDelay: 5000,
          onConnect: () => {
            console.log('Connected to WebSocket');

            // Subscribe to session start notifications
            client.subscribe(`/topic/game-start/${contentId}`, (message) => {
              const sessionData = JSON.parse(message.body);
              // Redirect all users to the appropriate game session
              // Only redirect if the user is NOT the teacher
              if (user?.role !== 'USER_TEACHER') {
                navigate(`/game/${sessionData.sessionId}`);
              }
            });
          },
          onStompError: (frame) => {
            console.error('STOMP error', frame);
          },
        });

        client.activate();
        setStompClient(client);
      } catch (error) {
        console.error('WebSocket initialization error:', error);
      }
    };

    initializeWebSocket();

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [contentId, getToken, navigate, user?.role]);

  const handleStartGame = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/waiting-room/content/${contentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      // The teacher will stay on the GameCore page after starting the game
      // The students will be redirected via the WebSocket message
    } catch (error) {
      console.error("Error starting game:", error);
      // Handle error
    }
  };

  return (
    <Box>
      <Typography variant="h4">Waiting Room for Content {contentId}</Typography>
      <List>
        {students.map(student => (
          <ListItem key={student.id}>
            <ListItemText primary={`${student.fname} ${student.lname}`}/>
          </ListItem>
        ))}
      </List>
      {user?.role === 'USER_TEACHER' && (
        <Button variant="contained" color="primary" onClick={handleStartGame}>
          Start Game
        </Button>
      )}
    </Box>
  );
};

export default WaitingRoomPage;