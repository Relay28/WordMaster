import React, { useState } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, Chip, Tooltip, 
  Avatar, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, IconButton
} from '@mui/material';
import { 
  ChatBubbleOutline, CheckCircle, Error, Schedule, 
  Spellcheck, Psychology, Close, Launch
} from '@mui/icons-material';

const ChatMessagesView = ({ chatMessages, pixelText, pixelHeading }) => {
  // Add state to track dialog visibility
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');

  // Function to open dialog with content
  const handleOpenDialog = (title, content) => {
    setDialogTitle(title);
    setDialogContent(content);
    setOpenDialog(true);
  };

  // Function to close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  if (!chatMessages || chatMessages.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography sx={pixelText}>No chat messages available</Typography>
      </Box>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PERFECT': return <CheckCircle sx={{ color: '#4caf50', fontSize: '14px' }} />;
      case 'MINOR_ERRORS': return <Error sx={{ color: '#ff9800', fontSize: '14px' }} />;
      case 'MAJOR_ERRORS': return <Error sx={{ color: '#f44336', fontSize: '14px' }} />;
      case 'PENDING': return <Schedule sx={{ color: '#9e9e9e', fontSize: '14px' }} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PERFECT': return '#4caf50';
      case 'MINOR_ERRORS': return '#ff9800';
      case 'MAJOR_ERRORS': return '#f44336';
      case 'PENDING': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  return (
    <>
      <Paper 
        sx={{ 
          p: 3, 
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255,255,255,0.3)',
          maxHeight: '600px',
          overflow: 'auto'
        }}
      >
        <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
          Chat Messages ({chatMessages.length})
        </Typography>
        
        <List sx={{ maxHeight: '500px', overflow: 'auto' }}>
          {chatMessages.map((message, index) => (
            <ListItem 
              key={message.id || index}
              sx={{ 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                mb: 2,
                p: 2,
                bgcolor: 'rgba(95, 75, 139, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(95, 75, 139, 0.1)'
              }}
            >
              {/* Message header */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                <ChatBubbleOutline sx={{ color: '#5F4B8B', fontSize: '16px', mr: 1 }} />
                <Typography sx={{ ...pixelText, fontSize: '8px', color: '#666' }}>
                  {new Date(message.timestamp).toLocaleString()}
                </Typography>
                {message.role && (
                  <Chip 
                    label={message.role}
                    size="small"
                    sx={{ 
                      ml: 1,
                      height: '20px',
                      '& .MuiChip-label': { ...pixelText, fontSize: '6px' }
                    }}
                  />
                )}
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon(message.grammarStatus)}
                  <Typography sx={{ 
                    ...pixelText, 
                    fontSize: '6px', 
                    ml: 0.5, 
                    color: getStatusColor(message.grammarStatus) 
                  }}>
                    {message.grammarStatus}
                  </Typography>
                </Box>
              </Box>
              
              {/* Message content */}
              <Typography sx={{ 
                ...pixelText, 
                fontSize: '10px', 
                mb: 1, 
                width: '100%',
                p: 1,
                bgcolor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '4px'
              }}>
                {message.content}
              </Typography>
              
              {/* Word bomb and role appropriate indicators */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {message.containsWordBomb && (
                  <Chip 
                    label="💣 WORD BOMB"
                    size="small"
                    sx={{ 
                      bgcolor: '#ff5722',
                      color: 'white',
                      '& .MuiChip-label': { ...pixelText, fontSize: '6px' }
                    }}
                  />
                )}
                {message.roleAppropriate && (
                  <Chip 
                    label="✓ ROLE APPROPRIATE"
                    size="small"
                    sx={{ 
                      bgcolor: '#4caf50',
                      color: 'white',
                      '& .MuiChip-label': { ...pixelText, fontSize: '6px' }
                    }}
                  />
                )}
              </Box>
              
              {/* Words used */}
              {message.wordUsed && (
                <Box sx={{ mb: 1, width: '100%' }}>
                  <Typography sx={{ ...pixelText, fontSize: '8px', color: '#666', mb: 0.5 }}>
                    Words Used:
                  </Typography>
                  <Typography sx={{ ...pixelText, fontSize: '8px', color: '#5F4B8B' }}>
                    {message.wordUsed}
                  </Typography>
                </Box>
              )}
              
              {/* Grammar Feedback - Updated to be clickable with Arial font */}
              {message.grammarFeedback && message.grammarFeedback !== 'Processing...' && (
                <Box sx={{ width: '100%', mb: 1 }}>
                  <Typography sx={{ ...pixelText, fontSize: '10px', color: '#666', mb: 0.5 }}>
                    <Spellcheck sx={{ fontSize: '10px', mr: 0.5 }} />
                    Grammar Feedback:
                  </Typography>
                  <Paper 
                    onClick={() => handleOpenDialog('Grammar Feedback', message.grammarFeedback)}
                    sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(95, 75, 139, 0.1)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(95, 75, 139, 0.2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography sx={{ 
                      fontFamily: 'Arial, sans-serif', 
                      fontSize: '12px', 
                      color: '#000000',
                      flex: 1
                    }}>
                      {message.grammarFeedback.length > 100 
                        ? message.grammarFeedback.substring(0, 100) + '...'
                        : message.grammarFeedback
                      }
                    </Typography>
                    <Launch sx={{ fontSize: '12px', color: '#666' }} />
                  </Paper>
                </Box>
              )}
              
              {/* Vocabulary Feedback - Updated to be clickable with Arial font */}
              {message.vocabularyFeedback && (
                <Box sx={{ width: '100%' }}>
                  <Typography sx={{ ...pixelText, fontSize: '10px', color: '#666', mb: 0.5 }}>
                    <Psychology sx={{ fontSize: '10px', mr: 0.5 }} />
                    Vocabulary Feedback:
                  </Typography>
                  <Paper 
                    onClick={() => handleOpenDialog('Vocabulary Feedback', message.vocabularyFeedback)}
                    sx={{ 
                      p: 1, 
                      bgcolor: 'rgba(30, 136, 229, 0.1)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(30, 136, 229, 0.2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography sx={{ 
                      fontFamily: 'Arial, sans-serif', 
                      fontSize: '12px', 
                      color: '#000000',
                      flex: 1
                    }}>
                      {message.vocabularyFeedback.length > 100 
                        ? message.vocabularyFeedback.substring(0, 100) + '...'
                        : message.vocabularyFeedback
                      }
                    </Typography>
                    <Launch sx={{ fontSize: '12px', color: '#666' }} />
                  </Paper>
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Dialog for displaying full feedback */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
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
          fontFamily: 'Arial, sans-serif'
        }}>
          {dialogTitle}
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '14px', 
            color: '#000000',
            whiteSpace: 'pre-wrap'
          }}>
            {dialogContent}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            variant="contained"
            sx={{
              ...pixelText,
              background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)',
              textTransform: 'none',
              fontSize: '10px',
              fontWeight: 150,
              height: '30px',
              '&:hover': { 
                background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
                boxShadow: '0 6px 8px rgba(95, 75, 139, 0.3)',
                transform: 'translateY(-2px)'
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(95, 75, 139, 0.3)'
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatMessagesView;