import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import { Person, EmojiEvents, ArrowBack } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';

const GameResults = ({ gameState }) => {
  const navigate = useNavigate();
  const { user } = useUserAuth();
 
  const isTeacher = user?.role === 'USER_TEACHER';
  
  // Find top 3 players for podium
  const podiumPlayers = [...(gameState.leaderboard || [])].slice(0, 3);
  
  // Get current user's rank
  const myRank = gameState.leaderboard?.findIndex(player => player.userId === user?.id) + 1 || 0;
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" color="#5F4B8B" gutterBottom>
          Game Over!
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          {gameState.contentInfo?.title || 'Game'} has ended
        </Typography>
        
        {myRank > 0 && (
          <Typography variant="h5" mb={4}>
            Your Rank: <strong>{myRank}</strong> {myRank === 1 ? '🏆' : ''}
          </Typography>
        )}
      </Box>
      
      {/* Winners Podium */}
      {podiumPlayers.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={3} sx={{ justifyContent: 'center', alignItems: 'flex-end' }}>
            {/* Second Place */}
            {podiumPlayers.length > 1 && (
              <Grid item>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      margin: '0 auto', 
                      bgcolor: '#C0C0C0',
                      border: '3px solid #C0C0C0'
                    }}
                  >
                    <Typography variant="h4">2</Typography>
                  </Avatar>
                  <Typography variant="h6" mt={1}>{podiumPlayers[1].name}</Typography>
                  <Typography variant="body1" fontWeight="bold">{podiumPlayers[1].score} pts</Typography>
                </Box>
                <Box 
                  sx={{ 
                    height: 120, 
                    width: 120, 
                    bgcolor: '#e0e0e0',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              </Grid>
            )}
            
            {/* First Place */}
            {podiumPlayers.length > 0 && (
              <Grid item>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      margin: '0 auto', 
                      bgcolor: '#FFD700',
                      border: '4px solid #FFD700'
                    }}
                  >
                    <Typography variant="h3">1</Typography>
                  </Avatar>
                  <Typography variant="h5" mt={1} fontWeight="bold">{podiumPlayers[0].name}</Typography>
                  <Typography variant="h6" fontWeight="bold">{podiumPlayers[0].score} pts</Typography>
                </Box>
                <Box 
                  sx={{ 
                    height: 160, 
                    width: 140, 
                    bgcolor: '#e0e0e0',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              </Grid>
            )}
            
            {/* Third Place */}
            {podiumPlayers.length > 2 && (
              <Grid item>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 70, 
                      height: 70, 
                      margin: '0 auto', 
                      bgcolor: '#CD7F32',
                      border: '3px solid #CD7F32'
                    }}
                  >
                    <Typography variant="h5">3</Typography>
                  </Avatar>
                  <Typography variant="subtitle1" mt={1}>{podiumPlayers[2].name}</Typography>
                  <Typography variant="body1" fontWeight="bold">{podiumPlayers[2].score} pts</Typography>
                </Box>
                <Box 
                  sx={{ 
                    height: 80, 
                    width: 100, 
                    bgcolor: '#e0e0e0',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      
      {/* Complete Leaderboard */}
      <Paper elevation={3} sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#5F4B8B', p: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="white" display="flex" alignItems="center">
            <EmojiEvents sx={{ mr: 1 }} /> Complete Leaderboard
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gameState.leaderboard?.map((player, index) => (
                <TableRow 
                  key={player.id}
                  sx={{ 
                    bgcolor: player.userId === user?.id ? 'rgba(95, 75, 139, 0.1)' : 'inherit',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {index < 3 ? (
                        <Avatar 
                          sx={{ 
                            width: 30, 
                            height: 30, 
                            bgcolor: ['#FFD700', '#C0C0C0', '#CD7F32'][index],
                            fontSize: '0.875rem'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      ) : (
                        <Typography>{index + 1}</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Person sx={{ mr: 1, color: '#5F4B8B' }} />
                      <Typography>{player.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{player.role || 'Player'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="bold">
                      {player.score}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="center" gap={2}>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(isTeacher ? '/content/dashboard' : '/homepage')}
          sx={{
            bgcolor: '#5F4B8B',
            px: 4,
            py: 1.5,
            '&:hover': { bgcolor: '#4a3a6d' },
          }}
        >
          {isTeacher ? 'Back to Content' : 'Back to Homepage'}
        </Button>
      </Box>
      {/* Navigation Buttons */}
<Box display="flex" justifyContent="center" gap={2}>
  <Button
    variant="contained"
    startIcon={<ArrowBack />}
    onClick={() => navigate(isTeacher ? '/content/dashboard' : '/homepage')}
    sx={{
      bgcolor: '#5F4B8B',
      px: 4,
      py: 1.5,
      '&:hover': { bgcolor: '#4a3a6d' },
    }}
  >
    {isTeacher ? 'Back to Content' : 'Back to Homepage'}
  </Button>

  {/* View Session Progress Button */}

    <Button
      variant="outlined"
      color="secondary"
      onClick={() => navigate(`/results/${gameState.sessionId}`)}
      sx={{
        px: 4,
        py: 1.5,
        borderColor: '#5F4B8B',
        color: '#5F4B8B',
        '&:hover': {
          bgcolor: '#f3f0fa',
          borderColor: '#4a3a6d',
        },
      }}
    >
      View Session Progress
    </Button>

</Box>

    </Container>
    
  );
};

export default GameResults;