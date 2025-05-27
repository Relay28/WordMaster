import React from 'react';
import { 
  Box, Typography, Paper, List, ListItem, Chip, Tooltip, 
  Avatar, Divider 
} from '@mui/material';
import { 
  ChatBubbleOutline, CheckCircle, Error, Schedule, 
  Spellcheck, Psychology 
} from '@mui/icons-material';

const ChatMessagesView = ({ chatMessages, pixelText, pixelHeading }) => {
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
            
            {/* Feedback sections */}
            {message.grammarFeedback && message.grammarFeedback !== 'Processing...' && (
              <Box sx={{ width: '100%', mb: 1 }}>
                <Typography sx={{ ...pixelText, fontSize: '7px', color: '#666', mb: 0.5 }}>
                  <Spellcheck sx={{ fontSize: '10px', mr: 0.5 }} />
                  Grammar Feedback:
                </Typography>
                <Tooltip title={message.grammarFeedback} arrow>
                  <Paper sx={{ 
                    p: 1, 
                    bgcolor: 'rgba(95, 75, 139, 0.1)',
                    borderRadius: '4px',
                    maxHeight: '60px',
                    overflow: 'auto'
                  }}>
                    <Typography sx={{ 
                      ...pixelText, 
                      fontSize: '7px', 
                      color: getStatusColor(message.grammarStatus),
                    }}>
                      {message.grammarFeedback.length > 200 
                        ? message.grammarFeedback.substring(0, 200) + '...'
                        : message.grammarFeedback
                      }
                    </Typography>
                  </Paper>
                </Tooltip>
              </Box>
            )}
            
            {message.vocabularyFeedback && (
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ ...pixelText, fontSize: '7px', color: '#666', mb: 0.5 }}>
                  <Psychology sx={{ fontSize: '10px', mr: 0.5 }} />
                  Vocabulary Feedback:
                </Typography>
                <Tooltip title={message.vocabularyFeedback} arrow>
                  <Paper sx={{ 
                    p: 1, 
                    bgcolor: 'rgba(30, 136, 229, 0.1)',
                    borderRadius: '4px',
                    maxHeight: '60px',
                    overflow: 'auto'
                  }}>
                    <Typography sx={{ 
                      ...pixelText, 
                      fontSize: '7px', 
                      color: '#1976d2',
                    }}>
                      {message.vocabularyFeedback.length > 200 
                        ? message.vocabularyFeedback.substring(0, 200) + '...'
                        : message.vocabularyFeedback
                      }
                    </Typography>
                  </Paper>
                </Tooltip>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ChatMessagesView;