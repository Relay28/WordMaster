import React from 'react';
import { Box, Typography } from '@mui/material';
import picbg from '../../assets/picbg.png';
import loadingSpinnerGif from '../../assets/LOADINGSPINNER.gif';
import '@fontsource/press-start-2p';

/**
 * LoadingSpinner Component
 * Displays a full-screen loading spinner with animated GIF and "LOADING..." text
 * Used for suspense fallback and loading states throughout the application
 */
const LoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: `
        linear-gradient(to bottom, 
          rgba(249, 249, 249, 0.95) 0%, 
          rgba(249, 249, 249, 0.95) 40%, 
          rgba(249, 249, 249, 0.8) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'pixelated',
      zIndex: 9999, // Ensure the spinner appears above other content
    }}
  >
    <img 
      src={loadingSpinnerGif} 
      alt="Loading..." 
      style={{ 
        width: '200px',
        height: '200px',
        marginBottom: '16px',
        filter: 'drop-shadow(0 4px 8px rgba(95, 75, 139, 0.3))'
      }} 
    />
    <Typography
      sx={{
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#5F4B8B',
        textShadow: '2px 2px 4px rgba(95, 75, 139, 0.2)',
        letterSpacing: '2px',
      }}
    >
      LOADING...
    </Typography>
  </Box>
);

export default LoadingSpinner;