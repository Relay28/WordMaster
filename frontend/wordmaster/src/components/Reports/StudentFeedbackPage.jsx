import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, Grid, Button, 
  CircularProgress, Alert, Divider, Chip, Tabs, Tab
} from '@mui/material';
import { ArrowBack, QuestionAnswer, Spellcheck } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import ComprehensionResultsView from './ComprehensionResultsView';
import GrammarVocabResultsView from './GrammarVocabResultsView';



const StudentFeedbackPage = () => {
  const { sessionId, studentId } = useParams();
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackDetails, setFeedbackDetails] = useState(null);
  const [comprehensionData, setComprehensionData] = useState(null);
  const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
      };

  // Pixel styling (same as other pages)
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
    const fetchFeedbackDetails = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        // Use the same endpoint as the teacher view, but ensure the backend validates the user can only see their own feedback
        const response = await fetch(
          `${API_URL}/api/teacher-feedback/analytics/${sessionId}/student/${studentId}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedback details');
        }
        
        const data = await response.json();
        setFeedbackDetails(data);
      } catch (err) {
        console.error("Error loading feedback details:", err);
        setError(err.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackDetails();
  }, [sessionId, studentId, getToken]);
  
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
          onClick={() => navigate(-1)}
          sx={pixelButton}
        >
          Back
        </Button>
      </Container>
    );
  }
  
  if (!feedbackDetails || !feedbackDetails.feedback) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No feedback data available
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
      overflow: 'hidden',
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
              onClick={() => navigate(-1)}
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
              Teacher Feedback
            </Typography>
          </Box>
          
          {/* Game Info Card */}
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px'
          }}>
            <Typography sx={{ ...pixelHeading, fontSize: isMobile ? '16px' : '20px', mb: 2 }}>
              {feedbackDetails.contentTitle || 'Game Session'}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                    DATE
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '12px' }}>
                    {new Date(feedbackDetails.sessionDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                    TEACHER
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '12px' }}>
                    {feedbackDetails.teacherName || 'Unknown'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                    YOUR ROLE
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '12px' }}>
                    {feedbackDetails.role || 'Player'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Performance Summary */}
          <Paper elevation={0} sx={{ 
            p: 3,
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px'
          }}>
            <Typography sx={{ ...pixelHeading, mb: 3 }}>
              PERFORMANCE SUMMARY
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
                  <Typography sx={{ ...pixelText, fontSize: '8px', mb: 1, color: '#5F4B8B', width: '120px' }}>
                    TOTAL SCORE
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                    {feedbackDetails.totalScore}
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
                  <Typography sx={{ ...pixelText, fontSize: '8px', mb: 1, color: '#5F4B8B', width: '120px'}}>
                    MESSAGES SENT
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                    {feedbackDetails.messageCount}
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
                    WORD BANK USAGE
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                    {feedbackDetails.wordBankUsageCount}
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
                    GRAMMAR STREAK
                  </Typography>
                  <Typography sx={{ ...pixelHeading, fontSize: '16px' }}>
                    {feedbackDetails.grammarStreak}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography sx={{ ...pixelText, fontSize: '10px', mb: 1 }}>
                OVERALL GRADE
              </Typography>
              <Chip 
                label={feedbackDetails.feedback.overallGrade} 
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
          </Paper>
          
          {/* Teacher Feedback */}
          <Paper elevation={0} sx={{ 
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px'
          }}>
            <Typography sx={{ ...pixelHeading, mb: 3 }}>
              TEACHER'S FEEDBACK
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ ...pixelText, fontSize: '10px', fontWeight: 'bold', mb: 1 }}>
                Comments:
              </Typography>
              <Paper elevation={0} sx={{ 
                p: 2, 
                bgcolor: 'rgba(95, 75, 139, 0.05)', 
                borderRadius: '4px',
                border: '1px solid rgba(95, 75, 139, 0.1)'
              }}>
                <Typography sx={{ ...pixelText, fontSize: '9px' }}>
                  {feedbackDetails.feedback.feedback || "No written feedback provided"}
                </Typography>
              </Paper>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography sx={{ ...pixelText, fontSize: '10px', fontWeight: 'bold', mb: 2 }}>
              Skill Assessments:
            </Typography>
            
            <Grid container spacing={2}>
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
                    {feedbackDetails.feedback.comprehensionScore}/5
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
                    {feedbackDetails.feedback.participationScore}/5
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
                    {feedbackDetails.feedback.languageUseScore}/5
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
                    {feedbackDetails.feedback.roleAdherenceScore}/5
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Results Tabs Section */}
          <Paper elevation={0} sx={{ 
            p: 3,
            mt: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '4px solid #5F4B8B',
            borderRadius: '6px'
          }}>
            <Typography sx={{ ...pixelHeading, mb: 3 }}>
              PERFORMANCE DETAILS
            </Typography>
            
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              sx={{ 
                mb: 3,
                '& .MuiTabs-indicator': { backgroundColor: '#5F4B8B' },
                '& .MuiTab-root': { ...pixelText, fontSize: '8px' },
                '& .Mui-selected': { color: '#5F4B8B' }
              }}
            >
              <Tab icon={<QuestionAnswer />} label="COMPREHENSION" />
              <Tab icon={<Spellcheck />} label="GRAMMAR & VOCABULARY" />
            </Tabs>
            
            {/* Comprehension Tab */}
            {activeTab === 0 && (
              <ComprehensionResultsView 
                comprehensionData={comprehensionData || {
                  comprehensionQuestions: feedbackDetails.feedback?.comprehensionQuestions,
                  comprehensionAnswers: feedbackDetails.feedback?.comprehensionAnswers,
                  comprehensionPercentage: feedbackDetails.feedback?.comprehensionPercentage
                }}
                pixelText={pixelText}
                pixelHeading={pixelHeading}
              />
            )}
            
            {/* Grammar & Vocabulary Tab */}
            {activeTab === 1 && (
              <GrammarVocabResultsView 
                grammarData={{
                  grammarBreakdown: feedbackDetails.grammarBreakdown || {},
                  grammarStreak: feedbackDetails.grammarStreak || 0
                }}
                vocabularyData={{
                  score: feedbackDetails.vocabularyScore || 0,
                  usedWords: feedbackDetails.usedWords || [],
                  usedAdvancedWords: feedbackDetails.usedAdvancedWords || []
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

export default StudentFeedbackPage;