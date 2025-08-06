import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Avatar, List, ListItem, Divider,
  ListItemAvatar, ListItemText, Container, Grid, useMediaQuery, useTheme, Tab, Tabs
} from '@mui/material';
import { Person, EmojiEvents, ArrowBack, QuestionAnswer } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import ComprehensionQuiz from './ComprehensionQuiz';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';

const GameResults = ({ gameState, quizCompleted }) => {
  const navigate = useNavigate();
  const { user, getToken } = useUserAuth();
  const theme = useTheme();
  const ismobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [comprehensionQuestions, setComprehensionQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const isTeacher = user?.role === 'USER_TEACHER';

   const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const myRank = leaderboard?.findIndex(player => player.userId === user?.id) + 1 || 0;
  const myScore = leaderboard?.find(p => p.userId === user?.id)?.score || 0;
    const podiumPlayers = [...(leaderboard || [])].slice(0, 3);
   useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!gameState.sessionId) return;
      
      try {
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const response = await fetch(
          `${API_URL}/api/sessions/${gameState.sessionId}/leaderboard`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        } else {
          console.error('Failed to fetch leaderboard');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [gameState.sessionId, getToken]);
  // Fetch comprehension questions if they exist and haven't been completed
  useEffect(() => {
    const fetchComprehensionQuestions = async () => {
      if (!gameState.sessionId || !user?.id || quizCompleted) {
        // Skip fetching if quiz was completed
        return;
      }
      
      setLoading(true);
      try {
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const response = await fetch(
          `${API_URL}/api/teacher-feedback/comprehension/${gameState.sessionId}/student/${user.id}/questions`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setComprehensionQuestions(data);
            // Only auto-switch if not completed previously
            if (!quizCompleted) {
              setTabValue(1);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching comprehension questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComprehensionQuestions();
  }, [gameState.sessionId, user?.id, getToken, quizCompleted]);
  
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '12px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };
  
  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: ismobile ? '10px' : '12px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };
  
  const handleBackToClassroom = () => {
    navigate('/homepage');
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleQuizComplete = (results) => {
    console.log('Quiz completed with results:', results);
    // Could show a success message or other UI updates here
  };
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      pt: 4, 
      pb: 8,
      backgroundImage: `linear-gradient(to bottom, 
        rgba(255, 255, 255, 0.9) 0%, 
        rgba(249, 249, 249, 0.8) 100%),
      url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" mb={2}>
          <Typography sx={{ ...pixelHeading, fontSize: ismobile ? '16px' : '20px' }}>
            Game Results
          </Typography>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ 
            mb: 2,
            '& .MuiTab-root': pixelText,
            '& .Mui-selected': { color: '#5F4B8B' },
            '& .MuiTabs-indicator': { backgroundColor: '#5F4B8B' }
          }}
        >
          <Tab icon={<EmojiEvents />} label="LEADERBOARD" />
          {comprehensionQuestions && !quizCompleted && (
            <Tab icon={<QuestionAnswer />} label="COMPREHENSION CHECK" />
          )}
        </Tabs>
        
        {tabValue === 0 && (
          <>
            {/* Original leaderboard content */}
           <Grid container spacing={4}>
            {/* Left column: Your Results and Top Performers stacked */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, height: '100%', ml: 1 }}>
                {/* Your Results */}
                <Paper elevation={0} sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '4px solid #5F4B8B',
                  borderRadius: '6px',
                  minHeight: 180,
                  mb: 0,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  width: '500px',
                }}>
                  <Typography sx={pixelHeading} gutterBottom>YOUR RESULTS</Typography>
                  <Divider sx={{ my: 2 }} />
                  {leaderboardLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <Typography sx={pixelText}>Loading results...</Typography>
                    </Box>
                  ) : myRank > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                      
                      
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography sx={{ ...pixelHeading, fontSize: '24px', color: '#5F4B8B', mb: 2 }}>
                            #{myRank}
                          </Typography>
                          <Typography sx={pixelText} gutterBottom>YOUR RANK</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography sx={{ ...pixelHeading, fontSize: '24px', color: '#5F4B8B', mb: 2 }}>
                            {myScore}
                          </Typography>
                          <Typography sx={pixelText}>TOTAL POINTS</Typography>
                        </Box>

                      </Box>

                      <Button
                        variant="contained"
                        color="primary"
                        sx={{
                          ...pixelText,
                          mt: 3,
                          backgroundColor: '#5F4B8B',
                          '&:hover': { backgroundColor: '#4a3a6d' }
                        }}
                        onClick={() => navigate(`/student-report/${gameState.sessionId}/${user?.id}`)}
                      >
                        View Detailed Report
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                      <Typography sx={pixelText}>You didn't participate in this game.</Typography>
                    </Box>
                  )}
                </Paper>
                {/* Top Performers */}
                <Paper elevation={0} sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '4px solid #5F4B8B',
                  borderRadius: '6px',
                  minHeight: 300,
                  mt: 0,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'Top',
                  width: '500px',
                }}>
                  <Typography sx={pixelHeading} gutterBottom>TOP PERFORMERS</Typography>
                  
                  {podiumPlayers.length > 0 ? (
                    <List>
                      {podiumPlayers.map((player, index) => (
                        <ListItem key={index} sx={{
                          mb: 2,
                          backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                          borderRadius: '4px',
                          border: index === 0 ? '1px dashed gold' : 'none',
                          p: 2
                        }}>
                          <ListItemAvatar>
                            <Avatar sx={{
                              bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                              color: 'white'
                            }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={player.name || 'Unknown Player'}
                            secondary={`Role: ${player.role || 'Participant'}`}
                            primaryTypographyProps={{ sx: pixelHeading }}
                            secondaryTypographyProps={{ sx: pixelText }}
                          />
                          <Typography sx={{ ...pixelHeading, color: '#5F4B8B', ml: 5.5 }}>
                            {player.score} pts
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography sx={pixelText}>No players in this session.</Typography>
                  )}
                </Paper>
              </Box>
            </Grid>
            {/* Right column: Leaderboard */}
            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={{
                borderRadius: '8px',
                border: '3px solid #5F4B8B',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                height: '100%',
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column',
                width: '150%',
              }}>
                <Box sx={{
                  bgcolor: '#5F4B8B',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <EmojiEvents sx={{ mr: 1, color: '#FFD700' }} />
                  <Typography sx={{
                    ...pixelHeading,
                    color: 'white',
                    fontSize: ismobile ? '14px' : '16px'
                  }}>
                    LEADERBOARD
                  </Typography>
                </Box>
                {leaderboardLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Typography sx={pixelText}>Loading leaderboard...</Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {leaderboard.map((player, index) => (
                      <ListItem
                        key={player.id}
                        sx={{
                          borderBottom: '1px solid rgba(95, 75, 139, 0.2)',
                          backgroundColor: player.userId === user?.id ? 'rgba(95, 75, 139, 0.1)' : 'inherit',
                          '&:last-child': { borderBottom: 'none' },
                          px: ismobile ? 1 : 2,
                          py: 1.5
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: ismobile ? 28 : 32,
                              height: ismobile ? 28 : 32,
                              bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B',
                              fontSize: ismobile ? '0.8rem' : '0.9rem'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography sx={{
                              ...pixelText,
                              fontSize: ismobile ? '9px' : '10px',
                              fontWeight: player.userId === user?.id ? 'bold' : 'normal'
                            }}>
                              {player.name}
                            </Typography>
                          }
                          secondary={
                            <Typography sx={{
                              ...pixelText,
                              color: '#5F4B8B',
                              fontSize: ismobile ? '8px' : '9px'
                            }}>
                              {player.role || 'Player'}
                            </Typography>
                          }
                          sx={{ my: 0 }}
                        />
                        <Typography sx={{
                          ...pixelHeading,
                          fontWeight: 'bold',
                          fontSize: ismobile ? '12px' : '14px'
                        }}>
                          {player.score} pts
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
            
            {/* Navigation Button */}
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => navigate(isTeacher ? '/content/dashboard' : '/homepage')}
                sx={{
                  ...pixelButton,
                  backgroundColor: '#5F4B8B',
                  '&:hover': { 
                    backgroundColor: '#4a3a6d',
                    transform: 'translateY(-2px)'
                  },
                  borderRadius: '4px',
                  mt: 4,
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
                  fontSize: ismobile ? '10px' : '12px'
                }}
              >
                {isTeacher ? 'BACK TO DASHBOARD' : 'BACK TO HOMEPAGE'}
              </Button>
            </Box>
          </>
        )}
        
        {tabValue === 1 && comprehensionQuestions && (
          <ComprehensionQuiz 
            sessionId={gameState.sessionId}
            studentId={user?.id}
            questions={comprehensionQuestions}
            onComplete={handleQuizComplete}
          />
        )}
      </Container>
    </Box>
  );
};

export default GameResults;