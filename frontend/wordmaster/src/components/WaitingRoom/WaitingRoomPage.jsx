import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Typography, Button, Avatar, List, ListItem, 
  ListItemAvatar, ListItemText, CircularProgress,
  useMediaQuery, useTheme, IconButton
} from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import apiConfig from '../../services/apiConfig';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const WaitingRoomPage = () => {
  const { contentId } = useParams();
  const { user, getToken } = useUserAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const classroomId = location.state?.classroomId;

  const handleBackClick = () => {
    if (classroomId) {
      navigate(`/classroom/${classroomId}`);
    } else {
      navigate(-1);
    }
  };

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '6px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '10px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '6px' : '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${apiConfig.API_URL}/waiting-room/content/${contentId}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();

  const initializeWebSocket = async () => {
  try {
    const token = await getToken();
    const socket = new SockJS(`${apiConfig.API_URLv2}/ws?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => console.log('STOMP: ' + str),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to game start notifications
        client.subscribe(`/topic/game-start/${contentId}`, (message) => {
          const sessionData = JSON.parse(message.body);
          setGameStarted(true);
          if (user?.role === 'USER_STUDENT') {
            navigate(`/game/${sessionData.sessionId}`);
          }
        });

        // Subscribe to waiting room updates
        client.subscribe(`/topic/waiting-room/${contentId}/updates`, (message) => {
          const updatedStudents = JSON.parse(message.body);
          setStudents(updatedStudents);
        });

        // Join the waiting room when connected
        //joinWaitingRoom(client, token);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        setError('Failed to connect to game server');
      },
    });

    client.activate();
    setStompClient(client);
  } catch (error) {
    console.error('WebSocket initialization error:', error);
    setError('Failed to initialize connection');
  }
};

    initializeWebSocket();

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, [contentId, getToken, navigate, user?.role]);

  const handleStartGame = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`${apiConfig.API_URL}/waiting-room/content/${contentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
       if (user?.role === 'USER_TEACHER') {
        navigate(`/session/${contentId}`);
      }
      
      if (!response.ok) throw new Error('Failed to start game');
      setGameStarted(true);
      setLoading(false);
    } catch (error) {
      console.error("Error starting game:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      p: isMobile ? 1 : 2,
      backdropFilter: 'blur(2px)'
    }}>
      <IconButton 
        onClick={handleBackClick}
        sx={{
          position: 'absolute',
          top: isMobile ? 4 : 8,
          left: isMobile ? 4 : 8,
          color: '#5F4B8B',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          border: '2px solid #5F4B8B',
          borderRadius: '4px',
          width: isMobile ? '24px' : '32px',
          height: isMobile ? '24px' : '32px',
          '&:hover': {
            backgroundColor: 'rgba(95, 75, 139, 0.1)',
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <ChevronLeftIcon fontSize={isMobile ? "small" : "medium"} />
      </IconButton>
      <Box sx={{
        width: '100%',
        maxWidth: isMobile ? '400px' : '600px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: isMobile ? '8px' : '12px',
        border: isMobile ? '2px solid #5F4B8B' : '4px solid #5F4B8B',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
        p: isMobile ? 1.5 : 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isMobile ? '4px' : '6px',
          background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
          opacity: 0.8
        }
      }}>
        <Typography variant="h4" sx={{ 
          ...pixelHeading,
          fontWeight: 'bold',
          mb: isMobile ? 2 : 3,
          color: '#2d3748',
          fontSize: isMobile ? '10px' : '16px',
          textAlign: 'center',
          textShadow: '1px 1px 0 rgba(0,0,0,0.1)'
        }}>
          WAITING ROOM
        </Typography>

        {error && (
          <Box sx={{ 
            backgroundColor: '#ffebee',
            border: '2px solid #ef5350',
            borderRadius: '4px',
            p: isMobile ? 0.5 : 1,
            mb: isMobile ? 1 : 2,
            textAlign: 'center'
          }}>
            <Typography sx={{ ...pixelText, color: '#d32f2f' }}>
              {error}
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={isMobile ? 2 : 4}>
            <CircularProgress size={isMobile ? 20 : 40} />
          </Box>
        ) : (
          <>
            <List sx={{ 
              backgroundColor: 'rgba(245, 245, 247, 0.7)',
              borderRadius: isMobile ? '6px' : '8px',
              border: '2px solid rgba(95, 75, 139, 0.3)',
              p: isMobile ? 0.5 : 1,
              mb: isMobile ? 2 : 3,
              maxHeight: isMobile ? '200px' : '300px',
              overflowY: 'auto'
            }}>
              {students.map(student => (
                <ListItem 
                  key={student.id}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '4px',
                    mb: isMobile ? 0.5 : 1,
                    border: '2px solid rgba(95, 75, 139, 0.2)',
                    '&:last-child': { mb: 0 },
                    py: isMobile ? 0.5 : 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#5F4B8B',
                        width: isMobile ? 24 : 40,
                        height: isMobile ? 24 : 40,
                        color: 'white'
                      }}
                      src={student.profilePicture || undefined}
                    >
                      {!student.profilePicture && student.fname?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`${student.fname}`} 
                    primaryTypographyProps={{ sx: pixelText }}
                  />
                </ListItem>
              ))}
            </List>

            {!gameStarted ? (
              <>
                <Typography sx={{ 
                  ...pixelText,
                  textAlign: 'center',
                  mb: isMobile ? 1 : 2,
                  color: '#5F4B8B'
                }}>
                  {students.length} PLAYER{students.length !== 1 ? 'S' : ''} READY
                </Typography>

                {user?.role === 'USER_TEACHER' && (
                  <Box textAlign="center">
                    <Button
                      variant="contained"
                      onClick={handleStartGame}
                      disabled={loading}
                      sx={{
                        ...pixelButton,
                        backgroundColor: '#6c63ff',
                        '&:hover': { 
                          backgroundColor: '#5a52e0',
                          transform: 'translateY(-2px)'
                        },
                        borderRadius: '4px',
                        px: isMobile ? 2 : 3,
                        py: isMobile ? 0.5 : 1.5,
                        minWidth: isMobile ? 'auto' : '200px',
                        borderStyle: 'outset',
                        boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                        textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                        transition: 'all 0.1s ease',
                        height: isMobile ? '28px' : 'auto',
                        '&:active': {
                          transform: 'translateY(1px)',
                          boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                          borderStyle: 'inset'
                        },
                        '&.Mui-disabled': {
                          backgroundColor: '#e0e0e0',
                          color: '#a0a0a0',
                          borderStyle: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {loading ? (
                        <CircularProgress 
                          size={isMobile ? 16 : 24} 
                          sx={{ 
                            color: 'inherit',
                            filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                          }} 
                        />
                      ) : (
                        'START GAME'
                      )}
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ 
                mb: isMobile ? 2 : 3,
                p: isMobile ? 1 : 2,
                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                borderRadius: isMobile ? '6px' : '8px',
                border: '2px solid #6c63ff',
                textAlign: 'center'
              }}>
                <Typography sx={{ 
                  ...pixelHeading,
                  color: '#6c63ff',
                  mb: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? '8px' : '14px'
                }}>
                  GAME IN PROGRESS
                </Typography>
                {user?.role === 'USER_TEACHER' ? (
                  <Typography sx={{ 
                    ...pixelText,
                    color: '#5F4B8B',
                    fontSize: isMobile ? '6px' : '10px'
                  }}>
                    Students have been redirected to the game session
                  </Typography>
                ) : (
                  <Typography sx={{ 
                    ...pixelText,
                    color: '#5F4B8B',
                    fontSize: isMobile ? '6px' : '10px'
                  }}>
                    Redirecting to game session...
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default WaitingRoomPage;