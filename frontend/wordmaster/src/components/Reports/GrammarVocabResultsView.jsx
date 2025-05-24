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
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={6}>
        {/* Grammar Section */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{
            p: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px',
            border: '2px solid rgba(95, 75, 139, 0.2)'
          }}>
            <Typography sx={{...pixelHeading, mb: 3}}>Grammar Performance</Typography>
            
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={grammarAccuracyPercent} 
                  size={150}
                  thickness={5}
                  sx={{ color: '#5F4B8B' }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <Typography sx={{ ...pixelHeading, fontSize: '28px' }}>
                    {grammarAccuracyPercent}%
                  </Typography>
                  <Typography sx={{ ...pixelText, fontSize: '10px' }}>
                    Accuracy
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Paper elevation={0} sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '8px'
                }}>
                  <Typography sx={{...pixelText, color: 'success.main', mb: 1}}>PERFECT</Typography>
                  <Typography sx={{...pixelHeading, color: 'success.main'}}>{perfectCount}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper elevation={0} sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '8px'
                }}>
                  <Typography sx={{...pixelText, color: 'warning.main', mb: 1}}>MINOR</Typography>
                  <Typography sx={{...pixelHeading, color: 'warning.main'}}>{minorErrorsCount}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper elevation={0} sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px'
                }}>
                  <Typography sx={{...pixelText, color: 'error.main', mb: 1}}>MAJOR</Typography>
                  <Typography sx={{...pixelHeading, color: 'error.main'}}>{majorErrorsCount}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ textAlign: 'center' }}>
              <Chip 
                icon={<Spellcheck />}
                label={`Grammar Streak: ${grammarData?.grammarStreak || 0}`}
                sx={{ ...pixelText, bgcolor: '#5F4B8B', color: 'white' }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Vocabulary Section */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px',
            border: '2px solid rgba(95, 75, 139, 0.2)',
            height: '90%'
          }}>
            <Typography sx={{...pixelHeading, mb: 3}}>Vocabulary Usage</Typography>

            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Chip 
                icon={<MenuBook />}
                label={`Vocabulary Score: ${vocabScore}`}
                sx={{ 
                  ...pixelText,
                  bgcolor: '#5F4B8B',
                  color: 'white',
                  py: 3,
                  '& .MuiChip-label': { px: 3, fontSize: '16px' }
                }}
              />
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(95, 75, 139, 0.05)',
                  border: '1px solid rgba(95, 75, 139, 0.2)',
                  borderRadius: '8px'
                }}>
                  <Typography sx={{...pixelText, color: '#5F4B8B', mb: 1}}>
                    WORD BANK USAGE
                  </Typography>
                  <Typography sx={{...pixelHeading, color: '#5F4B8B'}}>
                    {vocabUsageCount}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(95, 75, 139, 0.05)',
                  border: '1px solid rgba(95, 75, 139, 0.2)',
                  borderRadius: '8px'
                }}>
                  <Typography sx={{...pixelText, color: '#5F4B8B', mb: 1}}>
                    ADVANCED WORDS
                  </Typography>
                  <Typography sx={{...pixelHeading, color: '#5F4B8B'}}>
                    {vocabAdvancedCount}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {vocabularyData?.usedWords && vocabularyData.usedWords.length > 0 && (
              <Box>
                <Typography sx={{...pixelText, mb: 2}}>Words Used:</Typography>
                <Paper elevation={0} sx={{
                  p: 2,
                  bgcolor: 'rgba(95, 75, 139, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(95, 75, 139, 0.2)'
                }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {vocabularyData.usedWords.map((word, idx) => (
                      <Chip 
                        key={idx}
                        label={word}
                        size="small"
                        color={vocabularyData.usedAdvancedWords?.includes(word) ? "primary" : "default"}
                        sx={{ 
                          '& .MuiChip-label': { ...pixelText, fontSize: '8px' }
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GrammarVocabResultsView;