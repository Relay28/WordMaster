import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  CircularProgress, 
  Alert, 
  Paper,
  Divider,
  Grid,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import contentService from '../../services/contentService';
import ContentList from './ContentList';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import HomepageHeader from '../Header/HomepageHeader';
import { useHomePage } from '../Homepage/HomePageFunctions';

const ContentDashboard = () => {
  const { user, getToken, login, logout, authChecked } = useUserAuth();
  const {
    handleMenuOpen,
    handleMenuClose,
    handleProfileClick,
    handleLogout,
    anchorEl,
    displayName,
    roleDisplay,
    avatarInitials
  } = useHomePage(authChecked, user, getToken, login, logout);
  
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [content, setContent] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('all');
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [contentFilter, setContentFilter] = useState('all'); // 'all', 'published', 'drafts'

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
    loadContent();
    
    if (location.state?.message) {
      setNotification({
        open: true,
        message: location.state.message,
        severity: location.state.success ? 'success' : 'error'
      });
      window.history.replaceState({}, document.title);
    }
  }, [contentFilter, location.state]);

  useEffect(() => {
    const fetchUserClassrooms = async () => {
      if (!user) return;
      
      setLoadingClassrooms(true);
      try {
        const token = await getToken();
        const response = await fetch('/api/classrooms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setClassrooms(data);
        }
      } catch (err) {
        console.error("Error loading classrooms:", err);
      } finally {
        setLoadingClassrooms(false);
      }
    };

    fetchUserClassrooms();
  }, [user, getToken]);

  const loadContent = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      let data;
      
      if (selectedClassroom !== 'all') {
        data = await contentService.getContentByClassroom(selectedClassroom, token);
      } else {
        data = await contentService.getContentByCreator(token);
      }
      
      if (contentFilter === 'published') {
        data = data.filter(item => item.published);
      } else if (contentFilter === 'drafts') {
        data = data.filter(item => !item.published);
      }
      
      const now = new Date();
      if (selectedTimeFrame !== 'all') {
        data = data.filter(item => {
          const createdAt = new Date(item.createdAt);
          switch (selectedTimeFrame) {
            case 'week':
              return (now - createdAt) <= 7 * 24 * 60 * 60 * 1000;
            case 'month':
              return (now - createdAt) <= 30 * 24 * 60 * 60 * 1000;
            case 'year':
              return createdAt.getFullYear() === now.getFullYear();
            default:
              return true;
          }
        });
      }
      
      setContent(data);
    } catch (err) {
      console.error("Error loading content:", err);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [selectedClassroom, selectedTimeFrame]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      await contentService.deleteContent(id, token);
      
      // Remove the deleted item from the state
      setContent(prevContent => prevContent.filter(item => item.id !== id));
      setNotification({
        open: true,
        message: 'Content deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error("Error deleting content:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete content. Please try again.";
      setNotification({
        open: true, 
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (id, currentStatus) => {
    try {
      const token = await getToken();
      let updatedContent;
      
      if (currentStatus) {
        updatedContent = await contentService.unpublishContent(id, token);
        setNotification({
          open: true,
          message: 'Content unpublished successfully',
          severity: 'info'
        });
      } else {
        updatedContent = await contentService.publishContent(id, token);
        setNotification({
          open: true,
          message: 'Content published successfully',
          severity: 'success'
        });
      }
      
      setContent(content.map(item => item.id === id ? updatedContent : item));
    } catch (err) {
      console.error("Error updating publish status:", err);
      setError("Failed to update content status. Please try again.");
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ 
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  margin: 0,
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
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
      <HomepageHeader 
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
      <Container maxWidth="xl" sx={{ py: 4, flex: 1, px: { xs: 2, sm: 3, md: 4 }, maxWidth: '170vh !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography sx={{ 
            ...pixelHeading,
            color: '#2d3748',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 'bold'
          }}>
            Content Dashboard
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Add sx={{ 
                fontSize: isMobile ? '12px' : '14px',
                filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
              }} />}
              onClick={() => navigate('/content/upload')}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4px',
                px: 3,
                py: 1,
                minWidth: isMobile ? 'auto' : '140px',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
              }}
            >
              Upload Content
            </Button>
            <Button
              variant="contained"
              startIcon={<Add sx={{ 
                fontSize: isMobile ? '12px' : '14px',
                filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
              }} />}
              onClick={() => navigate('/content/ai-generate')}
              sx={{
                ...pixelButton,
                backgroundColor: '#6c63ff',
                '&:hover': { 
                  backgroundColor: '#5a52e0',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4px',
                px: 3,
                py: 1,
                minWidth: isMobile ? 'auto' : '140px',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
              }}
            >
              AI Generate
            </Button>
          </Box>
        </Box>
        {/* Filter Section */}
        <Box 
          sx={{ 
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            pt: 3,
            pl: 3,
            pb: 2,
            mb: 3,
            border: '2px solid rgba(95, 75, 139, 0.2)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
        >
          <Grid container spacing={3}>
            {/* Content Status Section */}
            <Grid item xs={12}>
              <Typography 
                sx={{ 
                  ...pixelHeading, 
                  color: '#5F4B8B',
                  mb: 2,
                  pt: 1.4,
                  textAlign: 'center',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
                }}
              >
                FILTER OPTIONS
              </Typography>
            </Grid>
            
            {/* Status Chips */}
            <Grid item xs={12} sx={{ mb: 3 }}>
              <Box 
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                  flexWrap: 'wrap'
                }}
              >
                <Chip
                  label="All Content"
                  clickable
                  onClick={() => setContentFilter('all')}
                  sx={{
                    ...pixelText,
                    backgroundColor: contentFilter === 'all' ? '#5F4B8B' : 'rgba(95, 75, 139, 0.1)',
                    color: contentFilter === 'all' ? 'white' : '#5F4B8B',
                    padding: '20px 24px',
                    '&:hover': {
                      backgroundColor: contentFilter === 'all' ? '#4a3a6d' : 'rgba(95, 75, 139, 0.2)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: contentFilter === 'all' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                  }}
                />
                <Chip
                  label="Published"
                  clickable
                  onClick={() => setContentFilter('published')}
                  sx={{
                    ...pixelText,
                    backgroundColor: contentFilter === 'published' ? '#5F4B8B' : 'rgba(95, 75, 139, 0.1)',
                    color: contentFilter === 'published' ? 'white' : '#5F4B8B',
                    padding: '20px 24px',
                    '&:hover': {
                      backgroundColor: contentFilter === 'published' ? '#4a3a6d' : 'rgba(95, 75, 139, 0.2)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: contentFilter === 'published' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                  }}
                />
                <Chip
                  label="Drafts"
                  clickable
                  onClick={() => setContentFilter('drafts')}
                  sx={{
                    ...pixelText,
                    backgroundColor: contentFilter === 'drafts' ? '#5F4B8B' : 'rgba(95, 75, 139, 0.1)',
                    color: contentFilter === 'drafts' ? 'white' : '#5F4B8B',
                    padding: '20px 24px',
                    '&:hover': {
                      backgroundColor: contentFilter === 'drafts' ? '#4a3a6d' : 'rgba(95, 75, 139, 0.2)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: contentFilter === 'drafts' ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                  }}
                />
              </Box>
            </Grid>

            {/* Dropdown Filters */}
            <Grid container item spacing={2} xs={12} justifyContent="center">
              <Grid item xs={12} md={5}>
                <FormControl fullWidth>
                  <InputLabel sx={{ ...pixelText, color: '#5F4B8B' }}>
                    Classroom
                  </InputLabel>
                  <Select
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    label="Classroom"
                    sx={{
                      ...pixelText,
                      '& .MuiSelect-select': {
                        py: 1.5
                      },
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)'
                      },
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <MenuItem value="all" sx={pixelText}>All Classrooms</MenuItem>
                    {classrooms.map((classroom) => (
                      <MenuItem key={classroom.id} value={classroom.id} sx={pixelText}>
                        {classroom.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={5}>
                <FormControl fullWidth>
                  <InputLabel sx={{ ...pixelText, color: '#5F4B8B' }}>
                    Time Period
                  </InputLabel>
                  <Select
                    value={selectedTimeFrame}
                    onChange={(e) => setSelectedTimeFrame(e.target.value)}
                    label="Time Period"
                    sx={{
                      ...pixelText,
                      '& .MuiSelect-select': {
                        py: 1.5
                      },
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)'
                      },
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <MenuItem value="all" sx={pixelText}>All Time</MenuItem>
                    <MenuItem value="week" sx={pixelText}>Last 7 Days</MenuItem>
                    <MenuItem value="month" sx={pixelText}>Last 30 Days</MenuItem>
                    <MenuItem value="year" sx={pixelText}>This Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, '& .MuiAlert-message': pixelText }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: '#5F4B8B' }} />
          </Box>
        ) : content.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: '12px',
              p: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
              NO CONTENT FOUND
            </Typography>
            <Typography sx={{ ...pixelText, color: '#4a5568', mb: 3 }}>
              UPLOAD YOUR FIRST CONTENT TO GET STARTED
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: isMobile ? '12px' : '14px' }} />}
              onClick={() => navigate('/content/upload')}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4px',
                px: 3,
                py: 1,
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
              }}
            >
              UPLOAD CONTENT
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3} sx={{pl: 4.5}}>
    <Grid item xs={12} md={5}>
      <ContentList 
        content={content.filter((_, index) => index % 2 === 0)}
        onEdit={(id) => navigate(`/content/edit/${id}`)}
        onView={(id) => navigate(`/content/${id}`)}
        onDelete={handleDelete}
        onPublishToggle={handlePublishToggle}
        pixelText={pixelText}
        pixelHeading={pixelHeading}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <ContentList 
        content={content.filter((_, index) => index % 2 === 1)}
        onEdit={(id) => navigate(`/content/edit/${id}`)}
        onView={(id) => navigate(`/content/${id}`)}
        onDelete={handleDelete}
        onPublishToggle={handlePublishToggle}
        pixelText={pixelText}
        pixelHeading={pixelHeading}
      />
    </Grid>
  </Grid>
        )}
      </Container>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': pixelText,
            backgroundColor: notification.severity === 'success' ? '#4caf50' : 
                           notification.severity === 'error' ? '#f44336' : '#2196f3',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
    </Box>
  );
};

export default ContentDashboard;