import React from 'react';
import { Tooltip, Box, Typography, Paper, Grid, CircularProgress, List, ListItem, Chip } from '@mui/material';
import { CheckCircle, Cancel, Spellcheck, MenuBook } from '@mui/icons-material';

const GrammarVocabResultsView = ({ grammarData, vocabularyData, pixelText, pixelHeading }) => {
  if (!grammarData && !vocabularyData) {
    return <Typography sx={pixelText}>No data available</Typography>;
  }
  
  // Grammar metrics
  const grammarBreakdown = grammarData?.grammarBreakdown || {};
  const perfectCount = grammarBreakdown.PERFECT || 0;
  const minorErrorsCount = grammarBreakdown.MINOR_ERRORS || 0;
  const majorErrorsCount = grammarBreakdown.MAJOR_ERRORS || 0;
  const totalMessages = perfectCount + minorErrorsCount + majorErrorsCount;
  const grammarAccuracyPercent = totalMessages > 0 ? Math.round((perfectCount / totalMessages) * 100) : 0;
  
  // Vocabulary metrics
  const vocabUsageCount = vocabularyData?.usedWords?.length || 0;
  const vocabAdvancedCount = vocabularyData?.usedAdvancedWords?.length || 0;
  const vocabScore = vocabularyData?.score || 
  (vocabularyData?.usedWords?.length * 5) + (vocabularyData?.usedAdvancedWords?.length * 5) || 0;
  
  // Function to determine why a word is considered advanced
  const getAdvancedWordReason = (word) => {
    const reasons = [];
    
    if (word.length > 7) {
      reasons.push(`Length: ${word.length} characters (words over 7 characters are considered advanced)`);
    }
    
    // You can add more conditions here as your heuristics evolve
    // For example: if you add complexity or rarity metrics in the future
    
    return reasons.length > 0 ? reasons.join(', ') : 'Identified as an advanced vocabulary word';
  };

  return (
    <Grid container spacing={3}>
      {/* Grammar Section */}
      {grammarData && (
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>Grammar Performance</Typography>
            
            {/* Grammar metrics display */}
            <Box display="flex" justifyContent="space-around" mb={2}>
              <Box textAlign="center">
                <CircularProgress 
                  variant="determinate" 
                  value={grammarAccuracyPercent} 
                  size={80}
                  thickness={5}
                  sx={{ color: '#5F4B8B' }}
                />
                <Typography sx={{ ...pixelText, mt: 1 }}>Accuracy: {grammarAccuracyPercent}%</Typography>
              </Box>
            </Box>
            
            <Box>
              <Typography sx={{ ...pixelText, mt: 2 }}>
                Perfect: {perfectCount} | Minor Errors: {minorErrorsCount} | Major Errors: {majorErrorsCount}
              </Typography>
              <Typography sx={{ ...pixelText, mt: 1 }}>
                Longest Grammar Streak: {grammarData?.grammarStreak || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      )}
      
      {/* Vocabulary Section */}
      {vocabularyData && (
        <Grid item xs={12} md={6}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              height: '80%',
              width: '120%',
            }}
          >
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>Vocabulary Usage</Typography>
            
            <Box display="flex" justifyContent="space-around" alignItems="center" mb={3}>
              <Box textAlign="center">
                <Typography sx={{ ...pixelHeading, fontSize: '24px', color: '#5F4B8B' }}>
                  {vocabScore}
                </Typography>
                <Typography sx={{ ...pixelText }}>Score</Typography>
              </Box>
              <Box textAlign="center">
                <Typography sx={{ ...pixelHeading, fontSize: '24px', color: '#5F4B8B' }}>
                  {vocabUsageCount}
                </Typography>
                <Typography sx={{ ...pixelText }}>Words Used</Typography>
              </Box>
              <Box textAlign="center">
                <Typography sx={{ ...pixelHeading, fontSize: '24px', color: '#5F4B8B' }}>
                  {vocabAdvancedCount}
                </Typography>
                <Typography sx={{ ...pixelText }}>Advanced Words</Typography>
              </Box>
            </Box>
            
            {/* Word List with enhanced tooltips for advanced words */}
            <Typography sx={{ ...pixelText, mb: 1 }}>Words used:</Typography>
            <Box sx={{ maxHeight: '200px', overflow: 'auto', p: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {vocabularyData?.usedWords?.map((word, index) => {
                  const isAdvanced = vocabularyData.usedAdvancedWords?.includes(word);
                  
                  return isAdvanced ? (
                    <Tooltip 
                      key={index}
                      title={getAdvancedWordReason(word)}
                      arrow
                      placement="top"
                    >
                      <Chip
                        label={word}
                        size="small"
                        sx={{
                          ...pixelText,
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                          fontWeight: 'bold',
                          border: '1px solid #1565c0'
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      key={index}
                      label={word}
                      size="small"
                      sx={{
                        ...pixelText,
                        bgcolor: 'rgba(95, 75, 139, 0.1)',
                        color: '#5F4B8B'
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default GrammarVocabResultsView;