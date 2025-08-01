import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Close, Unpublished } from '@mui/icons-material';

const UnpublishConfirmation = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  loading = false 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={loading ? null : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
        } 
      }}
    >
      <DialogTitle sx={{ 
        fontFamily: '"Press Start 2P", cursive',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        py: 2,
        px: 3,
        borderBottom: '1px solid #ffe0b2'
      }}>
        <Typography variant="h6" fontWeight="200" color="#e65100" sx={{ fontFamily: 'inherit', fontSize: '16px', marginTop: '4px' }}>
          Unpublish Content
        </Typography>
        {!loading && (
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: '#e65100',
              '&:hover': {
                backgroundColor: 'rgba(230, 81, 0, 0.1)'
              }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ py: 3, px: 3, marginTop: '12px' }}>
        <Typography variant="body1" gutterBottom sx={{ color: '#424242', mb: 2 }}>
          Are you sure you want to unpublish <strong>"{title}"</strong>?
        </Typography>
        <Typography variant="body2" sx={{ color: '#616161', fontSize: '0.875rem' }}>
          Unpublishing will make this content unavailable to students immediately.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button 
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderColor: '#bdbdbd',
            color: '#424242',
            px: 3,
            py: 1,
            '&:hover': { 
              borderColor: '#9e9e9e', 
              backgroundColor: '#f5f5f5' 
            },
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: '500'
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? 
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : 
            <Unpublished sx={{ fontSize: '18px' }} />
          }
          sx={{
            backgroundColor: '#ff9800',
            color: '#ffffff',
            px: 3,
            py: 1,
            '&:hover': { 
              backgroundColor: '#fb8c00',
              boxShadow: '0px 2px 4px rgba(255, 152, 0, 0.3)'
            },
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            '&.Mui-disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e'
            }
          }}
        >
          {loading ? 'Unpublishing...' : 'Unpublish Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnpublishConfirmation;