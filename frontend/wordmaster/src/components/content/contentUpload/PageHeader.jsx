// PageHeader.jsx
import React from 'react';
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';

const PageHeader = ({ title, loading, handleCancel, handleSubmit }) => {
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  return (
    <Box sx={{ 
      backgroundColor: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: 2,
      px: { xs: 2, md: 6 },
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      borderBottom: '1px solid rgba(255,255,255,0.3)'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <IconButton 
            onClick={handleCancel} 
            sx={{ 
              mr: 1,
              backgroundColor: 'rgba(95, 75, 139, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(95, 75, 139, 0.2)'
              }
            }}
          >
            <ArrowBack sx={{ color: '#5F4B8B' }} />
          </IconButton>
          <Typography variant="h5" sx={{ ...pixelHeading, color: '#5F4B8B' }}>
            {title}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Save sx={{ 
            fontSize: '14px',
            filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
          }} />}
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            ...pixelButton,
            background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)',
            fontSize: '12px',
            fontWeight: 150,
            height: '36px',
            px: 3,
            '&:hover': { 
              background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
              boxShadow: '0 6px 8px rgba(95, 75, 139, 0.3)',
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 2px 4px rgba(95, 75, 139, 0.3)'
            },
            '&.Mui-disabled': {
              background: '#e0e0e0',
              color: '#a0a0a0'
            },
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'rotate(45deg)',
              transition: 'all 0.5s ease'
            },
            '&:hover::after': {
              left: '100%'
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};

export default PageHeader;