import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Radio, RadioGroup, 
  FormControlLabel, TextField, CircularProgress,
  FormControl, FormLabel, Alert, Card, CardContent
} from '@mui/material';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';

const ComprehensionQuiz = ({ sessionId, studentId, questions, onComplete }) => {
  const { getToken } = useUserAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Initialize answers array based on questions
  useEffect(() => {
    if (questions && questions.length > 0) {
      setAnswers(questions.map(q => ({ 
        questionId: q.id, 
        answer: q.type === 'true_false' ? 'True' : '' 
      })));
    }
  }, [questions]);
  
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
  
  const handleAnswerChange = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      ...newAnswers[currentQuestion],
      answer: value
    };
    setAnswers(newAnswers);
  };
  
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
    const unanswered = answers.findIndex(a => !a.answer);
    if (unanswered !== -1) {
      setCurrentQuestion(unanswered);
      setError("Please answer all questions before submitting");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
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
    // Otherwise use the stored type
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
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
        <Typography sx={pixelHeading} gutterBottom>
          Comprehension Results
        </Typography>
        
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography sx={pixelHeading} color="primary">
            Score: {results.correctAnswers}/{results.totalQuestions}
            ({Math.round(results.percentage)}%)
          </Typography>
        </Box>
        
        {results.gradedAnswers && results.gradedAnswers.map((answer, index) => (
          <Card key={index} sx={{ mb: 2, border: answer.isCorrect ? '2px solid green' : '2px solid red' }}>
            <CardContent>
              <Typography sx={pixelText} color={answer.isCorrect ? 'success.main' : 'error.main'}>
                Question {index + 1}: {questions.find(q => q.id === answer.questionId)?.question}
              </Typography>
              <Typography sx={pixelText}>
                Your answer: {answer.answer}
              </Typography>
              {!answer.isCorrect && (
                <Typography sx={pixelText} color="error.main">
                  Correct answer: {answer.correctAnswer}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          sx={{ ...pixelText, mt: 2 }}
        >
          Continue
        </Button>
      </Paper>
    );
  }
  
  const question = questions[currentQuestion];
  
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
      <Typography sx={pixelHeading} gutterBottom>
        Comprehension Check
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={pixelText}>
          Question {currentQuestion + 1} of {questions.length}
        </Typography>
        <Typography sx={pixelText}>
          {getQuestionType(question) === 'multiple_choice' ? 'Multiple Choice' : 
           getQuestionType(question) === 'true_false' ? 'True/False' : 'Short Answer'}
        </Typography>
      </Box>
      
      <Typography sx={{ ...pixelText, fontSize: '12px', mb: 3 }}>
        {question.question}
      </Typography>
      
      <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
        {getQuestionType(question) === 'multiple_choice' && (
          <RadioGroup
            value={answers[currentQuestion]?.answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            {question.options.map((option, i) => (
              <FormControlLabel
                key={i}
                value={String.fromCharCode(65 + i)} // A, B, C, D...
                control={<Radio />}
                label={`${String.fromCharCode(65 + i)}. ${option}`}
                sx={{ '& .MuiFormControlLabel-label': pixelText }}
              />
            ))}
          </RadioGroup>
        )}
        
        {getQuestionType(question) === 'true_false' && (
          <RadioGroup
            value={answers[currentQuestion]?.answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            <FormControlLabel
              value="True"
              control={<Radio />}
              label="True"
              sx={{ '& .MuiFormControlLabel-label': pixelText }}
            />
            <FormControlLabel
              value="False"
              control={<Radio />}
              label="False"
              sx={{ '& .MuiFormControlLabel-label': pixelText }}
            />
          </RadioGroup>
        )}
        
        {getQuestionType(question) === 'short_answer' && (
          <TextField
            fullWidth
            label="Your Answer"
            multiline
            rows={3}
            value={answers[currentQuestion]?.answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            InputProps={{
              sx: pixelText
            }}
          />
        )}
      </FormControl>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          disabled={currentQuestion === 0}
          onClick={goToPreviousQuestion}
          startIcon={<ArrowBack />}
          sx={pixelText}
        >
          Previous
        </Button>
        
        {currentQuestion < questions.length - 1 ? (
          <Button
            variant="outlined"
            onClick={goToNextQuestion}
            endIcon={<ArrowForward />}
            sx={pixelText}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
            endIcon={submitting ? <CircularProgress size={20} /> : <Check />}
            sx={pixelText}
          >
            Submit Answers
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ComprehensionQuiz;