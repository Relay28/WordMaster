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
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Chip,
  Container,
  Grid,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import { Edit, Delete, Save, Cancel, Person, ArrowBack, Class, Description, Add, PersonRemove } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import { useClassroomDetails } from './ClassroomDetailFunctions';
import { useNavigate, useLocation } from 'react-router-dom';
import ContentList from '../content/ContentList';
import contentService from '../../services/contentService';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import ClassroomDetailHeader from '../Header/ClassroomDetailHeader';
import { useHomePage } from '../Homepage/HomePageFunctions';

const ClassroomDetailsPage = () => {
  const { authChecked, user, getToken, logout, login } = useUserAuth();
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
    handleRemoveStudent,
    isTeacher,
    isClassroomTeacher
  } = useClassroomDetails(authChecked, user, getToken);
  
  const {

      anchorEl,
      handleMenuOpen,
      handleMenuClose,
      handleProfileClick,
      handleLogout,
      displayName,
      roleDisplay,
      avatarInitials
    } = useHomePage(authChecked, user, getToken, logout, login);

  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [contentList, setContentList] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add this line
  const isMobile = window.innerWidth < 768;

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
  }, [classroom, getToken, refreshTrigger]); // Add refreshTrigger here

  const handleCreateContent = () => {
    if (!classroom) return;
    console.log("Navigating to create content with classroom:", classroom.id); // Debug logging
    navigate(`/content/upload?classroomId=${classroom.id}`);
  };

  // Update the handleGenerateAIContent function
  const handleGenerateAIContent = () => {
    if (!classroom) return;
    navigate(`/content/ai-generate?classroomId=${classroom.id}&studentCount=${classroom.studentCount}`, {
      state: { 
        returnTo: `/classroom/${classroom.id}`,
        refreshOnReturn: true,
        studentCount: classroom.studentCount // Pass student count in state too
      }
    });
  };

  const handleEditContent = (contentId) => {
    navigate(`/content/edit/${contentId}?classroomId=${classroom?.id}`);
  };

  const handleViewContent = (contentId) => {
        navigate(`/content/${contentId}`);    
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
        try {
          const token = await getToken();
          await contentService.publishContent(contentId, token);
          // Redirect to waiting room after successful publish
          navigate(`/waiting-room/${contentId}`);
        } catch (error) {
          console.error("Error publishing content:", error);
          // Handle error
        }

      }
      
      setContentList(contentList.map(item => 
        item.id === contentId ? updatedContent : item
      ));
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setContentError("Failed to update content status. Please try again.");
    }
  };

  // Check for state when component mounts or updates
  useEffect(() => {
    if (location.state?.refreshOnReturn) {
      setRefreshTrigger(prev => prev + 1);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      height: '100vh', // Use fixed height instead of minHeight
      overflow: 'hidden',
      background: `
        linear-gradient(to bottom, 
          rgba(249, 249, 249, 10) 0%, 
          rgba(249, 249, 249, 10) 40%, 
          rgba(249, 249, 249, 0.1) 100%),
        url(${picbg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: 'pixelated',
    }}>
      {/* Header */}
      <ClassroomDetailHeader 
        displayName={displayName}
        roleDisplay={roleDisplay}
        avatarInitials={avatarInitials}
        user={user}
        anchorEl={anchorEl}
        isMobile={isMobile}
        pixelText={pixelText}
        pixelHeading={pixelHeading}
        handleMenuOpen={handleMenuOpen}
        handleMenuClose={handleMenuClose}
        handleProfileClick={handleProfileClick}
        handleLogout={handleLogout}
      />

<Box sx={{ 
      flex: 1,
      width: '100%',
      overflow: 'auto',
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
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1,  }}>
        {/* Error display */}
        {error && (
          <Box mb={3}>
            <Alert severity="error" onClose={() => setError(null)} sx={pixelText}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Classroom Info Section */}
        <Paper elevation={0} sx={{ 
          p: 3, 
          mb: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '4px solid #5F4B8B',
          
          borderRadius: '6px',
          position: 'relative',
            '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
          opacity: 0.8
      },
        }}>
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
                  InputProps={{ style: pixelText }}
                  InputLabelProps={{ style: pixelText }}
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
                  InputProps={{ style: pixelText }}
                  InputLabelProps={{ style: pixelText }}
                />
              </Box>
            ) : (
              <Box>
                <Typography sx={{ ...pixelHeading, fontSize: isMobile ? '16px' : '20px', mb: 1 }}>
                  {classroom.name}
                </Typography>
                {classroom.description && (
                  <Typography sx={{ ...pixelText, color: '#4a5568' }}>
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
                      sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                    >
                      <Save />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => setEditMode(false)}
                      disabled={loading}
                      sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                    >
                      <Cancel />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton 
                      color="primary" 
                      onClick={() => setEditMode(true)}
                      sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={handleDeleteClassroom}
                      disabled={loading}
                      sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2.5, borderColor: 'rgba(95, 75, 139, 0.3)' }} />

          <Grid container spacing={3} sx={{ mt: 1, mb: 0.3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Class sx={{ color: '#5F4B8B', fontSize: '20px' }} />
              <Typography sx={{ ...pixelText }}>
                <strong>CODE:</strong> {classroom.enrollmentCode}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Person sx={{ color: '#5F4B8B', fontSize: '20px' }} />
              <Typography sx={{ ...pixelText }}>
                <strong>TEACHER:</strong> {classroom.teacher.fname} {classroom.teacher.lname}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Description sx={{ color: '#5F4B8B', fontSize: '20px' }} />
              <Typography sx={{ ...pixelText }}>
                <strong>STUDENTS:</strong> {classroom.studentCount}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        </Paper>

        {/* Tabs for Members and Content */}
        <Paper elevation={0} sx={{ 
          p: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '4px solid #5F4B8B',
          borderRadius: '6px',
          position: 'relative',
           '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
              opacity: 0.8
          },
          
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
              '& .MuiTabs-indicator': { backgroundColor: '#5F4B8B' },
              '& .MuiTab-root': { ...pixelHeading, fontSize: isMobile ? '10px' : '12px', },
              '& .Mui-selected': { color: '#5F4B8B !important' }
            }}
          >
            <Tab label="MEMBERS" />
            <Tab label="LEARNING CONTENT" />
          </Tabs>

          {/* Members Tab */}
          {tabValue === 0 && (
            <Box>
              {/* <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                
                <Chip 
                  label={`${classroom.studentCount + 1} TOTAL`} 
                  color="primary"
                  size="small"
                  sx={{pixelText, fontSize: isMobile ? '10px' : '12px',}}
                />
              </Box>
              <Divider sx={{ mb: 2, borderColor: 'rgba(95, 75, 139, 0.3)' }} />
               */}
              {/* Teacher Card */}
              <List>
                <ListItem sx={{ 
                  backgroundColor: 'rgba(95, 75, 139, 0.1)',
                  borderRadius: '4px',
                  mb: 1
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#5F4B8B' }}>
                      {classroom.teacher.fname?.charAt(0)}{classroom.teacher.lname?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ ...pixelText, fontWeight: 'bold' }}>
                        {`${classroom.teacher.fname} ${classroom.teacher.lname}`}
                      </Typography>
                    }
                    secondary={
                      <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                        TEACHER
                      </Typography>
                    }
                  />
                  <Chip 
                    label="OWNER" 
                    color="primary" 
                    size="small" 
                    sx={{ 
                      ...pixelText,
                      fontSize: '8px',
                      height: '20px'
                    }} 
                  />
                </ListItem>

                {/* Students List */}
                {members.length > 0 ? (
                  members.map((member) => (
                    <ListItem 
                      key={member.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(95, 75, 139, 0.05)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#6c63ff' }}>
                          {member.fname?.charAt(0)}{member.lname?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ ...pixelText }}>
                            {`${member.fname} ${member.lname}`}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                            STUDENT
                          </Typography>
                        }
                      />
                      {isClassroomTeacher && (
                        <ListItemSecondaryAction>
                          <Tooltip title="Remove student">
                            <IconButton 
                              edge="end" 
                              onClick={() => handleRemoveStudent(member.id)}
                              sx={{
                                color: '#ff5252',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  backgroundColor: 'rgba(255, 82, 82, 0.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <PersonRemove />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))
                ) : (
                  <Typography sx={{ ...pixelText, color: 'text.secondary', p: 2 }}>
                    NO STUDENTS ENROLLED YET
                  </Typography>
                )}
              </List>
            </Box>
          )}

          {/* Content Tab */}
          {tabValue === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      
                
                {isClassroomTeacher && (
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleCreateContent}
                      sx={{
                        ...pixelButton,
                        backgroundColor: '#5F4B8B',
                        '&:hover': { 
                          backgroundColor: '#4a3a6d',
                          transform: 'translateY(-2px)'
                        },
                        boxShadow: '0 4px 0 #4a3a6d',
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 0 #4a3a6d'
                        },
                        transition: 'all 0.2s ease',
                        height: '32px'
                      }}
                    >
                      CREATE
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleGenerateAIContent}
                      sx={{
                        ...pixelButton,
                        backgroundColor: '#6c63ff',
                        '&:hover': { 
                          backgroundColor: '#5a52e0',
                          transform: 'translateY(-2px)'
                        },
                        boxShadow: '0 4px 0 #5a52e0',
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 0 #5a52e0'
                        },
                        transition: 'all 0.2s ease',
                        height: '32px'
                      }}
                    >
                      AI GENERATE
                    </Button>
                  </Box>
                )}
              </Box>
              
              {contentError && (
                <Alert severity="error" sx={{ mb: 2, ...pixelText }} onClose={() => setContentError(null)}>
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
                    backgroundColor: 'rgba(245, 245, 247, 0.7)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography sx={{ ...pixelHeading, color: 'text.secondary', mb: 1 }}>
                    NO CONTENT AVAILABLE
                  </Typography>
                  <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 3 }}>
                    CREATE YOUR FIRST CONTENT
                  </Typography>
                  {isClassroomTeacher && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleCreateContent}
                      sx={{
                        ...pixelButton,
                        backgroundColor: '#5F4B8B',
                        '&:hover': { 
                          backgroundColor: '#4a3a6d',
                          transform: 'translateY(-2px)'
                        },
                        boxShadow: '0 4px 0 #4a3a6d',
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 0 #4a3a6d'
                        },
                        transition: 'all 0.2s ease',
                        height: '32px'
                      }}
                    >
                      CREATE CONTENT
                    </Button>
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
                  pixelText={pixelText}
                  pixelHeading={pixelHeading}
                />
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
    </Box>
  );
};

export default ClassroomDetailsPage;