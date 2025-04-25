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
import { Close, Publish } from '@mui/icons-material';

const PublishConfirmation = ({ 
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
          padding: 1
        } 
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0edf5',
        py: 2
      }}>
        <Typography variant="h6" fontWeight="bold">
          Publish Content
        </Typography>
        {!loading && (
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to publish "{title}"?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Once published, this content will be available to students in your classes.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button 
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderColor: '#9e9e9e',
            color: '#616161',
            '&:hover': { borderColor: '#757575', backgroundColor: '#f5f5f5' },
            textTransform: 'none',
            borderRadius: '8px'
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Publish />}
          sx={{
            backgroundColor: '#4caf50',
            '&:hover': { backgroundColor: '#388e3c' },
            textTransform: 'none',
            borderRadius: '8px'
          }}
        >
          {loading ? 'Publishing...' : 'Publish Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishConfirmation;
