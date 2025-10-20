import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Two Separate Card Feedback Component
 * Displays grammar and role status as individual mini cards
 */
const ChartFeedbackBubble = ({ 
  message, 
  grammarStatus, 
  grammarFeedback,
  roleAppropriate = true,
  vocabularyFeedback = null 
}) => {
  // Get grammar label
  const getGrammarLabel = (status) => {
    switch(status) {
      case 'PERFECT': return 'Good English';
      case 'MINOR_ERRORS': return 'Good English';
      case 'MAJOR_ERRORS': return 'Keep Practicing';
      default: return 'English';
    }
  };

  // Get grammar color
  const getGrammarColor = (status) => {
    switch(status) {
      case 'PERFECT': return '#22c55e'; // green
      case 'MINOR_ERRORS': return '#eab308'; // yellow/orange
      case 'MAJOR_ERRORS': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  // Get role label and color
  const getRoleLabel = () => roleAppropriate ? 'Role Appropriate' : 'Off-Topic';
  const getRoleColor = () => roleAppropriate ? '#22c55e' : '#ef4444';

  const grammarLabel = getGrammarLabel(grammarStatus);
  const grammarColor = getGrammarColor(grammarStatus);
  const roleLabel = getRoleLabel();
  const roleColor = getRoleColor();

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1.5, 
      mt: 1.5,
      justifyContent: 'flex-start',
      flexWrap: 'wrap'
    }}>
      {/* Grammar Status Card */}
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: '12px',
          px: 2.5,
          py: 1.5,
          minWidth: '120px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          border: `2px solid ${grammarColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 700,
            color: grammarColor,
            textAlign: 'center',
          }}
        >
          {grammarLabel}
        </Typography>
      </Box>

      {/* Role Status Card */}
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: '12px',
          px: 2.5,
          py: 1.5,
          minWidth: '120px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          border: `2px solid ${roleColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 700,
            color: roleColor,
            textAlign: 'center',
          }}
        >
          {roleLabel}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChartFeedbackBubble;
