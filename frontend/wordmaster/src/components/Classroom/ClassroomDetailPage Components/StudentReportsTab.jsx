import React from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Chip, Button, Alert } from '@mui/material';

const StudentReportsTab = ({
  pixelHeading,
  pixelText,
  pixelButton,
  loadingStudentFeedback,
  studentFeedbacks = [],
  feedbackError,
  navigate,
  user
}) => {
  return (
    <Box>
      <Typography sx={{ ...pixelHeading, mb: 2 }}>YOUR FEEDBACK REPORTS</Typography>
      {feedbackError && (
        <Alert severity="error" sx={{ mb: 2, ...pixelText }}>{feedbackError}</Alert>
      )}
      {loadingStudentFeedback ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : studentFeedbacks.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(245, 245, 247, 0.7)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Typography sx={{ ...pixelHeading, color: 'text.secondary', mb: 1 }}>
            NO FEEDBACK AVAILABLE YET
          </Typography>
          <Typography sx={{ ...pixelText, color: 'text.secondary' }}>
            YOUR TEACHER HASN'T PROVIDED ANY FEEDBACK YET
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {studentFeedbacks.map(feedback => (
            <Grid item xs={12} sm={6} md={4} key={feedback.id}>
              <Paper elevation={1} sx={{ p: 2, borderRadius: '8px', transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 10px rgba(95, 75, 139, 0.15)' } }}>
                <Typography sx={{ ...pixelHeading, fontSize: '12px', color: '#5F4B8B', mb: 1 }}>
                  {feedback.gameTitle || 'Game Session'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>Date:</Typography>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>{new Date(feedback.createdAt).toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>Teacher:</Typography>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>{feedback.teacherName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>Overall Grade:</Typography>
                  <Chip label={feedback.overallGrade} color="primary" size="small" sx={{ height: '20px', '& .MuiChip-label': { ...pixelText, fontSize: '8px', px: 1 } }} />
                </Box>
                <Button fullWidth variant="outlined" size="small" onClick={() => navigate(`/student-feedback/${feedback.sessionId}/${user.id}`)} sx={{ ...pixelButton, fontSize: '7px', mt: 1, borderColor: '#5F4B8B', color: '#5F4B8B', '&:hover': { backgroundColor: 'rgba(95, 75, 139, 0.1)' } }}>
                  VIEW DETAILS
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StudentReportsTab;
