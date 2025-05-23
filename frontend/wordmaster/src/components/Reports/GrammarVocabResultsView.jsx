import React from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress,
  Card, CardContent, Divider, Chip, List, ListItem
} from '@mui/material';
import { CheckCircle, Cancel, Spellcheck, MenuBook } from '@mui/icons-material';

const GrammarVocabResultsView = ({ grammarData, vocabularyData, pixelText, pixelHeading }) => {
  if (!grammarData && !vocabularyData) {
    return (
      <Box textAlign="center" py={3}>
        <Typography sx={pixelText}>No grammar or vocabulary data available</Typography>
      </Box>
    );
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
  const vocabScore = vocabularyData?.score || 0;
  
  return (
    <Box>
      <Grid container spacing={4}>
        {/* Grammar Section */}
        <Grid item xs={12} md={6}>
          <Typography sx={{...pixelHeading, mb: 2}}>Grammar Performance</Typography>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <CircularProgress 
                variant="determinate" 
                value={grammarAccuracyPercent} 
                size={120}
                thickness={5}
                sx={{ color: '#5F4B8B' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ ...pixelHeading, fontSize: '24px' }}>
                  {grammarAccuracyPercent}%
                </Typography>
              </Box>
            </Box>
            <Typography sx={pixelText}>
              Grammar Accuracy
            </Typography>
          </Box>
          
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={4}>
              <Paper elevation={0} sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '4px',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}>
                <Typography sx={{...pixelText, fontSize: '8px', color: 'success.main'}}>
                  PERFECT
                </Typography>
                <Typography sx={{...pixelHeading, fontSize: '18px', color: 'success.main'}}>
                  {perfectCount}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4}>
              <Paper elevation={0} sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(255, 152, 0, 0.1)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 152, 0, 0.3)'
              }}>
                <Typography sx={{...pixelText, fontSize: '8px', color: 'warning.main'}}>
                  MINOR
                </Typography>
                <Typography sx={{...pixelHeading, fontSize: '18px', color: 'warning.main'}}>
                  {minorErrorsCount}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={4}>
              <Paper elevation={0} sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                borderRadius: '4px',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}>
                <Typography sx={{...pixelText, fontSize: '8px', color: 'error.main'}}>
                  MAJOR
                </Typography>
                <Typography sx={{...pixelHeading, fontSize: '18px', color: 'error.main'}}>
                  {majorErrorsCount}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Typography sx={{...pixelText, fontSize: '9px', mt: 2}}>
            Grammar streak: {grammarData?.grammarStreak || 0}
          </Typography>
        </Grid>
        
        {/* Vocabulary Section */}
        <Grid item xs={12} md={6}>
          <Typography sx={{...pixelHeading, mb: 2}}>Vocabulary Usage</Typography>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Chip 
                icon={<MenuBook />}
                label={`Score: ${vocabScore}`}
                sx={{ 
                  ...pixelText,
                  bgcolor: '#5F4B8B',
                  color: 'white',
                  py: 2,
                  '& .MuiChip-label': { px: 2 }
                }}
              />
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(95, 75, 139, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(95, 75, 139, 0.1)'
              }}>
                <Typography sx={{...pixelText, fontSize: '8px', color: '#5F4B8B'}}>
                  WORD BANK WORDS
                </Typography>
                <Typography sx={{...pixelHeading, fontSize: '18px', color: '#5F4B8B'}}>
                  {vocabUsageCount}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper elevation={0} sx={{
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(95, 75, 139, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(95, 75, 139, 0.1)'
              }}>
                <Typography sx={{...pixelText, fontSize: '8px', color: '#5F4B8B'}}>
                  ADVANCED WORDS
                </Typography>
                <Typography sx={{...pixelHeading, fontSize: '18px', color: '#5F4B8B'}}>
                  {vocabAdvancedCount}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Used Words List */}
          {vocabularyData?.usedWords && vocabularyData.usedWords.length > 0 && (
            <Box mt={3}>
              <Typography sx={{...pixelText, fontSize: '9px', mb: 1}}>
                Words Used from Word Bank:
              </Typography>
              <Paper elevation={0} sx={{
                p: 2,
                bgcolor: 'rgba(95, 75, 139, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(95, 75, 139, 0.1)'
              }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {vocabularyData.usedWords.map((word, idx) => (
                    <Chip 
                      key={idx}
                      label={word}
                      size="small"
                      color={vocabularyData.usedAdvancedWords?.includes(word) ? "primary" : "default"}
                      sx={{ 
                        '& .MuiChip-label': { ...pixelText, fontSize: '6px' }
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default GrammarVocabResultsView;