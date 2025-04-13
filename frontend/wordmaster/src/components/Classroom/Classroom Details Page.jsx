// src/pages/ClassroomDetailsPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Chip,
  Container,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import { Edit, Delete, Save, Cancel, Person, ArrowBack, Class, Description, Add } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import { useClassroomDetails } from './ClassroomDetailFunctions';
import { useNavigate } from 'react-router-dom';
import ContentList from '../content/ContentList';
import contentService from '../../services/contentService';

const ClassroomDetailsPage = () => {
  const { authChecked, user, getToken } = useUserAuth();
  const {
    loading,
    error,
    classroom,
    members,
    editMode,
    updatedData,
    setEditMode,
    handleDataChange,
    handleUpdateClassroom,
    handleDeleteClassroom,
    isTeacher,
    isClassroomTeacher
  } = useClassroomDetails(authChecked, user, getToken);
  
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [contentList, setContentList] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState(null);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch classroom content
  useEffect(() => {
    const fetchClassroomContent = async () => {
      if (!classroom) return;
      
      console.log("Fetching content for classroom ID:", classroom.id); // Debug logging
      
      setLoadingContent(true);
      try {
        const token = await getToken();
        const data = await contentService.getContentByClassroom(classroom.id, token);
        console.log("Classroom content data:", data); // Debug logging
        setContentList(data);
        setContentError(null);
      } catch (err) {
        console.error("Error loading classroom content:", err);
        setContentError("Failed to load content for this classroom.");
      } finally {
        setLoadingContent(false);
      }
    };

    fetchClassroomContent();
  }, [classroom, getToken]);

  const handleCreateContent = () => {
    if (!classroom) return;
    console.log("Navigating to create content with classroom:", classroom.id); // Debug logging
    navigate(`/content/upload?classroomId=${classroom.id}`);
  };

  const handleEditContent = (contentId) => {
    navigate(`/content/edit/${contentId}?classroomId=${classroom?.id}`);
  };

  const handleViewContent = (contentId) => {
    navigate(`/content/${contentId}?classroomId=${classroom?.id}`);
  };

  const handleDeleteContent = async (contentId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this content?")) return;
      
      const token = await getToken();
      await contentService.deleteContent(contentId, token);
      setContentList(contentList.filter(item => item.id !== contentId));
    } catch (err) {
      console.error("Error deleting content:", err);
      setContentError("Failed to delete content. Please try again.");
    }
  };

  const handlePublishToggle = async (contentId, currentStatus) => {
    try {
      const token = await getToken();
      let updatedContent;
      
      if (currentStatus) {
        updatedContent = await contentService.unpublishContent(contentId, token);
      } else {
        updatedContent = await contentService.publishContent(contentId, token);
      }
      
      setContentList(contentList.map(item => 
        item.id === contentId ? updatedContent : item
      ));
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setContentError("Failed to update content status. Please try again.");
    }
  };

  if (!authChecked || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!classroom) {
    return (
      <Box p={4}>
        <Alert severity="error">{error || 'Classroom not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9'
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2,
        px: { xs: 2, md: 6 }
      }}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/homepage')} sx={{ mr: 2 }}> 
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
            Classroom Details
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Error display */}
        {error && (
          <Box mb={3}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Classroom Info Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            {editMode ? (
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  name="name"
                  label="Class Name"
                  value={updatedData.name}
                  onChange={handleDataChange}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={updatedData.description}
                  onChange={handleDataChange}
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="h3" component="h1" gutterBottom>
                  {classroom.name}
                </Typography>
                {classroom.description && (
                  <Typography variant="body1" paragraph>
                    {classroom.description}
                  </Typography>
                )}
              </Box>
            )}
            
            {isClassroomTeacher && (
              <Box>
                {editMode ? (
                  <>
                    <IconButton 
                      color="primary" 
                      onClick={handleUpdateClassroom}
                      disabled={loading}
                    >
                      <Save />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => setEditMode(false)}
                      disabled={loading}
                    >
                      <Cancel />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton 
                      color="primary" 
                      onClick={() => setEditMode(true)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={handleDeleteClassroom}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Class color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Enrollment Code:</strong> {classroom.enrollmentCode}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Person color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Teacher:</strong> {classroom.teacher.fname} {classroom.teacher.lname}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Description color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Students:</strong> {classroom.studentCount}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs for Members and Content */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
              '& .MuiTabs-indicator': { backgroundColor: '#5F4B8B' },
              '& .Mui-selected': { color: '#5F4B8B !important' }
            }}
          >
            <Tab label="Members" />
            <Tab label="Learning Content" />
          </Tabs>

          {/* Members Tab */}
          {tabValue === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Members</Typography>
                <Chip 
                  label={`${classroom.studentCount + 1} total`} 
                  color="primary"
                  size="small"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {/* Teacher Card */}
              <List>
                <ListItem sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <ListItemAvatar>
                    <Avatar>
                      {classroom.teacher.fname?.charAt(0)}{classroom.teacher.lname?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${classroom.teacher.fname} ${classroom.teacher.lname}`}
                    secondary="Teacher"
                  />
                  <Chip label="Owner" color="primary" size="small" />
                </ListItem>

                {/* Students List */}
                {members.length > 0 ? (
                  members.map((member) => (
                    <ListItem key={member.id}>
                      <ListItemAvatar>
                        <Avatar>
                          {member.fname?.charAt(0)}{member.lname?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${member.fname} ${member.lname}`}
                        secondary="Student"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                    No students enrolled yet
                  </Typography>
                )}
              </List>
            </Box>
          )}

          {/* Content Tab */}
          {tabValue === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Learning Content</Typography>
                
                {isClassroomTeacher && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateContent}
                    sx={{
                      backgroundColor: '#5F4B8B',
                      '&:hover': { backgroundColor: '#4a3a6d' },
                      textTransform: 'none',
                      borderRadius: '8px',
                    }}
                  >
                    Create Content
                  </Button>
                )}
              </Box>
              
              {contentError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setContentError(null)}>
                  {contentError}
                </Alert>
              )}
              
              {loadingContent ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : contentList.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '12px'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No content available yet
                  </Typography>
                  {isClassroomTeacher && (
                    <>
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        Create your first content for this classroom
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateContent}
                        sx={{
                          backgroundColor: '#5F4B8B',
                          '&:hover': { backgroundColor: '#4a3a6d' },
                          textTransform: 'none',
                          borderRadius: '8px',
                        }}
                      >
                        Create Content
                      </Button>
                    </>
                  )}
                </Paper>
              ) : (
                <ContentList 
                  content={contentList}
                  onEdit={handleEditContent}
                  onView={handleViewContent}
                  onDelete={handleDeleteContent}
                  onPublishToggle={handlePublishToggle}
                  disableActions={!isClassroomTeacher}
                />
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ClassroomDetailsPage;