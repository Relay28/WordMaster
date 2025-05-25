import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, Grid, Button, Avatar, 
  CircularProgress, Alert, Divider, List, ListItem, ListItemText, Chip,
    TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab
} from '@mui/material';
import { ArrowBack, School, Person, Assessment, EmojiEvents, QuestionAnswer, Spellcheck} from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import ComprehensionResultsView from './ComprehensionResultsView';
import GrammarVocabResultsView from './GrammarVocabResultsView'; // Import the new component


const StudentReportPage = () => {
  const { sessionId, studentId } = useParams();
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    feedback: '',
    comprehensionScore: 3,
    participationScore: 3,
    languageUseScore: 3,
    roleAdherenceScore: 3,
    overallGrade: 'B'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [comprehensionData, setComprehensionData] = useState(null);
  
  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '12px' : '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };
  
  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const response = await fetch(
          `${API_URL}/api/teacher-feedback/analytics/${sessionId}/student/${studentId}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch student details');
        }
        
        const data = await response.json();
        setStudentDetails(data);
        
        // If there's existing feedback, load it
        if (data.feedback) {
          setFeedbackData({
            feedback: data.feedback.feedback || '',
            comprehensionScore: data.feedback.comprehensionScore || 3,
            participationScore: data.feedback.participationScore || 3,
            languageUseScore: data.feedback.languageUseScore || 3,
            roleAdherenceScore: data.feedback.roleAdherenceScore || 3,
            overallGrade: data.feedback.overallGrade || 'B'
          });
        }
        
      } catch (err) {
        console.error("Error loading student details:", err);
        setError(err.message || 'Failed to load student report');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [sessionId, studentId, getToken]);
  
 const handleSaveFeedback = async () => {
  try {
    setLoading(true);
    const token = await getToken();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    const response = await fetch(`${API_URL}/api/teacher-feedback/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameSessionId: sessionId,
        studentId: studentId,
        ...feedbackData
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save feedback');
    }
    
    // Fetch updated student details after saving
    const updatedResponse = await fetch(
      `${API_URL}/api/teacher-feedback/analytics/${sessionId}/student/${studentId}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!updatedResponse.ok) {
      throw new Error('Failed to fetch updated student details');
    }
    
    const updatedData = await updatedResponse.json();
    setStudentDetails(updatedData);
    
    // Make sure feedbackData state also matches the updated data
    if (updatedData.feedback) {
      setFeedbackData({
        feedback: updatedData.feedback.feedback || '',
        comprehensionScore: updatedData.feedback.comprehensionScore || 3,
        participationScore: updatedData.feedback.participationScore || 3,
        languageUseScore: updatedData.feedback.languageUseScore || 3,
        roleAdherenceScore: updatedData.feedback.roleAdherenceScore || 3,
        overallGrade: updatedData.feedback.overallGrade || 'B'
      });
    }
    
    setEditMode(false);
  } catch (err) {
    console.error("Error saving feedback:", err);
    setError(err.message || 'Failed to save feedback');
  } finally {
    setLoading(false);
  }
};
  
  const generateAIFeedback = async () => {
  try {
    setLoading(true);
    const token = await getToken();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    // Call the endpoint that triggers AIService.generate_feedback
    const response = await fetch(`${API_URL}/api/ai-feedback/generate/${sessionId}/${studentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate AI feedback');
    }
    
    const data = await response.json();
    
    // Update the feedback form with AI-generated content
    setFeedbackData({
      ...feedbackData,
      feedback: data.feedback || feedbackData.feedback
    });
    
  } catch (err) {
    console.error("Error generating AI feedback:", err);
    setError("Failed to generate AI feedback. Please try again.");
  } finally {
    setLoading(false);
  }
};
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData({
      ...feedbackData,
      [name]: value
    });
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  useEffect(() => {
    const fetchComprehensionData = async () => {
      try {
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        const response = await fetch(
          `${API_URL}/api/comprehension/session/${sessionId}/student/${studentId}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          console.warn('No separate comprehension results available');
          return;
        }
        
        const data = await response.json();
        setComprehensionData(data);
        
      } catch (err) {
        console.error("Error loading comprehension data:", err);
        // Don't set an error, just log it - we don't want to break the whole page if just this fails
      }
    };

    if (sessionId && studentId) {
      fetchComprehensionData();
    }
  }, [sessionId, studentId, getToken]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/homepage')}
          sx={pixelButton}
        >
          Back
        </Button>
      </Container>
    );
  }
  
  if (!studentDetails) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No student data found
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={pixelButton}
        >
          Back
        </Button>
      </Container>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
     height: '100vh',
  width: '100vw', margin: 0,
    display: 'flex',
  flexDirection: 'column',
    overflow: 'hidden',
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
      background: `
        linear-gradient(to bottom, 
          rgba(249, 249, 249, 0.8) 0%, 
          rgba(249, 249, 249, 0.8) 40%, 
          rgba(249, 249, 249, 0.2) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <Box sx={{ 
        flex: 1,
        width: '100%',
        overflow: 'auto',
        py: 4,
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(95, 75, 139, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#5F4B8B',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#4a3a6d',
          },
        },
      }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/homepage')}
              sx={{
                ...pixelButton,
                mr: 2,
                color: '#5F4B8B',
                border: '2px solid #5F4B8B',
                '&:hover': {
                  backgroundColor: 'rgba(95, 75, 139, 0.1)'
                }
              }}
            >
              Back
            </Button>
            <Typography sx={{ ...pixelHeading, fontSize: isMobile ? '16px' : '20px' }}>
              Student Report
            </Typography>
          </Box>
          
          {/* Student Info Card */}
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#5F4B8B',
                  fontSize: '1.8rem',
                  mx: { xs: 'auto', md: 0 }
                }}>
                  {studentDetails.studentName.split(' ').map(n => n[0]).join('')}
                </Avatar>
              </Grid>
              <Grid item xs={12} md={10}>
                <Typography sx={{ ...pixelHeading, fontSize: isMobile ? '16px' : '20px', mb: 1 }}>
                  {studentDetails.studentName}
                </Typography>
                <Typography sx={{ ...pixelText, color: '#5F4B8B', mb: 2 }}>
                  ROLE: {studentDetails.role || 'N/A'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        TOTAL SCORE
                      </Typography>
                      <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
                        {studentDetails.totalScore}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        MESSAGES SENT
                      </Typography>
                      <Typography sx={{ ...pixelHeading }}>
                        {studentDetails.messageCount}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        WORD BANK USAGE
                      </Typography>
                      <Typography sx={{ ...pixelHeading }}>
                        {studentDetails.wordBankUsageCount}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box>
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        GRAMMAR STREAK
                      </Typography>
                      <Typography sx={{ ...pixelHeading }}>
                        {studentDetails.grammarStreak}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Performance Details */}
          <Grid container spacing={4} sx={{ mb: 10 }}>
            {/* Grammar Performance */}
            <Grid item xs={12} md={6} mb={5}>
              <Paper elevation={0} sx={{ 
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '4px solid #5F4B8B',
                borderRadius: '6px',
                height: '100%',
                  mb: 2, // Added margin bottom
                width: '1095px',
              }}>
                <Typography sx={{ ...pixelHeading, mb: 2}}>
                  GRAMMAR PERFORMANCE
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  {studentDetails.grammarBreakdown && Object.entries(studentDetails.grammarBreakdown).map(([status, count]) => (
                    <Paper 
                      key={status} 
                      elevation={0}
                      sx={{ 
                        flex: '1 0 28%',
                        p: 2, 
                        textAlign: 'center',
                        bgcolor: 
                          status === 'PERFECT' ? 'rgba(76, 175, 80, 0.1)' : 
                          status === 'MINOR_ERRORS' ? 'rgba(255, 152, 0, 0.1)' : 
                          'rgba(244, 67, 54, 0.1)',
                        borderRadius: '4px',
                        border: '1px solid',
                          mb: 3 ,
                        borderColor:
                          status === 'PERFECT' ? 'rgba(76, 175, 80, 0.3)' : 
                          status === 'MINOR_ERRORS' ? 'rgba(255, 152, 0, 0.3)' : 
                          'rgba(244, 67, 54, 0.3)',
                      }}
                    >
                      <Typography sx={{ 
                        ...pixelText, 
                        fontSize: '8px', 
                        color: 
                          status === 'PERFECT' ? '#4caf50' : 
                          status === 'MINOR_ERRORS' ? '#ff9800' : 
                          '#f44336',
                        mb: 1
                      }}>
                        {status.replace('_', ' ')}
                      </Typography>
                      <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                        {count}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
                
               
          {/* Score Breakdown Section */}
          <Typography sx={{ 
            ...pixelHeading, 
            fontSize: '12px', 
            mb: 2,
            borderBottom: '2px solid #5F4B8B',
            pb: 1
          }}>
                          SCORE BREAKDOWN
                </Typography>
                <Box sx={{ maxHeight: '200px', overflowY: 'auto', pr: 1 }}>
                <List disablePadding sx={{mb: 0}}>
                  {studentDetails.scoreBreakdown && studentDetails.scoreBreakdown.map((item, index) => (
                    <ListItem 
                      key={index}
                      sx={{ 
                        py: 1, 
                        px: 2,
                        backgroundColor: index % 2 === 0 ? 'rgba(95, 75, 139, 0.05)' : 'transparent',
                        borderRadius: '4px'
                      }}
                    >
                      <ListItemText 
                        primary={
                          <Typography sx={{ ...pixelText, fontSize: isMobile ? '7px' : '8px' }}>
                            {item.reason}
                          </Typography>
                        }
                      />
                      <Typography sx={{ 
                        ...pixelText, 
                        fontSize: isMobile ? '8px' : '10px', 
                        fontWeight: 'bold', 
                        color: '#5F4B8B'
                      }}>
                        +{item.points} pts
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                </Box>
              </Paper>
            </Grid>
           
            {/* Teacher Feedback */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ 
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '4px solid #5F4B8B',
                borderRadius: '6px',
                height: '100%',
                width: '1095px',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, }}>
                  <Typography sx={{ ...pixelHeading }}>
                    TEACHER FEEDBACK
                  </Typography>
                  
                  {user?.role === 'USER_TEACHER' && (
                    <Button
                      variant="outlined"
                      onClick={() => setEditMode(!editMode)}
                      sx={{
                        ...pixelButton,
                        fontSize: '8px',
                        border: '2px solid #5F4B8B',
                        color: '#5F4B8B',
                        height: '32px',
                      }}
                    >
                      {editMode ? 'CANCEL' : studentDetails.feedback ? 'EDIT' : 'ADD FEEDBACK'}
                    </Button>
                  )}
                </Box>
                
                {editMode ? (
                  <Box component="form">
                    <TextField
                      fullWidth
                      multiline
                      rows={9}
                      name="feedback"
                      label="Feedback"
                      value={feedbackData.feedback}
                      onChange={handleFeedbackChange}
                      sx={{ mb: 3, height: '250px'}}
                    />
                    
                    <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
                      <Grid item xs={6} width={'120px'}>
                        <FormControl fullWidth>
                          <InputLabel>Comprehension</InputLabel>
                          <Select
                            name="comprehensionScore"
                            value={feedbackData.comprehensionScore}
                            onChange={handleFeedbackChange}
                            label="Comprehension"
                          >
                            {[1, 2, 3, 4, 5].map(score => (
                              <MenuItem key={score} value={score}>{score}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} width={'120px'}>
                        <FormControl fullWidth>
                          <InputLabel>Participation</InputLabel>
                          <Select
                            name="participationScore"
                            value={feedbackData.participationScore}
                            onChange={handleFeedbackChange}
                            label="Participation"
                          >
                            {[1, 2, 3, 4, 5].map(score => (
                              <MenuItem key={score} value={score}>{score}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} width={'120px'}>
                        <FormControl fullWidth>
                          <InputLabel>Language Use</InputLabel>
                          <Select
                            name="languageUseScore"
                            value={feedbackData.languageUseScore}
                            onChange={handleFeedbackChange}
                            label="Language Use"
                          >
                            {[1, 2, 3, 4, 5].map(score => (
                              <MenuItem key={score} value={score}>{score}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} width={'120px'}>
                        <FormControl fullWidth>
                          <InputLabel>Role Adherence</InputLabel>
                          <Select
                            name="roleAdherenceScore"
                            value={feedbackData.roleAdherenceScore}
                            onChange={handleFeedbackChange}
                            label="Role Adherence"
                          >
                            {[1, 2, 3, 4, 5].map(score => (
                              <MenuItem key={score} value={score}>{score}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} width={'120px'}>
                        <FormControl fullWidth>
                          <InputLabel>Overall Grade</InputLabel>
                          <Select
                            name="overallGrade"
                            value={feedbackData.overallGrade}
                            onChange={handleFeedbackChange}
                            label="Overall Grade"
                          >
                            {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].map(grade => (
                              <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    {/* Add this before the SAVE FEEDBACK button */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={generateAIFeedback}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                        sx={{
                          ...pixelButton,
                          borderColor: '#5F4B8B',
                          color: '#5F4B8B',
                          '&:hover': { backgroundColor: 'rgba(95, 75, 139, 0.1)' }
                        }}
                      >
                        GENERATE AI FEEDBACK
                      </Button>
                    </Box>
                    
                    {/* Then your existing Save button */}
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSaveFeedback}
                      sx={{
                        ...pixelButton,
                        backgroundColor: '#5F4B8B',
                        '&:hover': { backgroundColor: '#4a3a6d' }
                      }}
                    >
                      SAVE FEEDBACK
                    </Button>
                  </Box>
                ) : studentDetails.feedback ? (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ ...pixelText, fontSize: '10px', fontWeight: 'bold', mb: 1 }}>
                        Teacher Comments:
                      </Typography>
                      <Paper elevation={0} sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(95, 75, 139, 0.05)', 
                        borderRadius: '4px',
                        border: '1px solid rgba(95, 75, 139, 0.1)'
                      }}>
                        <Typography sx={{fontSize: '14px' }}>
                          {studentDetails.feedback.feedback || "No written feedback provided"}
                        </Typography>
                      </Paper>
                    </Box>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography sx={{ ...pixelText, fontSize: '10px', fontWeight: 'bold', mb: 2 }}>
                      Performance Scores:
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
                      <Grid item xs={6} sm={3}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(95, 75, 139, 0.05)',
                          borderRadius: '4px',
                          border: '1px solid rgba(95, 75, 139, 0.1)',
                          height: '100%'
                        }}>
                          <Typography sx={{ ...pixelText, fontSize: '8px', mb: 1, color: '#5F4B8B' }}>
                            COMPREHENSION
                          </Typography>
                          <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                            {studentDetails.feedback.comprehensionScore}/5
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(95, 75, 139, 0.05)',
                          borderRadius: '4px',
                          border: '1px solid rgba(95, 75, 139, 0.1)',
                          height: '100%'
                        }}>
                          <Typography sx={{ ...pixelText, fontSize: '8px', mb: 1, color: '#5F4B8B' }}>
                            PARTICIPATION
                          </Typography>
                          <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                            {studentDetails.feedback.participationScore}/5
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(95, 75, 139, 0.05)',
                          borderRadius: '4px',
                          border: '1px solid rgba(95, 75, 139, 0.1)',
                          height: '100%'
                        }}>
                          <Typography sx={{ ...pixelText, fontSize: '8px', mb: 1, color: '#5F4B8B' }}>
                            LANGUAGE USE
                          </Typography>
                          <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                            {studentDetails.feedback.languageUseScore}/5
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper elevation={0} sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          bgcolor: 'rgba(95, 75, 139, 0.05)',
                          borderRadius: '4px',
                          border: '1px solid rgba(95, 75, 139, 0.1)',
                          height: '100%'
                        }}>
                          <Typography sx={{ ...pixelText, fontSize: '8px', mb: 1, color: '#5F4B8B' }}>
                            ROLE ADHERENCE
                          </Typography>
                          <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                            {studentDetails.feedback.roleAdherenceScore}/5
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                      <Typography sx={{ ...pixelText, fontSize: '10px', mb: 1 }}>
                        OVERALL GRADE
                      </Typography>
                      <Chip 
                        label={studentDetails.feedback.overallGrade} 
                        sx={{
                          ...pixelHeading,
                          fontSize: '24px',
                          height: '48px',
                          bgcolor: '#5F4B8B',
                          color: 'white',
                          border: '2px solid #4a3a6d',
                          px: 2
                        }}
                      />
                    </Box>
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '80%',
                    p: 3
                  }}>
                    <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 2, textAlign: 'center' }}>
                      NO FEEDBACK HAS BEEN PROVIDED YET
                    </Typography>
                    
                    {user?.role === 'USER_TEACHER' && (
                      <Button
                        variant="contained"
                        onClick={() => setEditMode(true)}
                        sx={{
                          ...pixelButton,
                          backgroundColor: '#5F4B8B',
                          '&:hover': { backgroundColor: '#4a3a6d' }
                        }}
                      >
                        ADD FEEDBACK
                      </Button>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Tabs for Overview, Messages, Comprehension */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px'
          }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              sx={{ 
                mb: 2, 
                '& .MuiTabs-indicator': { backgroundColor: '#5F4B8B' },
                '& .MuiTab-root': { ...pixelText, minWidth: 'auto' },
                '& .Mui-selected': { color: '#5F4B8B' }
              }}
            >
              <Tab icon={<QuestionAnswer />} label="Comprehension" />
              <Tab icon={<Spellcheck />} label="Grammar & Vocabulary" />
            </Tabs>
            
            {/* Tab contents */}
            {activeTab === 0 && (
              <ComprehensionResultsView 
                comprehensionData={comprehensionData || {
                  comprehensionQuestions: studentDetails.feedback?.comprehensionQuestions,
                  comprehensionAnswers: studentDetails.feedback?.comprehensionAnswers,
                  comprehensionPercentage: studentDetails.feedback?.comprehensionPercentage
                }}
                pixelText={pixelText}
                pixelHeading={pixelHeading}
              />
            )}
            
            {activeTab === 1 && (
              <GrammarVocabResultsView 
                grammarData={{
                  grammarBreakdown: studentDetails.grammarBreakdown || {},
                  grammarStreak: studentDetails.grammarStreak || 0
                }}
                vocabularyData={{
                  score: studentDetails.vocabularyScore || 0,
                  usedWords: studentDetails.usedWords || [],
                  usedAdvancedWords: studentDetails.usedAdvancedWords || []
                }}
                pixelText={pixelText}
                pixelHeading={pixelHeading}
              />
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default StudentReportPage;