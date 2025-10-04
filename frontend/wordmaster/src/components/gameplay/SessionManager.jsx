import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from "../context/UserAuthContext";
import { 
  Box, Typography, Button, Grid, 
  CircularProgress, useMediaQuery, 
  useTheme, Paper, Dialog, DialogTitle,
  DialogContent, Avatar, List, ListItem,
  ListItemText, ListItemAvatar, Stack, 
} from '@mui/material';
import picbg from '../../assets/picbg.png'
import defaultProfile from '../../assets/defaultprofile.png'
import { Person, EmojiEvents, ArrowBack, QuestionAnswer, Class, AccessTime, People } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL;

const TeacherContentSessions = () => {
      const navigate = useNavigate();
  const { getToken } = useUserAuth();
  const { contentId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const theme = useTheme();
     const [selectedSession, setSelectedSession] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSession(null);
  };

  // Session Details Dialog Component
   const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '12px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };
  
   const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '16px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

   const endSession = async (sessionId) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_URL}/api/sessions/${sessionId}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //alert("Session ended successfully!");
      window.location.reload();
    } catch (err) {
      alert("Failed to end session. Please try again.");
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.get(
          `${API_URL}/api/sessions/teacher/sessions/content/${contentId}/active`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSessions(response.data);
      } catch (err) {
        setError("Failed to fetch sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchSessions();
    }
  }, [contentId, getToken]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );

