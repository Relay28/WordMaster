// PageHeader.jsx
import React from 'react';
import { Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';

const PageHeader = ({ title, loading, handleCancel, handleSubmit }) => {
  return (
    <Box sx={{ 
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: 2,
      px: { xs: 2, md: 6 },
      position: 'sticky',
      top: 0,
      zIndex: 1100
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" color="#5F4B8B">
            {title}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            backgroundColor: '#5F4B8B',
            '&:hover': { backgroundColor: '#4a3a6d' },
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
        </Button>
      </Box>
    </Box>
  );
};

export default PageHeader;