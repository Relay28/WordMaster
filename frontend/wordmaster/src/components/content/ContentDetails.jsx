import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import { 
  ArrowBack, 
  Edit, 
  Delete, 
  Publish, 
  Unpublished,
  CalendarToday,
  Update,
  Group,
  AccessTime,
  LoopRounded
} from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import contentService from '../../services/contentService';

// Fallback date formatter in case date-fns isn't available
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // Try to use date-fns if available
    const { format } = require('date-fns');
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    // Fallback to basic JS date formatting
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

const ContentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUserAuth();
  
  const [content, setContent] = useState(null);
  const [parsedContent, setParsedContent] = useState({
    wordBank: [],
    roles: [],
    backgroundImage: null,
    studentsPerGroup: 10,
    timePerTurn: 30,
    turnCycles: 3
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await contentService.getContentById(id, token);
      setContent(data);

      // Parse the JSON data
      try {
        let contentData = {};
        let gameConfig = {};
        
        if (data.contentData && data.contentData !== '{}') {
          contentData = JSON.parse(data.contentData);
        }
        
        if (data.gameElementConfig && data.gameElementConfig !== '{}') {
          gameConfig = JSON.parse(data.gameElementConfig);
        }
        
        setParsedContent({
          wordBank: contentData.wordBank || [],
          roles: contentData.roles || [],
          backgroundImage: contentData.backgroundImage || null,
          studentsPerGroup: gameConfig.studentsPerGroup || 10,
          timePerTurn: gameConfig.timePerTurn || 30,
          turnCycles: gameConfig.turnCycles || 3
        });
      } catch (err) {
        console.error("Error parsing JSON:", err);
        setError("Could not parse content data correctly. Some information may be missing.");
      }
    } catch (err) {
      console.error("Error loading content:", err);
      setError("Failed to load content details.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const token = await getToken();
      await contentService.deleteContent(id, token);
      navigate('/content/dashboard', {
        state: {
          message: 'Content deleted successfully',
          success: true
        }
      });
    } catch (err) {
      console.error("Error deleting content:", err);
      setError("Failed to delete content. Please try again.");
    }
  };

  const handlePublishToggle = async () => {
    try {
      const token = await getToken();
      let updatedContent;
      
      if (content.published) {
        updatedContent = await contentService.unpublishContent(id, token);
      } else {
        updatedContent = await contentService.publishContent(id, token);
      }
      
      setContent(updatedContent);
    } catch (err) {
      console.error("Error updating publish status:", err);
      setError("Failed to update content status. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#5F4B8B' }} />
      </Box>
    );
  }

  if (!content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Content not found or you don't have permission to view it.</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/content/dashboard')}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Container>
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
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate('/content/dashboard')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight="bold" color="#5F4B8B">
              Scenario Details
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={content.published ? <Unpublished /> : <Publish />}
              onClick={handlePublishToggle}
              sx={{
                borderColor: content.published ? '#f57c00' : '#0a8043',
                color: content.published ? '#f57c00' : '#0a8043',
                mr: 2,
                '&:hover': { 
                  backgroundColor: content.published ? '#fff8e1' : '#e6f7ed',
                  borderColor: content.published ? '#f57c00' : '#0a8043'
                },
                textTransform: 'none',
                borderRadius: '8px'
              }}
            >
              {content.published ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate(`/content/edit/${id}`)}
              sx={{
                borderColor: '#5F4B8B',
                color: '#5F4B8B',
                mr: 2,
                '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
                textTransform: 'none',
                borderRadius: '8px'
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={handleDelete}
              sx={{
                borderColor: '#d32f2f',
                color: '#d32f2f',
                '&:hover': { backgroundColor: '#ffeaea', borderColor: '#b71c1c' },
                textTransform: 'none',
                borderRadius: '8px'
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                {content.title}
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <Chip 
                  label={content.published ? 'Published' : 'Draft'} 
                  size="small"
                  sx={{ 
                    backgroundColor: content.published ? '#e6f7ed' : '#f2f2f2',
                    color: content.published ? '#0a8043' : '#666666',
                    fontWeight: 500,
                    mr: 2
                  }}
                />
              </Box>
            </Box>
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday fontSize="small" sx={{ color: '#666', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Created: {content.createdAt ? formatDate(content.createdAt) : 'N/A'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Update fontSize="small" sx={{ color: '#666', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Updated: {content.updatedAt ? formatDate(content.updatedAt) : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {content.description && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {content.description}
              </Typography>
            </>
          )}
        </Paper>
        
        <Paper elevation={0} sx={{ borderRadius: '12px', overflow: 'hidden', mb: 4, backgroundColor: 'white' }}>
          <Box p={3}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Game Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ backgroundColor: '#f9f9f9', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Group sx={{ color: '#5F4B8B', mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Students per Group
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
                      {parsedContent.studentsPerGroup}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ backgroundColor: '#f9f9f9', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <AccessTime sx={{ color: '#5F4B8B', mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Time per Turn
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
                      {parsedContent.timePerTurn} seconds
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ backgroundColor: '#f9f9f9', height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LoopRounded sx={{ color: '#5F4B8B', mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Turn Cycles
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
                      {parsedContent.turnCycles}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, backgroundColor: 'white', height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Roles
              </Typography>
              
              {parsedContent.roles.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {parsedContent.roles.map((role, index) => (
                    <Chip
                      key={index}
                      label={role}
                      sx={{
                        backgroundColor: '#f0edf5',
                        color: '#5F4B8B',
                        m: 0.5
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No roles defined for this scenario.
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, backgroundColor: 'white', height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Word Bank
              </Typography>
              
              {parsedContent.wordBank.length > 0 ? (
                <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  {parsedContent.wordBank.map((word, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        backgroundColor: '#f9f9f9',
                        mb: 1,
                        borderRadius: '8px',
                      }}
                    >
                      <ListItemText primary={word} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No words added to the word bank.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {parsedContent.backgroundImage && (
          <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mt: 4, backgroundColor: 'white' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Background Image
            </Typography>
            
            <Box
              sx={{
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: '100%',
                maxHeight: '400px',
              }}
            >
              <img
                src={parsedContent.backgroundImage}
                alt="Scenario background"
                style={{ width: '100%', objectFit: 'contain' }}
              />
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ContentDetails;
