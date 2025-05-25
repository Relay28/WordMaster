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
  ListItemText, ListItemAvatar
} from '@mui/material';
import picbg from '../../assets/picbg.png'
import { Person, EmojiEvents, ArrowBack, QuestionAnswer } from '@mui/icons-material';

const TeacherContentSessions = () => {
      const navigate = useNavigate();
  const { getToken } = useUserAuth();
  const { contentId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    fontSize: isMobile ? '10px' : '12px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };
  
   const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '14px' : '16px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

   const endSession = async (sessionId) => {
    try {
      const token = await getToken();
      await axios.post(
        `http://localhost:8080/api/sessions/${sessionId}/end`,
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
          `http://localhost:8080/api/sessions/teacher/sessions/content/${contentId}/active`,
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

  return (

    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '4px solid #5F4B8B',
          
        }
      }}
    >
      <DialogTitle sx={{ ...pixelHeading, textAlign: 'center', borderBottom: '2px solid #5F4B8B' }}>
        Session Details
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Session Information */}
          <Grid item xs={12}>
<Paper sx={{
  p: isMobile ? 2 : 3,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '4px solid #5F4B8B',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 6px 25px rgba(95, 75, 139, 0.25)',
  },
  boxShadow: '0 4px 20px rgba(95, 75, 139, 0.15)',
  margin: 1,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '8px',
    border: '2px solid rgba(95, 75, 139, 0.1)',
    margin: '8px',
    pointerEvents: 'none'
  }
}}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Session Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ ...pixelText, mb: 1 }}>
                    Session Code: {session.sessionCode}
                  </Typography>
                  <Typography sx={{ ...pixelText, mb: 1 }}>
                    Status: {session.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ ...pixelText, mb: 1 }}>
                    Started: {new Date(session.startedAt).toLocaleString()}
                  </Typography>
                  <Typography sx={{ ...pixelText }}>
                    Total Players: {session.players.length}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Players List */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: 'rgba(95, 75, 139, 0.1)', borderRadius: '8px', height: '100%' }}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Players
              </Typography>
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {session.players.map((player) => (
                  <ListItem 
                    key={player.id}
                    sx={{ 
                      mb: 1, 
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '4px'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={player.profilePicture} 
                        sx={{ bgcolor: '#5F4B8B' }}
                      >
                        {player.name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography sx={pixelText}>{player.name}</Typography>}
                      secondary={
                        <Typography sx={{...pixelText, fontSize: '8px', color: '#666'}}>
                          Role: {player.role || "No Role"}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Leaderboard */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: 'rgba(95, 75, 139, 0.1)', borderRadius: '8px', height: '100%' }}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Leaderboard
              </Typography>
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                {session.leaderboard.map((entry, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      mb: 1, 
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '4px'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography sx={pixelText}>{entry.name}</Typography>}
                      secondary={
                        <Typography sx={{...pixelText, fontSize: '8px', color: '#666'}}>
                          Score: {entry.score} points
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};


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
    p: isMobile ? 2 : 4, // Responsive padding
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
          fontSize: isMobile ? '10px' : '12px'
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
        mb: isMobile ? 2 : 4, // Responsive margin
        fontSize: isMobile ? '12px' : '16px' // Better mobile font size
      }}>
        ACTIVE GAME SESSIONS
      </Typography>

      <Grid container spacing={isMobile ? 2 : 4}> {/* Responsive grid spacing */}
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <Grid item xs={12} sm={6} lg={4} xl={3} key={session.sessionId} // Added xl breakpoint
              sx={{ display: 'flex' }} // Make grid items flex containers
            >
              <Paper sx={{
                p: isMobile ? 2 : 3, // Responsive padding
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
                    fontSize: isMobile ? '8px' : '10px',
                    mb: 1 
                  }}>
                    Session Code: {session.sessionCode}
                  </Typography>
                  <Typography sx={{ 
                    ...pixelText, 
                    fontSize: isMobile ? '8px' : '10px'
                  }}>
                    Players: {session.players.length}
                  </Typography>
                </Box>

                {/* Buttons Section */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  mt: 2,
                  flexDirection: isMobile ? 'column' : 'row' // Stack buttons on mobile
                }}>

<Button
  variant="contained"
  onClick={() => handleViewDetails(session)}
  sx={{
    flex: 1,
    py: isMobile ? 0.5 : 1,
    fontSize: isMobile ? '8px' : '10px',
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
    py: isMobile ? 0.5 : 1,
    fontSize: isMobile ? '8px' : '10px',
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
            <Typography sx={{ ...pixelText, fontSize: isMobile ? '10px' : '12px' }}>
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