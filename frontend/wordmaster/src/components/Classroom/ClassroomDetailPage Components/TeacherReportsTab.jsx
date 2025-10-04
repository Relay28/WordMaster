import React from 'react';
import { Box, Typography, Paper, Grid, Divider, Button, IconButton, CircularProgress, Alert, Avatar, Chip } from '@mui/material';
import { ChevronLeft, DeleteOutline, Download } from '@mui/icons-material';
import defaultProfile from '../../../assets/defaultprofile.png';
import { useProfilePicture } from '../../utils/ProfilePictureManager';

// Separate component for profile picture to properly use hooks
const ProfilePicture = ({ profilePicture, studentName }) => {
  const profilePic = useProfilePicture(profilePicture);
  
  return (
    <Avatar 
      src={profilePic || defaultProfile}
      sx={{ bgcolor: '#6c63ff', width: 30, height: 30, mr: 1, fontSize: '12px' }}
    >
      {!profilePic && !defaultProfile && studentName.split(' ').map(n => n[0]).join('')}
    </Avatar>
  );
};

const TeacherReportsTab = ({
  pixelText,
  pixelHeading,
  pixelButton,
  publishedContent = [],
  showContentList,
  selectedContent,
  completedSessions = [],
  loadingCompletedSessions,
  sessionsError,
  selectedSession,
  studentReports = [],
  loadingReports,
  handleContentSelect,
  handleBackToContentList,
  fetchStudentReports,
  handleDeleteSession,
  handleExportReports,
  navigate
}) => {
  return (
    <Box>
      {showContentList ? (
        <>
          <Typography sx={{ ...pixelText, mb: 2 }}>SELECT CONTENT TO VIEW GAME SESSIONS:</Typography>
          {publishedContent.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(245, 245, 247, 0.7)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 1, fontSize: '14px' }}>
                NO PUBLISHED CONTENT AVAILABLE
              </Typography>
              <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 3 }}>
                PUBLISH CONTENT FIRST TO VIEW STUDENT REPORTS
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {publishedContent.map(content => (
                <Grid item xs={12} sm={6} md={4} key={content.id}>
                  <Paper
                    elevation={1}
                    sx={{ p: 2, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 10px rgba(95, 75, 139, 0.15)' } }}
                    onClick={() => handleContentSelect(content)}
                  >
                    <Typography sx={{ ...pixelHeading, fontSize: '14px', color: '#5F4B8B', mb: 1 }}>
                      {content.title}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography sx={{ ...pixelText, fontSize: '11px', fontWeight: 'bold' }}>{content.contentType}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography sx={{ ...pixelText, fontSize: '11px' }}>Published:</Typography>
                      <Typography sx={{ ...pixelText, fontSize: '11px' }}>{new Date(content.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                    <Button fullWidth variant="outlined" size="small" onClick={e => { e.stopPropagation(); handleContentSelect(content); }} sx={{ ...pixelButton, fontSize: '10px', mt: 1, borderColor: '#5F4B8B', color: '#5F4B8B', '&:hover': { backgroundColor: 'rgba(95, 75, 139, 0.1)' } }}>VIEW SESSIONS</Button>
                    <Button fullWidth variant="contained" size="small" startIcon={<Download />} onClick={e => { e.stopPropagation(); handleExportReports(content); }} sx={{ ...pixelButton, fontSize: '10px', mt: 1, backgroundColor: '#6c63ff', '&:hover': { backgroundColor: '#5a52e0' } }}>EXPORT REPORTS</Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        <>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={handleBackToContentList} sx={{ ...pixelButton, color: '#5F4B8B', backgroundColor: 'rgba(255, 255, 255, 0.7)', border: '2px solid #5F4B8B', borderRadius: '4px', width: '32px', height: '32px', mr: 2, '&:hover': { backgroundColor: 'rgba(95, 75, 139, 0.1)', transform: 'translateY(-1px)' }, transition: 'all 0.2s ease' }}>
              <ChevronLeft sx={{ fontSize: '16px' }} />
            </IconButton>
            <Typography sx={{ ...pixelText }}>{selectedContent?.title} - GAME SESSIONS</Typography>
          </Box>
          {loadingCompletedSessions ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : sessionsError ? (
            <Alert severity="error" sx={{ mb: 2, ...pixelText }}>{sessionsError}</Alert>
          ) : completedSessions.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(245, 245, 247, 0.7)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography sx={{ ...pixelHeading, color: 'text.secondary', mb: 1 }}>NO GAME SESSIONS AVAILABLE</Typography>
              <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 3 }}>STUDENTS HAVEN'T PLAYED THIS CONTENT YET</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {completedSessions.map(session => (
                <Grid item xs={12} sm={6} md={4} key={session.id}>
                  <Paper elevation={selectedSession === session.id ? 3 : 1} sx={{ p: 2, cursor: 'pointer', border: selectedSession === session.id ? '2px solid #5F4B8B' : '1px solid rgba(0,0,0,0.12)', transition: 'all 0.2s ease', position: 'relative', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 10px rgba(95, 75, 139, 0.15)' } }} onClick={() => fetchStudentReports(session.id)}>
                    <Typography sx={{ ...pixelHeading, fontSize: '13px', color: '#5F4B8B', mb: 2 }}>Session #{session.id}</Typography>
                    <Typography sx={{ ...pixelText, fontSize: '11px' }}>Date: {new Date(session.createdAt || session.startedAt).toLocaleDateString()}</Typography>
                    <Typography sx={{ ...pixelText, fontSize: '11px' }}>Players: {session.playerCount || session.players?.length || 0}</Typography>
                    <Typography sx={{ ...pixelText, fontSize: '11px' }}>Status: {session.status || 'Completed'}</Typography>
                    <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, color: '#ff5252', '&:hover': { backgroundColor: 'rgba(255, 82, 82, 0.1)' } }} onClick={e => handleDeleteSession(session.id, e)}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
          {selectedSession && (
            <>
              <Typography sx={{ ...pixelHeading, mt: 4, mb: 2 }}>STUDENT REPORTS:</Typography>
              {loadingReports ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : studentReports.length === 0 ? (
                <Typography sx={{ ...pixelText, color: 'text.secondary' }}>NO STUDENT DATA AVAILABLE FOR THIS SESSION</Typography>
              ) : (
                <Grid container spacing={2}>
                  {studentReports.map(student => (
                    <Grid item xs={12} sm={6} md={4} key={student.userId}>
                      <Paper elevation={1} sx={{ p: 2, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 10px rgba(95, 75, 139, 0.15)' } }} onClick={() => navigate(`/student-report/${selectedSession}/${student.userId}`)}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <ProfilePicture 
                            profilePicture={student.profilePicture} 
                            studentName={student.name} 
                          />
                          <Typography sx={{ ...pixelText, fontWeight: 'bold' }}>{student.name}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography sx={{ ...pixelText, fontSize: '11px' }}>Role:</Typography>
                          <Typography sx={{ ...pixelText, fontSize: '11px', color: '#5F4B8B' }}>{student.role || 'N/A'}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography sx={{ ...pixelText, fontSize: '11px' }}>Score:</Typography>
                          <Typography sx={{ ...pixelText, fontSize: '11px', fontWeight: 'bold' }}>{student.totalScore}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography sx={{ ...pixelText, fontSize: '11px' }}>Feedback:</Typography>
                          <Chip size="small" label={student.hasFeedback ? 'PROVIDED' : 'NEEDED'} color={student.hasFeedback ? 'success' : 'warning'} sx={{ height: '18px', '& .MuiChip-label': { ...pixelText, fontSize: '9px', px: 1 } }} />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default TeacherReportsTab;
