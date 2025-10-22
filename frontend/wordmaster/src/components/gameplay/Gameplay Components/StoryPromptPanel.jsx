import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import { sanitizePlainText } from '../../../utils/sanitize';

const StoryPromptPanel = ({ storyPrompt, gameState, isSinglePlayer, pixelHeading }) => {
  return (
    <Paper sx={{ p: 3, width: '96.5%', borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.9)', border: '4px solid #5F4B8B', boxShadow: '8px 8px 0px rgba(0,0,0,0.2)', height: '130px', minHeight: '130px', overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.05)' }, '&::-webkit-scrollbar-thumb': { background: '#5F4B8B', borderRadius: '3px' } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, mb: 2 }}>
        <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>Story Prompt</Typography>
        <Chip label={`${isSinglePlayer ? `Turn ${gameState.currentTurn}` : `Cycle ${gameState.currentCycle}`}`} color="warning" size="small" />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: 'rgba(95, 75, 139, 0.1)', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#5F4B8B', borderRadius: '4px', '&:hover': { background: '#4a3a6d' } } }}>
        <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '1.25rem', lineHeight: '1.6' }}>{sanitizePlainText(storyPrompt)}</Typography>
      </Box>
    </Paper>
  );
};

export default StoryPromptPanel;
