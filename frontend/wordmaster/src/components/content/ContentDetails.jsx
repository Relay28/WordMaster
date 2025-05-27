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
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
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
import picbg from '../../assets/picbg.png';

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
  setDeleteDialogOpen(true);
};
const confirmDelete = async () => {
  try {
    const token = await getToken();
    await contentService.deleteContent(id, token);
    setDeleteDialogOpen(false);
    navigate('/content/dashboard', {
      state: {
        message: 'Content deleted successfully',
        success: true
      }
    });
  } catch (err) {
    console.error("Error deleting content:", err);
    setError("Failed to delete content. Please try again.");
    setDeleteDialogOpen(false);
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
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2,
        px: { xs: 2, md: 6 },
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        borderBottom: '1px solid rgba(255,255,255,0.3)'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => navigate('/content/dashboard')}
              sx={{
                color: '#5F4B8B',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                border: '2px solid #5F4B8B',
                borderRadius: '4px',
                width: '32px',
                height: '32px',
                '&:hover': {
                  backgroundColor: 'rgba(95, 75, 139, 0.1)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
              SCENARIO DETAILS
            </Typography>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={content.published ? <Unpublished /> : <Publish />}
              onClick={handlePublishToggle}
              sx={{
                ...pixelButton,
                backgroundColor: content.published ? '#f57c00' : '#4caf50',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                '&:hover': { 
                  backgroundColor: content.published ? '#ef6c00' : '#388e3c',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                }
              }}
            >
              {content.published ? 'UNPUBLISH' : 'PUBLISH'}
            </Button>

            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/content/edit/${id}`)}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              EDIT
            </Button>

            <Button
    variant="contained"
    startIcon={<Delete />}
    onClick={handleDelete}
    sx={{
      ...pixelButton,
      backgroundColor: '#d32f2f',
      borderStyle: 'outset',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
      textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
      '&:hover': { 
        backgroundColor: '#b71c1c',
        transform: 'translateY(-2px)'
      }
    }}
  >
    DELETE
  </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1,
        width: '100%',
        overflow: 'auto',
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
          
          <Paper elevation={0} sx={{ borderRadius: '16px', p: 3, mb: 4, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box>
                <Typography sx={{ ...pixelHeading }} mb={1}>
                  {content.title}
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <Chip 
                    label={content.published ? 'Published' : 'Draft'} 
                    size="small"
                    sx={{ 
                      ...pixelText,
                      backgroundColor: content.published ? '#e6f7ed' : '#f2f2f2',
                      color: content.published ? '#0a8043' : '#666666',
                      fontWeight: 500,
                      mr: 2
                    }}
                  />
                  {content.creatorName && (
                    <Box display="flex" alignItems="center">
                      <Person fontSize="small" sx={{ color: '#5F4B8B', mr: 0.5 }} />
                      <Typography sx={{ ...pixelText }}>
                        Created by: {content.creatorName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarToday fontSize="small" sx={{ color: '#666', mr: 1 }} />
                  <Typography sx={{ ...pixelText }}>
                    Created: {formatDate(content.createdAt)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Update fontSize="small" sx={{ color: '#666', mr: 1 }} />
                  <Typography sx={{ ...pixelText }}>
                    Updated: {formatDate(content.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {content.description && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ ...pixelHeading }} gutterBottom>
                  Description
                </Typography>
                <Typography sx={{ ...pixelText }}>
                  {content.description}
                </Typography>
              </>
            )}
          </Paper>
          
          {/* Game Settings */}
          <Paper elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden', mb: 4, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Box p={3}>
              <Typography sx={{ ...pixelHeading }} mb={3}>
                Game Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card elevation={0} sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '2px solid #5F4B8B', boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Group sx={{ color: '#5F4B8B', mr: 1 }} />
                        <Typography sx={{ ...pixelText }}>
                          Students per Group
                        </Typography>
                      </Box>
                      <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
                        {content.gameConfig?.studentsPerGroup || 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card elevation={0} sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '2px solid #5F4B8B', boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <AccessTime sx={{ color: '#5F4B8B', mr: 1 }} />
                        <Typography sx={{ ...pixelText }}>
                          Time per Turn
                        </Typography>
                      </Box>
                      <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
                        {content.gameConfig?.timePerTurn || 'N/A'} seconds
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card elevation={0} sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '2px solid #5F4B8B', boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LoopRounded sx={{ color: '#5F4B8B', mr: 1 }} />
                        <Typography sx={{ ...pixelText }}>
                          Turn Cycles
                        </Typography>
                      </Box>
                      <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
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
              <Paper 
              elevation={0} 
              sx={{ borderRadius: '16px', p: 3, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', border: '1px solid rgba(255,255,255,0.3)', height: '100%', width: '100%', boxSizing: 'border-box', }}>
                <Typography sx={{ ...pixelHeading }} mb={3}>
                  Roles
                </Typography>
                
                {content.contentData?.roles?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {content.contentData.roles.map((role, index) => (
                      <Chip
                        key={index}
                        label={role.name}
                        sx={{
                          ...pixelText,
                          backgroundColor: '#f0edf5',
                          color: '#5F4B8B',
                          border: '2px solid #5F4B8B',
                          borderRadius: '4px'
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ ...pixelText }}>
                    No roles defined for this scenario.
                  </Typography>
                )}
              </Paper>
            </Grid> 

            <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ 
              borderRadius: '16px', 
              p: 3, 
              backgroundColor: 'rgba(255,255,255,0.8)', 
              backdropFilter: 'blur(8px)', 
              height: '100%',
              position: 'relative',
              width: '100%', // Ensure full width
              boxSizing: 'border-box',
            }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Typography sx={{ 
                  ...pixelHeading, 
                }}>
                  Word Bank
                </Typography>
                <Chip
                  label={`${content.contentData?.wordBank?.length || 0} words`}
                  size="small"
                  sx={{
                    ...pixelText,
                    ml: 2,
                    backgroundColor: '#f0edf5',
                    color: '#5F4B8B',
                    border: '2px solid #5F4B8B',
                    borderRadius: '4px'
                  }}
                />
              </Box>
              
              {content.contentData?.wordBank?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {content.contentData.wordBank.map((word, index) => (
                    <Tooltip
                      key={index}
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography sx={{color: '#fff', mb: 1 }}>
                            <strong>Description:</strong> {word.description || "No description available"}
                          </Typography>
                          <Typography sx={{color: '#fff', mt: 1, fontStyle: 'italic' }}>
                            <strong>Example:</strong> "{word.exampleUsage || "No example available"}"
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: '#5F4B8B',
                            '& .MuiTooltip-arrow': {
                              color: '#5F4B8B'
                            }
                          }
                        }
                      }}
                    >
                      <Chip
                        label={word.word}
                        sx={{
                          ...pixelText,
                          backgroundColor: '#f0edf5',
                          color: '#5F4B8B',
                          border: '2px solid #5F4B8B',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              ) : (
                <Box sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed #5F4B8B',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(95, 75, 139, 0.05)'
                }}>
                  <Typography sx={{ 
                    ...pixelText,
                    color: '#5F4B8B',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                  }}>
                    No words added to the word bank.
                  </Typography>
                </Box>
              )}
            </Paper>
            </Grid>
          </Grid>
          
          {/* Background Image */}
          {content.contentData?.backgroundImage && (
            <Paper elevation={0} sx={{ borderRadius: '16px', p: 3, mt: 4, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <Typography sx={{ ...pixelHeading }} mb={3}>
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
      <Dialog
      open={deleteDialogOpen}
      onClose={() => setDeleteDialogOpen(false)}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
        Delete Scenario
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ ...pixelText, color: '#666' }}>
          Are you sure you want to delete this scenario? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={() => setDeleteDialogOpen(false)}
          variant="outlined"
          sx={{
            ...pixelButton,
            color: '#5F4B8B',
            borderColor: '#5F4B8B',
            '&:hover': {
              borderColor: '#4a3a6d',
              backgroundColor: 'rgba(95, 75, 139, 0.1)'
            }
          }}
        >
          CANCEL
        </Button>
        <Button
          onClick={confirmDelete}
          variant="contained"
          sx={{
            ...pixelButton,
            backgroundColor: '#d32f2f',
            color: 'white',
            '&:hover': {
              backgroundColor: '#b71c1c'
            }
          }}
        >
          DELETE
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
};

export default ContentDetails;