const SessionDetailsDialog = ({ session, open, onClose }) => {
  if (!session) return null;

  // Enhanced debugging for session data
  console.log("Session details:", {
    id: session.sessionId,
    code: session.sessionCode,
    playerCount: session.players?.length || 0
  });
  
  // Debug to see what we're getting
  console.log("Session players:", session.players);
  if (session.players && session.players.length > 0) {
    const firstPlayer = session.players[0];
    console.log("First player:", firstPlayer);
    console.log("First player keys:", Object.keys(firstPlayer));
    console.log("First player role:", firstPlayer.role);
    console.log("First player gameRole:", firstPlayer.gameRole);
    console.log("First player role:", session.players[0].role);
  }  // Function to get player role display name
  const getPlayerRoleDisplay = (player) => {
    console.log("Getting role for player:", player);
    console.log("Object keys:", Object.keys(player));
    
    // Prioritize game-specific role if available
    if (player.gameRole) {
      return player.gameRole;
    }
    
    // Fall back to system role if available
    if (player.role) {
      return player.role;
    }
    
    // Check for sessionRole (legacy support)
    if (player.sessionRole) {
      return player.sessionRole;
    }
    
    return "Student"; // Default fallback
  };
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#F8F9FA',
          borderRadius: '12px',
          border: '3px solid #5F4B8B',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          minHeight: '70vh'
        }
      }}
    >
      {/* Header - Larger and more prominent */}
      <Box sx={{
        backgroundColor: '#5F4B8B',
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid rgba(255,255,255,0.2)'
      }}>
        <Typography sx={{ 
          fontFamily: '"Press Start 2P", cursive',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          SESSION DETAILS
        </Typography>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '8px 16px',
            border: '2px solid white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)'
            }
          }}
        >
          CLOSE
        </Button>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Session Info - Bigger and more organized */}
        <Box sx={{ 
          p: 4,
          borderBottom: '2px solid #E0E0E0',
          backgroundColor: 'white'
        }}>
          <Typography sx={{ 
            fontFamily: '"Press Start 2P", cursive',
            color: '#5F4B8B',
            fontSize: '16px',
            mb: 3,
            fontWeight: 'bold'
          }}>
            SESSION INFO
          </Typography>
          
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3
          }}>
            <BigInfoItem icon={<Class sx={{ fontSize: '24px' }} />} 
              label="SESSION CODE" value={session.sessionCode} />
            <BigInfoItem icon={<Person sx={{ fontSize: '24px' }} />} 
              label="STATUS" value={session.status.toUpperCase()} 
              highlight={session.status === 'active'} />
            <BigInfoItem icon={<AccessTime sx={{ fontSize: '24px' }} />} 
              label="START TIME" 
              value={new Date(session.startedAt).toLocaleString()} />
            <BigInfoItem icon={<People sx={{ fontSize: '24px' }} />} 
              label="PLAYER COUNT" value={session.players.length} />
          </Box>
        </Box>

        {/* Leaderboards and Players - Larger and more spacious */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          height: '55vh',
          overflow: 'hidden'
        }}>
          {/* Leaderboards - Bigger font and spacing */}
          <Box sx={{ 
            flex: 1,
            p: 4,
            borderRight: { sm: '2px solid #E0E0E0' },
            borderBottom: { xs: '2px solid #E0E0E0', sm: 'none' },
            overflowY: 'auto'
          }}>
            <Typography sx={{ 
              fontFamily: '"Press Start 2P", cursive',
              color: '#5F4B8B',
              fontSize: '16px',
              mb: 3,
              fontWeight: 'bold'
            }}>
              LEADERBOARDS
            </Typography>
            
            <List dense sx={{ p: 0 }}>
              {session.leaderboard.map((entry, index) => (
                <ListItem key={index} sx={{ 
                  p: '12px 0',
                  borderBottom: '2px solid #F0F0F0'
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40,
                      fontSize: '18px',
                      bgcolor: index < 3 ? 
                        ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B'
                    }}>
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ 
                        fontFamily: '"Press Start 2P", cursive',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        lineHeight: '1.4'
                      }}>
                        {entry.name}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ 
                        fontFamily: '"Press Start 2P", cursive',
                        fontSize: '12px',
                        color: '#5F4B8B',
                        mt: 1
                      }}>
                        Score: {entry.score} pts
                      </Typography>
                    }
                    sx={{ ml: 2 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Players - Larger avatars and text */}
          <Box sx={{ 
            flex: 1, 
            p: 4,
            overflowY: 'auto'
          }}>
            <Typography sx={{ 
              fontFamily: '"Press Start 2P", cursive',
              color: '#5F4B8B',
              fontSize: '16px',
              mb: 3,
              fontWeight: 'bold'
            }}>
              PLAYERS
            </Typography>

<List dense sx={{ p: 0 }}>
  {session.players.map((player) => (
    <ListItem key={player.id} sx={{ 
      p: '12px 0',
      borderBottom: '2px solid #F0F0F0'
    }}>
      <ListItemAvatar>
        <Avatar 
          src={player.profilePicture || defaultProfile}
          sx={{ 
            width: 48, 
            height: 48,
            fontSize: '20px',
            bgcolor: '#5F4B8B'
          }}
        >
          {/* Use playerName property which is what the backend sends */}
          {player.playerName?.charAt(0).toUpperCase() || player.name?.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography sx={{ 
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '14px',
            fontWeight: 'bold',
            lineHeight: '1.4'
          }}>
            {/* Use playerName property which is what the backend sends */}
            {player.playerName || player.name || "Unknown Player"}
          </Typography>
        }
        secondary={
          <Typography sx={{ 
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '12px',
            color: '#5F4B8B',
            mt: 1
          }}>
             Role: {getPlayerRoleDisplay(player)}
          </Typography>
        }
        sx={{ ml: 3 }}
      />
    </ListItem>
  ))}
</List>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Bigger Info Item Component
const BigInfoItem = ({ icon, label, value, highlight = false }) => (
  <Box sx={{ 
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    p: 2,
    backgroundColor: 'rgba(95, 75, 139, 0.05)',
    borderRadius: '8px'
  }}>
    <Box sx={{ 
      color: '#5F4B8B',
      display: 'flex',
      alignItems: 'center'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ 
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#666',
        mb: 1,
        textTransform: 'uppercase'
      }}>
        {label}
      </Typography>
      <Typography sx={{ 
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '14px',
        color: highlight ? '#4CAF50' : '#2D3748',
        fontWeight: 'bold'
      }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// Helper component for info items
const InfoItem = ({ label, value, highlight = false }) => (
  <Box>
    <Typography sx={{ 
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#666',
      mb: 0.5
    }}>
      {label}
    </Typography>
    <Typography sx={{ 
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: highlight ? '#4CAF50' : '#2D3748',
      fontWeight: 'bold'
    }}>
      {value}
    </Typography>
  </Box>
);

// Updated DetailItem component with larger text
const DetailItem = ({ icon, label, value, color, fontSize = '10px' }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center',
    mb: 2.5, // More spacing
    '&:last-child': { mb: 0 }
  }}>
    <Box sx={{ 
      mr: 2,
      color: '#5F4B8B',
      display: 'flex',
      alignItems: 'center',
      minWidth: '32px' // Ensure consistent icon spacing
    }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ 
        ...pixelText, 
        color: '#666',
        fontSize: fontSize,
        mb: 1,
        textTransform: 'uppercase' // More emphasis
      }}>
        {label}
      </Typography>
      <Typography sx={{ 
        ...pixelText, 
        color: color || '#2D3748',
        fontSize: fontSize,
        fontWeight: 'bold'
      }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// Updated PlayerListItem with larger text
const PlayerListItem = ({ player, pixelText, fontSize = '10px' }) => {
  // Function to get player role display name - same as in SessionDetailsDialog
  const getPlayerRoleDisplay = (player) => {
    console.log("PlayerListItem - Getting role for player:", player);
    console.log("PlayerListItem - Object keys:", Object.keys(player));
    
    // Prioritize game-specific role if available
    if (player.gameRole) {
      return player.gameRole;
    }
    
    // Fall back to system role if available
    if (player.role) {
      return player.role;
    }
    
    // Check for sessionRole (legacy support)
    if (player.sessionRole) {
      return player.sessionRole;
    }
    
    return "Student"; // Default fallback
  };
  
  return (
    // In the part where player info is displayed in the dialog
    <ListItem key={player.id} sx={{ 
      p: '12px 0',
      borderBottom: '2px solid #F0F0F0'
    }}>
      <ListItemAvatar>
        <Avatar 
          src={player.profilePicture || defaultProfile}
          sx={{ 
            width: 48, 
            height: 48,
            fontSize: '20px',
            bgcolor: '#5F4B8B'
          }}
        >
          {/* Use playerName instead of name if available */}
          {(player.playerName || player.name)?.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography sx={{ 
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '14px',
            fontWeight: 'bold',
            lineHeight: '1.4'
          }}>
            {/* Use playerName instead of name if available */}
            {player.playerName || player.name || "Unknown Player"}
          </Typography>
        }
        secondary={
          <Typography sx={{ 
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '12px',
            color: '#5F4B8B',
            mt: 1
          }}>
            Role: {getPlayerRoleDisplay(player)}
          </Typography>
        }
        sx={{ ml: 3 }}
      />
    </ListItem>
  );
};

// Updated LeaderboardItem with larger text
const LeaderboardItem = ({ entry, index, pixelText, fontSize = '10px' }) => (
  <ListItem sx={{ 
    p: '12px 0',
    '&:not(:last-child)': {
      borderBottom: '2px solid rgba(95, 75, 139, 0.1)'
    }
  }}>
    <ListItemAvatar>
      <Avatar sx={{ 
        bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B',
        width: 40,
        height: 40,
        fontSize: '16px'
      }}>
        {index + 1}
      </Avatar>
    </ListItemAvatar>
    <ListItemText
      primary={
        <Typography sx={{ 
          ...pixelText, 
          fontSize: fontSize,
          fontWeight: 'bold'
        }}>
          {entry.name}
        </Typography>
      }
      secondary={
        <Typography sx={{ 
          ...pixelText, 
          fontSize: fontSize,
          color: '#5F4B8B'
        }}>
          Score: {entry.score} pts
        </Typography>
      }
      sx={{ ml: 2 }}
    />
    {index < 3 && (
      <EmojiEvents sx={{ 
        color: ['#FFD700', '#C0C0C0', '#CD7F32'][index],
        fontSize: '32px', // Larger medal icon
        ml: 2
      }} />
    )}
  </ListItem>
);



  if (error) return <p>{error}</p>;
return (
    <>
               
    
  <Box sx={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
      background: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), 
                url(${picbg})`, // Keep your existing background
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    p: 4, // Padding
    overflow: 'auto',
    display: 'flex', // Add flex container
    flexDirection: 'column'
  }}>

      <Button
        variant="contained"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/homepage')}
        sx={{
          ...pixelButton,
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: '#5F4B8B',
          '&:hover': { 
            backgroundColor: '#4a3a6d',
            transform: 'translateY(-2px)'
          },
          borderRadius: '4px',
          px: 3,
          py: 1.5,
          borderStyle: 'outset',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
          textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
          transition: 'all 0.1s ease',
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
            borderStyle: 'inset'
          },
          fontSize: '12px'
        }}
      >
        BACK TO HOMEPAGE
      </Button>
    <Box sx={{ 
      flex: 1, // Take available space
      width: '100%',
      maxWidth: '1500px', // Increased max-width
      mx: 'auto',
      py: 4
    }}>
      <Typography sx={{ 
        ...pixelHeading, 
        textAlign: 'center', 
        mb: 4, // Margin
        fontSize: '16px' // Font size
      }}>
        ACTIVE GAME SESSIONS
      </Typography>

      <Grid container spacing={4}> {/* Grid spacing */}
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={session.sessionId} // Added xl breakpoint
              sx={{ display: 'flex' }} // Make grid items flex containers
            >
              <Paper sx={{
                p: 3, // Padding
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px)',
                border: '4px solid #5F4B8B)',
                flex: 1, // Take full height of grid item
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)'
                },
                boxShadow: '0 4px 20px rgba(95, 75, 139, 0.15))',
                margin: 1 // Add margin around papers
              }}>
                {/* Content Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ 
                    ...pixelText, 
                    fontSize: '10px',
                    mb: 1 
                  }}>
                    Session Code: {session.sessionCode}
                  </Typography>
                  <Typography sx={{ 
                    ...pixelText, 
                    fontSize: '10px'
                  }}>
                    Players: {session.players.length}
                  </Typography>
                </Box>

                {/* Buttons Section */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  mt: 2,
                  flexDirection: 'row' // Button layout
                }}>

<Button
  variant="contained"
  onClick={() => handleViewDetails(session)}
  sx={{
    flex: 1,
    py: 1,
    fontSize: '10px',
    backgroundColor: '#5F4B8B',
    color: 'white',
    fontFamily: '"Press Start 2P", cursive',
    '&:hover': {
      backgroundColor: '#4A3B6B',
      transform: 'scale(1.02)',
    },
    transition: 'all 0.2s ease-in-out'
  }}
>
  View Details
</Button>
<Button
  variant="contained"
  onClick={() => endSession(session.sessionId)}
  sx={{
    flex: 1,
    py: 1,
    fontSize: '10px',
    backgroundColor: '#FF6B6B',
    color: 'white',
    fontFamily: '"Press Start 2P", cursive',
    '&:hover': {
      backgroundColor: '#FF4F4F',
      transform: 'scale(1.02)',
    },
    transition: 'all 0.2s ease-in-out'
  }}
>
  End Session
</Button>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 4 }}>
            <Typography sx={{ ...pixelText, fontSize: '12px' }}>
              No active sessions found
            </Typography>
          </Grid>
        )}
      </Grid>

      <SessionDetailsDialog 
        session={selectedSession}
        open={openDialog}
        onClose={handleCloseDialog}
      />
    </Box>
  </Box>
  </>
);
};

export default TeacherContentSessions;