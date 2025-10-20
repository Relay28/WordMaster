import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import ChartFeedbackBubble from './Gameplay Components/ChartFeedbackBubble';

/**
 * Demo page to showcase the simplified Chart-Style Feedback Card
 */
const ChartFeedbackDemo = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 700 }}>
        Simplified Chart Feedback Card
      </Typography>

      {/* Perfect Grammar Example */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f9fafb' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#22c55e' }}>
          ✅ Perfect Grammar (Role Appropriate)
        </Typography>
        <ChartFeedbackBubble
          message="see eat buy hotel train map beautiful"
          grammarStatus="PERFECT"
          grammarFeedback="✓ Excellent! Your grammar is spot-on."
          roleAppropriate={true}
          vocabularyFeedback="Great vocabulary choice!"
        />
      </Paper>

      {/* Minor Errors Example */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f9fafb' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#eab308' }}>
          ⚠️ Minor Errors (Role Appropriate)
        </Typography>
        <ChartFeedbackBubble
          message="see eat buy hotel train map beautiful"
          grammarStatus="MINOR_ERRORS"
          grammarFeedback="✓ Good work! Just one small improvement found."
          roleAppropriate={true}
          vocabularyFeedback="Good vocabulary!"
        />
      </Paper>

      {/* Major Errors Example */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f9fafb' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#ef4444' }}>
          ❌ Major Errors (Off-Topic)
        </Typography>
        <ChartFeedbackBubble
          message="see eat buy hotel train map beautiful"
          grammarStatus="MAJOR_ERRORS"
          grammarFeedback="💡 Let's improve this together! Several areas to work on."
          roleAppropriate={false}
        />
      </Paper>

      {/* Instructions */}
      <Paper sx={{ p: 3, bgcolor: '#e0e7ff', border: '2px solid #818cf8' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🎨 Simplified Features
        </Typography>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Clean card design (no speech bubble)</li>
          <li>Prominent chart grid with thick visible borders</li>
          <li>Color-coded status (Green = Perfect, Yellow = Minor, Red = Major)</li>
          <li>No dropdown - just the essential status info</li>
          <li>Shows Grammar Check and Role Status at a glance</li>
          <li>Responsive design for all screen sizes</li>
        </ul>
      </Paper>
    </Container>
  );
};

export default ChartFeedbackDemo;
