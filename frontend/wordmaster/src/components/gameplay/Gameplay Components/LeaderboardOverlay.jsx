import React from 'react';
import { Box, IconButton, Typography, List, ListItem, Avatar } from '@mui/material';
import defaultProfile from '../../../assets/defaultprofile.png';

const LeaderboardOverlay = ({ leaderboard = [], cycleDisplayString = '' }) => {
  return (
    <Box sx={{ position: 'absolute', top: 24, left: 0, width: '100%', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pointerEvents: 'none' }}>
      {/* Left: Trophy + Leaderboard */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', pointerEvents: 'auto', top: 55, '&:hover .leaderboard-popup': { opacity: 1, visibility: 'visible' } }}>
        <IconButton sx={{ color: '#FFD700', backgroundColor: 'rgba(0,0,0,0.3)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' } }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 5H5V19H19V5Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 9V15" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 12H9" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 19V15" stroke="currentColor" strokeWidth="2"/>
            <path d="M17 19V15" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </IconButton>
        <Box className="leaderboard-popup" sx={{ position: 'absolute', top: 40, left: 0, width: 280, maxHeight: '70vh', borderRadius: '8px', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(54, 57, 63, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)', overflow: 'hidden', opacity: 0, visibility: 'hidden', transition: 'all 0.2s ease', mt: 1, zIndex: 200 }}>
          <Box sx={{ backgroundColor: 'rgba(47, 49, 54, 0.7)', p: 1.5, display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '14px', flexGrow: 1 }}>LEADERBOARD</Typography>
            <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#43b581', mr: 1 }}/>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{leaderboard.length} players</Typography>
          </Box>
          <List dense sx={{ p: 0 }}>
            {leaderboard.sort((a, b) => b.score - a.score).map((player, index) => (
              <ListItem key={player.id} sx={{ px: 2, py: 1, backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', '&:hover': { backgroundColor: 'rgba(79, 84, 92, 0.3)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ minWidth: '24px', color: index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', textAlign: 'center', mr: 1.5 }}>#{index + 1}</Typography>
                  <Avatar 
                    src={player.profilePicture || defaultProfile}
                    sx={{ width: 32, height: 32, mr: 1.5, backgroundColor: 'rgba(114, 137, 218, 0.7)' }}
                  >
                    {player.name?.charAt(0) || '?'}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name || 'Player'}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{player.role || ' '}</Typography>
                  </Box>
                  <Box sx={{ backgroundColor: 'rgba(114, 137, 218, 0.2)', borderRadius: '4px', px: 1.5, py: 0.5, color: 'white', fontWeight: 600, fontSize: '12px' }}>{player.score}</Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
      {/* Right: Cycle/Turn Indicator */}
      <Box sx={{ borderRadius: '20px', bgcolor: 'rgba(0,0,0,0.7)', px: 2, py: 1, display: 'flex', alignItems: 'center', minWidth: '60px', pointerEvents: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', left: -50, top: 55, position: 'relative' }}>
        <Typography sx={{ color: 'white', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{cycleDisplayString}</Typography>
      </Box>
    </Box>
  );
};

export default LeaderboardOverlay;
