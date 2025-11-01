import React from 'react';
import ConfettiBurst from '../ConfettiBurst';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

const GameEndModal = ({ open, onClose, onProceed, proceeding }) => {
  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '1px',
  };
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px',
  };

  return (
    <>
  <ConfettiBurst open={open} durationMs={2000} />
    
    <Dialog
      open={!!open}
      onClose={onClose}
      fullWidth
      maxWidth="sm" // medium-small, not too big
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '4px solid #5F4B8B',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.95) 100%)',
          boxShadow: '0 0 24px rgba(95, 75, 139, 0.35)',
          px: 3,
          py: 2.5,
          textAlign: 'center',
          overflow: 'hidden', // ✅ no scrollbars
        },
      }}
      sx={{
        '& .MuiDialogContent-root': { overflowY: 'hidden' },
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <DialogTitle
        sx={{
          ...pixelHeading,
          color: '#5F4B8B',
          textAlign: 'center',
          fontSize: '17px',
          mb: 2,
          p: 0,
        }}
      >
        Game Finished
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box
          sx={{
            border: '3px solid #5F4B8B',
            borderRadius: '10px',
            p: 2.5,
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            boxShadow: 'inset 0 0 8px rgba(95, 75, 139, 0.25)',
          }}
        >
          <Typography
            sx={{
              ...pixelHeading,
              fontSize: '15px',
              color: '#5F4B8B',
              mb: 1.5,
            }}
          >
            🎉 Congratulations! 🎉
          </Typography>

          <Typography
            sx={{
              ...pixelText,
              color: '#333',
              fontSize: '11px',
              mb: 1.5,
            }}
          >
            You’ve completed the game!  
            Click below to proceed to the comprehension check and see your results.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', mt: 2.5, pb: 2 }}>
        <Button
          variant="contained"
          onClick={onProceed}
          disabled={proceeding}
          sx={{
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '12px',
            backgroundColor: '#5F4B8B',
            borderRadius: '8px',
            px: 4,
            py: 1.5,
            boxShadow: '3px 3px 0 rgba(0,0,0,0.25)',
            textTransform: 'none',
            transition: 'transform 0.1s ease',
            '&:hover': {
              backgroundColor: '#4a3a6d',
              transform: 'scale(1.04)',
            },
            '&:active': {
              transform: 'scale(0.96)',
            },
          }}
        >
          {proceeding ? 'Processing…' : 'Proceed to Comprehension Check'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default GameEndModal;
