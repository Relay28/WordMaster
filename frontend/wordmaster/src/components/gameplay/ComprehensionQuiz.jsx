import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Typography, Paper, Button, Radio, RadioGroup, 
  FormControlLabel, TextField, CircularProgress,
  FormControl, FormLabel, Alert, Card, CardContent,
  LinearProgress, Container, Stepper, Step, StepLabel,
  Backdrop, Fade, Divider
} from '@mui/material';
import { ArrowBack, ArrowForward, Check, EmojiEvents, QuestionAnswer } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import confetti from 'canvas-confetti';

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ComprehensionQuiz = ({ sessionId, studentId, questions, onComplete }) => {
  const { getToken } = useUserAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Memoize questions to prevent unnecessary re-renders
  const stableQuestions = useMemo(() => questions, [JSON.stringify(questions)]);
  
  // Initialize answers array only once when questions are first loaded
  useEffect(() => {
    if (stableQuestions && stableQuestions.length > 0 && !initialized) {
      const initialAnswers = stableQuestions.map(q => ({ 
        questionId: q.id, 
        answer: q.type === 'true_false' ? 'True' : '' 
      }));
      setAnswers(initialAnswers);
      setInitialized(true);
      console.log('Initialized answers for', stableQuestions.length, 'questions');
    }
  }, [stableQuestions, initialized]);
  
  // Fire confetti when results are shown and score is good
  useEffect(() => {
    if (results && results.percentage >= 70) {
      setShowConfetti(true);
      const duration = 3 * 1000;
      const end = Date.now() + duration;
      
      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#5F4B8B', '#7a5bc9', '#9575cd']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#5F4B8B', '#7a5bc9', '#9575cd']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [results]);
  
  // Pixel text style
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };
  
  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };
  
  const handleAnswerChange = useCallback((value) => {
    setAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestion] = {
        ...newAnswers[currentQuestion],
        answer: value
      };
      return newAnswers;
    });
  }, [currentQuestion]);
  
  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredIndex = answers.findIndex(a => !a.answer);
    if (unansweredIndex !== -1) {
      setCurrentQuestion(unansweredIndex);
      setError("Please answer all questions before submitting");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${API_URL}/api/teacher-feedback/comprehension/${sessionId}/student/${studentId}/answers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            questions: questions,
            answers: answers
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }
      
      const data = await response.json();
      setResults(data);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError(err.message || 'Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getQuestionType = (question) => {
    return question.type;
  }
  
  if (!questions || questions.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
        <Typography sx={pixelHeading}>No comprehension questions available</Typography>
      </Paper>
    );
  }
  
  // If we have results, show the results view
  if (results) {
    const score = Math.round(results.percentage);
    let resultMessage, resultColor;
    
    if (score >= 90) {
      resultMessage = "Outstanding! You've mastered the content!";
      resultColor = "#4caf50"; // green
    } else if (score >= 70) {
      resultMessage = "Great job! You understood most of the content!";
      resultColor = "#2196f3"; // blue
    } else if (score >= 50) {
      resultMessage = "Good effort! Keep practicing to improve further.";
      resultColor = "#ff9800"; // amber
    } else {
      resultMessage = "Let's keep learning! Review the material and try again.";
      resultColor = "#f44336"; // red
    }
    
    return (
      <Container maxWidth="md"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Optional: remove default padding for perfect centering
          marginTop: 20,
        }}
      >
        <Fade in={true} timeout={800}>
          <Paper elevation={5} sx={{ 
            p: 4, 
            borderRadius: '16px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: `4px solid ${resultColor}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', bgcolor: resultColor }} />
            
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography sx={{
                ...pixelHeading,
                fontSize: '20px',
                color: '#5F4B8B',
                mb: 2
              }}>
                Comprehension Results
              </Typography>
              
              <Box sx={{ 
                position: 'relative',
                width: '160px',
                height: '160px',
                margin: '0 auto',
                mb: 3
              }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={160}
                  thickness={5}
                  sx={{ color: 'rgba(0, 0, 0, 0.1)' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={score}
                  size={160}
                  thickness={5}
                  sx={{ 
                    color: resultColor,
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{
                    ...pixelHeading,
                    fontSize: '28px',
                    color: resultColor
                  }}>
                    {score}%
                  </Typography>
                </Box>
              </Box>
              
              <Typography sx={{ 
                ...pixelHeading, 
                fontSize: '14px',
                color: resultColor,
                mb: 1
              }}>
                {results.correctAnswers} out of {results.totalQuestions} correct
              </Typography>
              
              <Typography sx={{ 
                ...pixelText,
                fontSize: '12px',
                mb: 3
              }}>
                {resultMessage}
              </Typography>
              
              <Divider sx={{ my: 3 }} />
            </Box>
            
            <Typography sx={{ 
              ...pixelHeading, 
              fontSize: '15px',
              mb: 2,
              color: '#5F4B8B' 
            }}>
              Question Review
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              {results.gradedAnswers && results.gradedAnswers.map((answer, index) => {
                const question = questions.find(q => q.id === answer.questionId);
                return (
                  <Fade in={true} key={index} timeout={500 + (index * 200)}>
                    <Card sx={{ 
                      mb: 2, 
                      borderLeft: `6px solid ${answer.isCorrect ? '#4caf50' : '#f44336'}`,
                      bgcolor: answer.isCorrect ? 'rgba(76, 175, 80, 0.04)' : 'rgba(244, 67, 54, 0.04)'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          {answer.isCorrect ? (
                            <Check sx={{ color: '#4caf50', mr: 1, mt: 0.2 }} />
                          ) : (
                            <Typography sx={{ 
                              color: '#f44336', 
                              fontWeight: 'bold',
                              mr: 1,
                              mt: -0.5,
                              fontSize: '18px'
                            }}>✗</Typography>
                          )}
                          <Typography sx={{ 
                            ...pixelText, 
                            fontSize: '11px',
                            fontWeight: 'medium',
                            lineHeight: '1.6'
                          }}>
                            {question?.question}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ pl: 4 }}>
                          <Typography sx={{ ...pixelText, fontSize: '10px', mb: 0.5 }}>
                            Your answer: <span style={{ 
                              color: answer.isCorrect ? '#4caf50' : '#f44336',
                              fontWeight: 'bold'
                            }}>{answer.answer}</span>
                          </Typography>
                          
                          {!answer.isCorrect && (
                            <Typography sx={{ ...pixelText, fontSize: '10px', color: '#4caf50' }}>
                              Correct answer: {answer.correctAnswer}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                );
              })}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained"
                onClick={() => onComplete && onComplete(results)}
                sx={{ 
                  ...pixelText,
                  bgcolor: '#5F4B8B',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#4a3a6d',
                  },
                  borderRadius: '8px',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                }}
                startIcon={<EmojiEvents />}
              >
                See Final Results
              </Button>
            </Box>
          </Paper>
        </Fade>
        
        <Backdrop
          open={showConfetti}
          sx={{ zIndex: 1000, backgroundColor: 'transparent' }}
        />
      </Container>
    );
  }
  
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  
  return (
    <Container maxWidth="md">
      <Fade in={true}>
        <Paper elevation={5} sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: '16px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          border: '4px solid #5F4B8B'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
              Comprehension Check
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: 'rgba(95, 75, 139, 0.1)',
              px: 2,
              py: 1,
              borderRadius: '20px'
            }}>
              <QuestionAnswer sx={{ color: '#5F4B8B', mr: 1, fontSize: 20 }} />
              <Typography sx={pixelText}>
                {currentQuestion + 1} / {questions.length}
              </Typography>
            </Box>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': pixelText
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              mb: 3, 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'rgba(95, 75, 139, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#5F4B8B',
                borderRadius: 5
              }
            }} 
          />
          
          <Box sx={{ mb: 4 }}>
            <Card elevation={2} sx={{ 
              mb: 3,
              borderLeft: '6px solid #5F4B8B',
              borderRadius: '8px'
            }}>
              <CardContent>
                <Typography sx={{ 
                  ...pixelHeading, 
                  fontSize: '15px', 
                  color: '#5F4B8B',
                  mb: 1 
                }}>
                  Question {currentQuestion + 1}
                </Typography>
                
                <Typography sx={{ 
                  fontSize: '16px',
                  lineHeight: 1.6,
                  fontWeight: 'medium'
                }}>
                  {question.question}
                </Typography>
              </CardContent>
            </Card>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              {getQuestionType(question) === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQuestion]?.answer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                >
                  {question.options.map((option, i) => {
                    const optionLabel = String.fromCharCode(65 + i); // A, B, C, D...
                    return (
                      <Paper 
                        key={i}
                        elevation={1}
                        sx={{ 
                          mb: 1.5,
                          borderRadius: '8px',
                          transition: 'all 0.2s ease-in-out',
                          transform: answers[currentQuestion]?.answer === optionLabel ? 'translateY(-2px)' : 'none',
                          boxShadow: answers[currentQuestion]?.answer === optionLabel 
                            ? '0 4px 8px rgba(95, 75, 139, 0.3)' 
                            : '0 1px 3px rgba(0,0,0,0.1)',
                          '&:hover': {
                            boxShadow: '0 3px 6px rgba(95, 75, 139, 0.2)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <FormControlLabel
                          value={optionLabel}
                          control={
                            <Radio 
                              sx={{ 
                                '&.Mui-checked': { color: '#5F4B8B' },
                                py: 1,
                                pl: 1
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ 
                              ...pixelText, 
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <Box component="span" sx={{ 
                                bgcolor: answers[currentQuestion]?.answer === optionLabel ? '#5F4B8B' : '#e0e0e0',
                                color: answers[currentQuestion]?.answer === optionLabel ? 'white' : '#666',
                                px: 1,
                                py: 0.5,
                                mr: 2,
                                borderRadius: '4px',
                                minWidth: '24px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                fontFamily: '"Press Start 2P", cursive',
                                fontSize: '10px'
                              }}>
                                {optionLabel}
                              </Box>
                              {option}
                            </Typography>
                          }
                          sx={{ 
                            py: 0.5, 
                            px: 1, 
                            m: 0,
                            width: '100%'
                          }}
                        />
                      </Paper>
                    );
                  })}
                </RadioGroup>
              )}
              
              {getQuestionType(question) === 'true_false' && (
                <RadioGroup
                  value={answers[currentQuestion]?.answer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}
                >
                  {['True', 'False'].map((option) => (
                    <Paper
                      key={option}
                      elevation={1}
                      sx={{
                        flex: 1, 
                        textAlign: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease-in-out',
                        transform: answers[currentQuestion]?.answer === option ? 'translateY(-2px)' : 'none',
                        boxShadow: answers[currentQuestion]?.answer === option 
                          ? '0 4px 8px rgba(95, 75, 139, 0.3)' 
                          : '0 1px 3px rgba(0,0,0,0.1)',
                        backgroundColor: answers[currentQuestion]?.answer === option 
                          ? (option === 'True' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)')
                          : 'white',
                        border: answers[currentQuestion]?.answer === option
                          ? `2px solid ${option === 'True' ? '#4caf50' : '#f44336'}`
                          : '2px solid transparent',
                        '&:hover': {
                          boxShadow: '0 3px 6px rgba(95, 75, 139, 0.2)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <FormControlLabel
                        value={option}
                        control={
                          <Radio 
                            sx={{ 
                              '&.Mui-checked': { 
                                color: option === 'True' ? '#4caf50' : '#f44336' 
                              }
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ 
                            ...pixelText, 
                            fontSize: '12px',
                            color: answers[currentQuestion]?.answer === option
                              ? (option === 'True' ? '#4caf50' : '#f44336')
                              : 'inherit',
                            fontWeight: answers[currentQuestion]?.answer === option ? 'bold' : 'normal'
                          }}>
                            {option}
                          </Typography>
                        }
                        sx={{ width: '100%', m: 0, py: 2 }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              )}
              
              {getQuestionType(question) === 'short_answer' && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={answers[currentQuestion]?.answer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  InputProps={{
                    sx: {
                      fontSize: '14px',
                      borderRadius: '8px',
                      '&.Mui-focused': {
                        borderColor: '#5F4B8B'
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#5F4B8B',
                        borderWidth: '2px'
                      }
                    }
                  }}
                />
              )}
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              disabled={currentQuestion === 0}
              onClick={goToPreviousQuestion}
              startIcon={<ArrowBack />}
              sx={{
                ...pixelText,
                borderColor: '#5F4B8B',
                color: '#5F4B8B',
                '&:hover': {
                  borderColor: '#4a3a6d',
                  backgroundColor: 'rgba(95, 75, 139, 0.04)'
                },
                borderRadius: '8px'
              }}
            >
              Previous
            </Button>
            
            {currentQuestion < questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={goToNextQuestion}
                endIcon={<ArrowForward />}
                sx={{
                  ...pixelText,
                  backgroundColor: '#5F4B8B',
                  '&:hover': { backgroundColor: '#4a3a6d' },
                  borderRadius: '8px',
                  boxShadow: '3px 3px 0px rgba(0,0,0,0.2)'
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{
                  ...pixelText,
                  backgroundColor: '#5F4B8B',
                  '&:hover': { backgroundColor: '#4a3a6d' },
                  borderRadius: '8px',
                  px: 4,
                  boxShadow: '3px 3px 0px rgba(0,0,0,0.2)'
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check sx={{ mr: 1 }} />
                    Submit Answers
                  </>
                )}
              </Button>
            )}
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default ComprehensionQuiz;