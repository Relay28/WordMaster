import React from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress,
  Card, CardContent, Divider, Chip, List, ListItem
} from '@mui/material';
import { CheckCircle, Cancel, QuestionMark } from '@mui/icons-material';

const ComprehensionResultsView = ({ comprehensionData, pixelText, pixelHeading }) => {
  if (!comprehensionData) {
    return (
      <Box textAlign="center" py={3}>
        <Typography sx={pixelText}>No comprehension data available</Typography>
      </Box>
    );
  }
  
  const { comprehensionQuestions, comprehensionAnswers, comprehensionPercentage = 0 } = comprehensionData;
  
  // If we have questions but no answers, student hasn't taken the quiz yet
  if ((!comprehensionAnswers || comprehensionAnswers.length === 0) && 
      (comprehensionQuestions && comprehensionQuestions.length > 0)) {
    return (
      <Box textAlign="center" py={3}>
        <Typography sx={pixelText} color="text.secondary">
          Student has not completed the comprehension check yet
        </Typography>
      </Box>
    );
  }
  
  // If we don't have questions, we can't display anything meaningful
  if (!comprehensionQuestions || comprehensionQuestions.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography sx={pixelText} color="text.secondary">
          No comprehension questions were generated for this session
        </Typography>
      </Box>
    );
  }
  
  // Calculate the score
  const correctAnswers = comprehensionAnswers ? 
    comprehensionAnswers.filter(a => a.isCorrect).length : 0;
  const totalQuestions = comprehensionQuestions.length;
  const percentCorrect = Math.round(comprehensionPercentage || (correctAnswers / totalQuestions * 100));
  
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography sx={pixelHeading} gutterBottom>Comprehension Check Results</Typography>
        
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
          <CircularProgress 
            variant="determinate" 
            value={percentCorrect} 
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
              {percentCorrect}%
            </Typography>
          </Box>
        </Box>
        
        <Typography sx={pixelText}>
          {correctAnswers} correct out of {totalQuestions} questions
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <List>
        {comprehensionQuestions.map((question, index) => {
          const answer = comprehensionAnswers?.find(a => a.questionId === question.id);
          const isCorrect = answer?.isCorrect || false;
          
          return (
            <Card key={index} sx={{ 
              mb: 2, 
              border: isCorrect ? '1px solid #4caf50' : '1px solid #f44336',
              borderRadius: '6px'
            }}>
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={10}>
                    <Typography sx={{ ...pixelText, mb: 1 }}>
                      {index + 1}. {question.question}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'right' }}>
                    {isCorrect ? (
                      <CheckCircle color="success" />
                    ) : answer ? (
                      <Cancel color="error" />
                    ) : (
                      <QuestionMark color="disabled" />
                    )}
                  </Grid>
                </Grid>
                
                {question.type === 'multiple_choice' && (
                  <Box sx={{ ml: 2, mt: 1 }}>
                    {question.options.map((option, optIndex) => {
                      const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D...
                      const isSelected = answer?.answer === optionLetter;
                      const isCorrectOption = question.correctAnswer === optionLetter;
                      
                      return (
                        <Typography 
                          key={optIndex} 
                          sx={{ 
                            ...pixelText, 
                            fontSize: '8px',
                            mb: 0.5,
                            color: isSelected 
                              ? (isCorrect ? 'success.main' : 'error.main') 
                              : (isCorrectOption && !isCorrect ? 'success.main' : 'text.primary')
                          }}
                        >
                          {optionLetter}. {option} {isSelected && '✓'} {isCorrectOption && !isSelected && !isCorrect && '(Correct)'}
                        </Typography>
                      );
                    })}
                  </Box>
                )}
                
                {question.type === 'true_false' && (
                  <Box sx={{ ml: 2, mt: 1 }}>
                    <Typography 
                      sx={{ 
                        ...pixelText, 
                        fontSize: '8px',
                        mb: 0.5,
                        color: answer?.answer === 'True' 
                          ? (isCorrect ? 'success.main' : 'error.main') 
                          : (question.correctAnswer === 'True' && !isCorrect ? 'success.main' : 'text.primary')
                      }}
                    >
                      True {answer?.answer === 'True' && '✓'} 
                      {question.correctAnswer === 'True' && answer?.answer !== 'True' && !isCorrect && '(Correct)'}
                    </Typography>
                    <Typography 
                      sx={{ 
                        ...pixelText, 
                        fontSize: '8px',
                        color: answer?.answer === 'False' 
                          ? (isCorrect ? 'success.main' : 'error.main') 
                          : (question.correctAnswer === 'False' && !isCorrect ? 'success.main' : 'text.primary')
                      }}
                    >
                      False {answer?.answer === 'False' && '✓'} 
                      {question.correctAnswer === 'False' && answer?.answer !== 'False' && !isCorrect && '(Correct)'}
                    </Typography>
                  </Box>
                )}
                
                {question.type === 'short_answer' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ ...pixelText, fontSize: '9px', fontWeight: 'bold' }}>
                      Student Answer:
                    </Typography>
                    <Paper elevation={0} sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '4px', mt: 0.5 }}>
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        {answer?.answer || 'No answer provided'}
                      </Typography>
                    </Paper>
                    
                    <Typography sx={{ ...pixelText, fontSize: '9px', fontWeight: 'bold', mt: 1 }}>
                      Expected Answer:
                    </Typography>
                    <Paper elevation={0} sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: '4px', mt: 0.5 }}>
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        {question.correctAnswer}
                      </Typography>
                    </Paper>
                    
                    <Chip 
                      size="small" 
                      label={isCorrect ? "CORRECT" : "INCORRECT"} 
                      color={isCorrect ? "success" : "error"}
                      sx={{ mt: 1, '& .MuiChip-label': { ...pixelText, fontSize: '6px' } }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </List>
    </Box>
  );
};

export default ComprehensionResultsView;