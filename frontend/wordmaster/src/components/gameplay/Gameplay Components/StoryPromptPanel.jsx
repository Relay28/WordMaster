import React, { useState } from 'react';
import { Paper, Box, Typography, IconButton, Collapse } from '@mui/material';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { sanitizePlainText } from '../../../utils/sanitize';

const StoryPromptPanel = ({ storyPrompt, gameState, isSinglePlayer, pixelHeading }) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ 
      width: '100%', 
      position: 'relative',
      zIndex: 10,
      mb: 2,
    }}>
      {/* Header bar with title */}
      <Paper
        elevation={0}
        sx={{
          width: '98.5%', 
          borderRadius: '0 0 12px 12px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,243,250,0.95))',
          border: '2px solid rgba(95,75,139,0.12)',
          p: 1,
          boxShadow: open ? '0 10px 30px rgba(95,75,139,0.12)' : '0 4px 10px rgba(31,41,55,0.06)',
          backdropFilter: 'blur(4px)',
          cursor: 'pointer',
        }}
        onClick={() => setOpen((s) => !s)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', height: 48, px: 2 }}>
          <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>Story Prompt</Typography>
        </Box>
      </Paper>

      {/* Centered arrow control */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        mt: -2.2,
        position: 'relative',
        zIndex: 20,
      }}>
        <IconButton
          aria-label={open ? 'Collapse story prompt' : 'Expand story prompt'}
          onClick={(e) => { e.stopPropagation(); setOpen((s) => !s); }}
          sx={{
            width: 52,
            height: 36,
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '2px solid rgba(95,75,139,0.95)',
            boxShadow: open ? '0 6px 18px rgba(95,75,139,0.12)' : '0 3px 10px rgba(95,75,139,0.06)',
            '&:hover': {
              bgcolor: '#e7dde7ff',
            },
            '& .MuiSvgIcon-root': {
              fontSize: 20,
              color: 'rgba(95,75,139,1)'
            },
          }}
          size="small"
        >
          {open ? <KeyboardDoubleArrowUpIcon /> : <KeyboardDoubleArrowDownIcon />}
        </IconButton>
      </Box>

      {/* Expandable content - pushes content down, no overlay */}
      <Collapse in={open} timeout={300}>
        <Paper
          sx={{
            width: '98.5%', 
            mt: -1,
            p: 2,
            borderRadius: '0 0 12px 12px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,243,250,0.96))',
            boxShadow: '0 14px 40px rgba(31, 41, 55, 0.15)',
            border: '2px solid rgba(95,75,139,0.12)',
            borderTop: 'none',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Box sx={{ maxHeight: { xs: 150, sm: 200 }, overflowY: 'auto' }}>
            <Typography sx={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: { xs: '0.95rem', sm: '1.15rem' }, 
              lineHeight: 1.6,
              color: '#333',
            }}>
              {sanitizePlainText(storyPrompt)}
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default StoryPromptPanel;