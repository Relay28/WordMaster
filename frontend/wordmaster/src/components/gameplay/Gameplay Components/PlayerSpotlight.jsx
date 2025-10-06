import React from 'react';
import { Box, Avatar, Chip, Typography, Tooltip } from '@mui/material';
import defaultProfile from '../../../assets/defaultprofile.png';

const PlayerSpotlight = ({ currentPlayer, isMyTurn, pixelHeading }) => {
  return (
    <>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '97.5%',
        p: 2,
        backgroundColor: 'rgba(95, 75, 139, 0.85)',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        textAlign: 'center',
        backdropFilter: 'blur(-4px)'
      }}>
        <Typography sx={{
          ...pixelHeading,
          color: 'white',
          textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
          fontSize: '13px'
        }}>
          {isMyTurn ? 'YOUR TURN' : `${currentPlayer?.name || 'Player'}'s TURN`}
        </Typography>
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 4,
        mt: 2,
        p: 3,
        borderRadius: '50%',
        width: 230,
        height: 230,
        background: 'radial-gradient(circle, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.3) 100%)',
        boxShadow: isMyTurn ? '0 0 25px 10px rgba(95, 75, 139, 0.6)' : 'none',
        border: isMyTurn ? '4px solid #FFD700' : '4px solid #5F4B8B',
        animation: isMyTurn ? 'pulse 2s infinite' : 'none'
      }}>
        <Avatar
          src={currentPlayer?.profilePicture || defaultProfile}
          sx={{
            width: 120,
            height: 120,
            bgcolor: '#5F4B8B',
            border: '4px solid white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            mb: 2
          }}
        >
          {currentPlayer?.name?.charAt(0) || '?'}
        </Avatar>
        <Typography sx={{
          ...pixelHeading,
          color: '#5F4B8B',
          fontSize: '14px',
          textAlign: 'center',
          mb: 0.5
        }}>
          {currentPlayer?.name || 'Unknown Player'}
        </Typography>
        {currentPlayer?.role && (
          <Tooltip title={currentPlayer.role} arrow componentsProps={{ tooltip: { sx: { fontSize: '0.9rem', letterSpacing: '0.5px', p: 2 } } }}>
            <Chip label={currentPlayer.role} size="small" sx={{ bgcolor: 'rgba(95, 75, 139, 0.2)', border: '1px solid #5F4B8B', fontFamily: '"Press Start 2P", cursive', fontSize: '10px' }} />
          </Tooltip>
        )}
      </Box>
      <style jsx="true">{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }
      `}</style>
    </>
  );
};

export default PlayerSpotlight;
