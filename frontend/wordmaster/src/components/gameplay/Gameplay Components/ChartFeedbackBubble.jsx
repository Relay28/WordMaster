import React from 'react';
import { Box, Typography } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

/**
 * Two Separate Card Feedback Component with Helpful Tips
 * Displays grammar and role status as individual mini cards with actionable feedback
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
      case 'PERFECT': return 'Excellent English';
      case 'MINOR_ERRORS': return 'Good English';
      case 'MAJOR_ERRORS': return 'Needs Improvement';
      default: return 'Processing...';
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

  // Get concise grammar tip from detailed feedback
  const getGrammarTip = () => {
    if (!grammarFeedback) return null;
    
    // Map detailed feedback to short, actionable tips for gameplay
    const lowerFeedback = grammarFeedback.toLowerCase();
    
    if (lowerFeedback.includes('perfect') || lowerFeedback.includes('excellent')) {
      return null; // Don't show tip for perfect grammar
    } else if (lowerFeedback.includes('minor') || lowerFeedback.includes('understandable')) {
      return 'Check punctuation and spelling';
    } else if (lowerFeedback.includes('major') || lowerFeedback.includes('needs improvement') || lowerFeedback.includes('complete sentence')) {
      return 'Form a complete sentence with subject and verb';
    }
    
    // Fallback: try to extract meaningful short phrase
    return 'Review grammar and sentence structure';
  };

  // Get role tip based on appropriateness
  const getRoleTip = () => {
    if (roleAppropriate) {
      return null; // Don't show tip when appropriate
    }
    return "Match your message to your assigned role";
  };

  const grammarLabel = getGrammarLabel(grammarStatus);
  const grammarColor = getGrammarColor(grammarStatus);
  const roleLabel = getRoleLabel();
  const roleColor = getRoleColor();
  const grammarTip = getGrammarTip();
  const roleTip = getRoleTip();

  // Only show tips for non-perfect status
  const showGrammarTip = grammarStatus !== 'PERFECT' && grammarTip;
  const showRoleTip = !roleAppropriate && roleTip;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1.5, 
      mt: 1.5,
    }}>
      {/* Status Cards Row */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5,
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

      {/* Helpful Tips Section - Only show when there are issues */}
      {(showGrammarTip || showRoleTip) && (
        <Box sx={{
          bgcolor: '#fef9e7',
          borderRadius: '8px',
          borderLeft: '3px solid #f59e0b',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}>
          {showGrammarTip && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <InfoOutlined sx={{ fontSize: 16, color: '#f59e0b', mt: 0.2, flexShrink: 0 }} />
              <Typography sx={{ 
                fontSize: '11.5px', 
                color: '#78350f',
                lineHeight: 1.5,
                flex: 1,
                fontWeight: 500
              }}>
                {grammarTip}
              </Typography>
            </Box>
          )}
          
          {showRoleTip && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <InfoOutlined sx={{ fontSize: 16, color: '#ef4444', mt: 0.2, flexShrink: 0 }} />
              <Typography sx={{ 
                fontSize: '11.5px', 
                color: '#7f1d1d',
                lineHeight: 1.5,
                flex: 1,
                fontWeight: 500
              }}>
                {roleTip}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChartFeedbackBubble;
