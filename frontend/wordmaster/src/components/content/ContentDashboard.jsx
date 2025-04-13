import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab,
  Paper,
  Divider,
  Grid,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import contentService from '../../services/contentService';
import ContentList from './ContentList';

const ContentDashboard = () => {
  const { user, getToken } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
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

  useEffect(() => {
    loadContent();
    
    // Check for status message from navigation state
    if (location.state?.message) {
      setNotification({
        open: true,
        message: location.state.message,
        severity: location.state.success ? 'success' : 'error'
      });
      
      // Clear the navigation state after showing notification
      window.history.replaceState({}, document.title);
    }
  }, [tab, location.state]);

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
        data = await contentService.getContentByCreator(user.id, token);
      }
      
      // Apply tab filters (published/drafts)
      if (tab === 1) {
        data = data.filter(item => item.published);
      } else if (tab === 2) {
        data = data.filter(item => !item.published);
      }
      
      // Apply time frame filters
      const now = new Date();
      if (selectedTimeFrame !== 'all') {
        data = data.filter(item => {
          const createdAt = new Date(item.createdAt);
          switch (selectedTimeFrame) {
            case 'week':
              // Last 7 days
              return (now - createdAt) <= 7 * 24 * 60 * 60 * 1000;
            case 'month':
              // Last 30 days
              return (now - createdAt) <= 30 * 24 * 60 * 60 * 1000;
            case 'year':
              // Current year
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

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const token = await getToken();
      await contentService.deleteContent(id, token);
      setContent(content.filter(item => item.id !== id));
      setNotification({
        open: true,
        message: 'Content deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error("Error deleting content:", err);
      setError("Failed to delete content. Please try again.");
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
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
            WordMaster
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/homepage')}
            sx={{
              borderColor: '#5F4B8B',
              color: '#5F4B8B',
              '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
              textTransform: 'none',
              borderRadius: '8px',
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Content Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/content/upload')}
            sx={{
              backgroundColor: '#5F4B8B',
              '&:hover': { backgroundColor: '#4a3a6d' },
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1
            }}
          >
            Upload New Content
          </Button>
        </Box>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
              <Tabs
                value={tab}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#5F4B8B',
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    px: 4,
                    py: 2,
                    '&.Mui-selected': {
                      color: '#5F4B8B',
                    }
                  },
                  borderBottom: '1px solid #e0e0e0'
                }}
              >
                <Tab label="All Content" />
                <Tab label="Published" />
                <Tab label="Drafts" />
              </Tabs>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Filter by Classroom</InputLabel>
              <Select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                label="Filter by Classroom"
              >
                <MenuItem value="all">All Classrooms</MenuItem>
                {classrooms.map((classroom) => (
                  <MenuItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                Filter to view content specific to a classroom
              </Typography>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                label="Time Period"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                Filter by when content was created
              </Typography>
            </FormControl>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No content found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Upload your first content to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/content/upload')}
              sx={{
                backgroundColor: '#5F4B8B',
                '&:hover': { backgroundColor: '#4a3a6d' },
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                py: 1
              }}
            >
              Upload Content
            </Button>
          </Paper>
        ) : (
          <ContentList 
            content={content}
            onEdit={(id) => navigate(`/content/edit/${id}`)}
            onView={(id) => navigate(`/content/${id}`)}
            onDelete={handleDelete}
            onPublishToggle={handlePublishToggle}
          />
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
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContentDashboard;
