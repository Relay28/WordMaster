import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Avatar, List, ListItem, 
  ListItemAvatar, ListItemText, Container, Grid, useMediaQuery, useTheme
} from '@mui/material';
import { Person, EmojiEvents, ArrowBack } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';

const GameResults = ({ gameState }) => {
  const navigate = useNavigate();
  const { user } = useUserAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const isTeacher = user?.role === 'USER_TEACHER';
  const podiumPlayers = [...(gameState.leaderboard || [])].slice(0, 3);
  const myRank = gameState.leaderboard?.findIndex(player => player.userId === user?.id) + 1 || 0;

  const [showConfetti, setShowConfetti] = React.useState(false);

React.useEffect(() => {
  if (podiumPlayers.length > 0) {
    setShowConfetti(true);
    // No timeout needed for continuous confetti
  }
}, [podiumPlayers]);

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '12px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };


const ConfettiPiece = ({ color, left, delay, size, rotate }) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size * 0.4,
      backgroundColor: color,
      left: `${left}%`,
      top: -20,
      opacity: 0.8,
      transform: `rotate(${rotate}deg)`,
      zIndex: 1000,
      animation: `
        confettiFall ${3 + Math.random() * 2}s linear ${delay}s infinite,
        confettiSway ${2 + Math.random()}s ease-in-out ${delay}s infinite alternate
      `,
      '@keyframes confettiFall': {
        '0%': {
          top: '-10%',
          transform: `rotate(${rotate}deg)`
        },
        '100%': {
          top: '100%',
          transform: `rotate(${rotate + 360}deg)`
        }
      },
      '@keyframes confettiSway': {
        '0%': {
          marginLeft: '0px'
        },
        '50%': {
          marginLeft: `${-15 - Math.random() * 30}px`
        },
        '100%': {
          marginLeft: `${15 + Math.random() * 30}px`
        }
      }
    }}
  />
);


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
      p: 2,
      backdropFilter: 'blur(2px)',
      overflow: 'auto',
    }}>

      {/* Confetti Container - MOVED HERE (outside main content) */}
   {showConfetti && (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000,
      overflow: 'hidden'
    }}
  >
    {[...Array(500)].map((_, i) => ( // Changed from 200 to 500
      <ConfettiPiece
        key={i}
        color={[
          '#FFD700', // Gold
          '#FF6B6B', // Coral
          '#4ECDC4', // Turquoise
          '#45B7D1', // Sky Blue
          '#96CEB4', // Mint
          '#FFEEAD', // Cream
          '#D4A5A5', // Pink
          '#9B59B6', // Purple
        ][Math.floor(Math.random() * 8)]}
        left={Math.random() * 100}
        delay={Math.random() * 5} // Increased delay range for more variation
        size={3 + Math.random() * 8} // Slightly smaller size range for better performance
        rotate={Math.random() * 360}
      />
    ))}
  </Box>
)}

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '4px solid #5F4B8B',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          p: isMobile ? 2 : 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
            opacity: 0.8
          }
        }}>
          {/* Game Over Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography sx={{ 
              ...pixelHeading,
              fontWeight: 'bold',
              color: '#2d3748',
              fontSize: isMobile ? '16px' : '24px',
              textShadow: '1px 1px 0 rgba(0,0,0,0.1)',
              mb: 1
            }}>
              GAME OVER!
            </Typography>
            
            <Typography sx={{ 
              ...pixelText,
              color: '#5F4B8B',
              fontSize: isMobile ? '10px' : '12px'
            }}>
              {gameState.contentInfo?.title || 'Game'} has ended
            </Typography>
          </Box>
          
          {/* Player Rank */}
          {myRank > 0 && (
            <Box sx={{ 
              backgroundColor: 'rgba(95, 75, 139, 0.1)',
              borderRadius: '8px',
              border: '2px solid rgba(95, 75, 139, 0.3)',
              p: 2,
              mb: 4,
              textAlign: 'center',
              maxWidth: 300,
              mx: 'auto'
            }}>
              <Typography sx={{ 
                ...pixelHeading, 
                color: '#5F4B8B',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                YOUR RANK: <span style={{ color: '#2d3748', fontWeight: 'bold' }}>{myRank}</span> 
                {myRank === 1 && ' 🏆'}
              </Typography>
            </Box>
          )}
          
          {/* Winners Podium */}
          {podiumPlayers.length > 0 && (
  <Box sx={{ 
    mb: 4,
    position: 'relative',
    height: 320,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: isMobile ? 1 : 2,
    overflow: 'visible' // Add this to parent container
  }}>

                {/* Third Place */}
                {podiumPlayers.length > 2 && (
                  <Box sx={{
                    position: 'relative',
                    width: '22%',
                    maxWidth: 150,
                    animation: 'slideUp 0.6s ease-out 0.3s both',
                    '@keyframes slideUp': {
                      '0%': { transform: 'translateY(100px)', opacity: 0 },
                      '100%': { transform: 'translateY(0)', opacity: 1 }
                    }
                  }}>
                    {/* Name at the top */}
                    <Box sx={{
                      textAlign: 'center',
                      mb: 1,
                      height: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end'
                    }}>
                      
                      <Avatar sx={{
                        width: isMobile ? 30 : 40,
                        height: isMobile ? 30 : 40,
                        margin: '8px auto 0',
                        bgcolor: '#CD7F32',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        border: '3px solid #CD7F32'
                      }}>
                        3
                      </Avatar>

                      <Typography sx={{ 
                        fontSize: isMobile ? '0.9rem' : '1.1rem',
                        fontWeight: 'bold',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        px: 1,
                        color: '#2d3748'
                      }}>
                        {podiumPlayers[2].name}
                      </Typography>
                    </Box>
                    
                    {/* Score inside podium */}
                    <Box sx={{
                      height: 80,
                      width: '100%',
                      bgcolor: '#CD7F32',
                      borderRadius: '8px 8px 0 0',
                      border: '3px solid #CD7F32',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: 'bold'
                    }}>
                      {podiumPlayers[2].score} pts
                    </Box>
                  </Box>
                )}

                {/* First Place */}
                {podiumPlayers.length > 0 && (
                  <Box sx={{
                    position: 'relative',
                    width: '26%',
                    maxWidth: 180,
                    zIndex: 1,
                    animation: 'slideUp 0.6s ease-out 0.1s both, bounce 1s ease-in-out 1s',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-20px)' }
                    }
                  }}>
                    {/* Name at the top */}
                    <Box sx={{
                      textAlign: 'center',
                      mb: 1,
                      height: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end'
                    }}>
                    
                      <Avatar sx={{
                        width: isMobile ? 30 : 40,
                        height: isMobile ? 30 : 40,
                        margin: '8px auto 0',
                        bgcolor: '#FFD700',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: '3px solid #FFD700',
                      }}>
                        1
                      </Avatar>
                      <Typography sx={{ 
                        fontSize: isMobile ? '1.1rem' : '1.3rem',
                        fontWeight: 'bold',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        px: 1,
                        color: '#2d3748',
                      }}>
                        {podiumPlayers[0].name}
                      </Typography>
                    </Box>
                    
                    {/* Score inside podium */}
                    <Box sx={{
                      height: 140,
                      width: '100%',
                      bgcolor: '#FFD700',
                      borderRadius: '8px 8px 0 0',
                      border: '3px solid #FFD700',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: 'bold'
                    }}>
                      {podiumPlayers[0].score} pts
                    </Box>
                  </Box>
                )}

                {/* Second Place */}
                {podiumPlayers.length > 1 && (
                  <Box sx={{
                    position: 'relative',
                    width: '22%',
                    maxWidth: 150,
                    animation: 'slideUp 0.6s ease-out 0.2s both',
                  }}>
                    {/* Name at the top */}
                    <Box sx={{
                      textAlign: 'center',
                      mb: 1,
                      height: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end'
                    }}>
                      
                      <Avatar sx={{
                        width: isMobile ? 30 : 40,
                        height: isMobile ? 30 : 40,
                        margin: '8px auto 0',
                        bgcolor: '#C0C0C0',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        border: '3px solid #C0C0C0'
                      }}>
                        2
                      </Avatar>

                      <Typography sx={{ 
                        fontSize: isMobile ? '0.9rem' : '1.1rem',
                        fontWeight: 'bold',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        px: 1,
                        color: '#2d3748'
                      }}>
                        {podiumPlayers[1].name}
                      </Typography>
                    </Box>
                    
                    {/* Score inside podium */}
                    <Box sx={{
                      height: 100,
                      width: '100%',
                      bgcolor: '#C0C0C0',
                      borderRadius: '8px 8px 0 0',
                      border: '3px solid #C0C0C0',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: 'bold'
                    }}>
                      {podiumPlayers[1].score} pts
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          
          {/* Leaderboard */}
          <Paper elevation={0} sx={{ 
            mb: 4, 
            borderRadius: '8px',
            border: '3px solid #5F4B8B',
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.7)'
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
                fontSize: isMobile ? '14px' : '16px'
              }}>
                LEADERBOARD
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {gameState.leaderboard?.map((player, index) => (
                <ListItem 
                  key={player.id}
                  sx={{
                    borderBottom: '1px solid rgba(95, 75, 139, 0.2)',
                    backgroundColor: player.userId === user?.id ? 'rgba(95, 75, 139, 0.1)' : 'inherit',
                    '&:last-child': { borderBottom: 'none' },
                    px: isMobile ? 1 : 2,
                    py: 1.5
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        width: isMobile ? 28 : 32, 
                        height: isMobile ? 28 : 32, 
                        bgcolor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#5F4B8B',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ 
                        ...pixelText,
                        fontSize: isMobile ? '9px' : '10px',
                        fontWeight: player.userId === user?.id ? 'bold' : 'normal'
                      }}>
                        {player.name}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ 
                        ...pixelText, 
                        color: '#5F4B8B',
                        fontSize: isMobile ? '8px' : '9px'
                      }}>
                        {player.role || 'Player'}
                      </Typography>
                    }
                    sx={{ my: 0 }}
                  />
                  <Typography sx={{ 
                    ...pixelHeading, 
                    fontWeight: 'bold',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    {player.score} pts
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
          
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
              {isTeacher ? 'BACK TO DASHBOARD' : 'BACK TO HOMEPAGE'}
            </Button>
             <Button
              variant="contained"
              startIcon={<ArrowBack />}
             onClick={() => navigate(isTeacher ? '/content/dashboard' : `/results/${gameState.sessionId}`)}
              sx={{
                ...pixelButton,
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
            >RESULTS</Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default GameResults;