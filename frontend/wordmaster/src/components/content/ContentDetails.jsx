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
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Tooltip
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
  LoopRounded,
  Person
} from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import contentService from '../../services/contentService';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    return 'N/A';
  }
};

const ContentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUserAuth();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await contentService.getContentById(id, token);
      setContent(data);
    } catch (err) {
      console.error("Error loading content:", err);
      setError("Failed to load content details.");
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (content && content.contentData && content.contentData.wordBank) {
      console.log("Word bank items:", content.contentData.wordBank);
    }
  }, [content]);

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

  // Helper function to get image URL
  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    // If it's already a URL or path
    if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
      return imageData;
    }
    // If it's base64 encoded
    return imageData;
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      width: '100%'
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2,
        px: { xs: 2, md: 6 },
        position: 'sticky',
        top: 0,
        zIndex: 1100
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
      <Container maxWidth="lg" sx={{ 
        py: 4, 
        flex: 1,
        width: '100%',
        mb: 4
      }}>
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
                {content.creatorName && (
                  <Box display="flex" alignItems="center">
                    <Person fontSize="small" sx={{ color: '#5F4B8B', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Created by: {content.creatorName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday fontSize="small" sx={{ color: '#666', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(content.createdAt)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Update fontSize="small" sx={{ color: '#666', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Updated: {formatDate(content.updatedAt)}
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
        
        {/* Game Settings */}
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
                      {content.gameConfig?.studentsPerGroup || 'N/A'}
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
                      {content.gameConfig?.timePerTurn || 'N/A'} seconds
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
                      {content.gameConfig?.turnCycles || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        {/* Roles and Word Bank */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, backgroundColor: 'white', height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Roles
              </Typography>
              
              {content.contentData?.roles?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {content.contentData.roles.map((role, index) => (
                    <Chip
                      key={index}
                      label={role.name}
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
              
              {content.contentData?.wordBank?.length > 0 ? (
                <List dense sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  {content.contentData.wordBank.map((word, index) => (
                    <Tooltip
                      key={index}
                      title={
                        <React.Fragment>
                          <Typography color="inherit" variant="subtitle2">Description:</Typography>
                          <Typography variant="body2">
                            {word.description ? word.description : "No description available"}
                          </Typography>
                          <Typography color="inherit" variant="subtitle2" sx={{ mt: 1 }}>Example:</Typography>
                          <Typography variant="body2" fontStyle="italic">
                            "{word.exampleUsage ? word.exampleUsage : "No example available"}"
                          </Typography>
                        </React.Fragment>
                      }
                      arrow
                      placement="top"
                    >
                      <ListItem
                        sx={{
                          backgroundColor: '#f9f9f9',
                          mb: 1,
                          borderRadius: '8px',
                          cursor: 'help',
                        }}
                      >
                        <ListItemText 
                          primary={word.word} 
                          secondary={word.description ? word.description.substring(0, 30) + "..." : null}
                        />
                      </ListItem>
                    </Tooltip>
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
        
        {/* Background Image */}
        {content.contentData?.backgroundImage && (
          <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mt: 4, backgroundColor: 'white' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Background Image
            </Typography>
            
            <Box
              sx={{
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: '100%',
                textAlign: 'center'
              }}
            >
              <img
                src={getImageUrl(content.contentData.backgroundImage)}
                alt="Scenario background"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px', 
                  objectFit: 'contain',
                  border: '1px solid #eee',
                  borderRadius: '8px'
                }}
                onError={(e) => {
                  console.error("Error loading image:", e);
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/800x450?text=Image+Not+Available";
                }}
              />
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ContentDetails;