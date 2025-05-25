import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  MenuItem,
  IconButton,
  Chip,
  Select,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import { ArrowBack, Save, Publish, Unpublished, Add, Delete, Image } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import contentService from '../../services/contentService';
import PublishConfirmation from './PublishConfirmation';
import picbg from '../../assets/picbg.png';
import axios from 'axios';
import API_URL from '../../services/apiConfig';


const studentGroupSizes = [
  { value: 5, label: "Small Group (2-5 students)" },
  { value: 10, label: "Medium Group (6-10 students)" },
  { value: 20, label: "Large Group (11-20 students)" }
];
const turnTimes = [15, 30, 45, 60, 90, 120];
const turnCyclesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const EditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useUserAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    backgroundTheme: 'default',
    published: false
  });
  
  const [scenarioSettings, setScenarioSettings] = useState({
    studentsPerGroup: 5,
    roles: [],
    timePerTurn: 30,
    wordBank: [],
    turnCycles: 3,
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [newWord, setNewWord] = useState('');
  const [originalState, setOriginalState] = useState({});
  const [originalScenarioSettings, setOriginalScenarioSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);

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
  
  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await contentService.getContentById(id, token);
      
      let parsedContentData = {};
      let parsedGameConfig = {};
      
      try {
        // Check if data.contentData is a string or already an object
        if (data.contentData) {
          if (typeof data.contentData === 'string') {
            parsedContentData = JSON.parse(data.contentData);
          } else {
            // It's already an object, use it directly
            parsedContentData = data.contentData;
          }
        }
        
        // Same for gameConfig
        if (data.gameElementConfig || data.gameConfig) {
          const configData = data.gameElementConfig || data.gameConfig;
          if (typeof configData === 'string') {
            parsedGameConfig = JSON.parse(configData);
          } else {
            parsedGameConfig = configData;
          }
        }
      } catch (err) {
        console.error("Error processing content data:", err);
        setError("Error loading content data. Some information may not display correctly.");
      }
      
      const contentState = {
        title: data.title || '',
        description: data.description || '',
        backgroundTheme: data.backgroundTheme || 'default',
        published: data.published || false
      };
      
      const scenarioState = {
        studentsPerGroup: parsedGameConfig.studentsPerGroup || 5,
        // Convert role objects to strings if needed
        roles: parsedContentData.roles ? parsedContentData.roles.map(role => 
          typeof role === 'object' ? role.name || role.toString() : role
        ) : [],
        timePerTurn: parsedGameConfig.timePerTurn || 30,
        // Preserve full word objects
        wordBank: parsedContentData.wordBank || [],
        turnCycles: parsedGameConfig.turnCycles || 3,
      };
      
      setFormData(contentState);
      setScenarioSettings(scenarioState);
      setOriginalState({...contentState});
      setOriginalScenarioSettings({...scenarioState});
      
      if (parsedContentData.backgroundImage) {
        setImagePreview(parsedContentData.backgroundImage);
      }
    } catch (err) {
      console.error("Error loading content:", err);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'published' ? checked : value
    });
  };

  const handleScenarioSettingChange = (e) => {
    const { name, value } = e.target;
    setScenarioSettings({
      ...scenarioSettings,
      [name]: value
    });
  };

  const handleAddRole = () => {
    if (newRole.trim() !== '') {
      setScenarioSettings({
        ...scenarioSettings,
        roles: [...scenarioSettings.roles, newRole.trim()]
      });
      setNewRole('');
    }
  };

  const handleDeleteRole = (index) => {
    const updatedRoles = [...scenarioSettings.roles];
    updatedRoles.splice(index, 1);
    setScenarioSettings({
      ...scenarioSettings,
      roles: updatedRoles
    });
  };

  const handleAddWord = async () => {
    if (newWord.trim() !== '') {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await axios.post(`${API_URL}/api/wordbank/enrich`, 
          { word: newWord.trim() }, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        const enrichedWord = {
          word: response.data.word,
          description: response.data.description,
          exampleUsage: response.data.exampleUsage
        };
        
        setScenarioSettings({
          ...scenarioSettings,
          wordBank: [...scenarioSettings.wordBank, enrichedWord]
        });
        setNewWord('');
      } catch (error) {
        console.error("Error enriching word:", error);
        // Fallback to basic word without enrichment
        setScenarioSettings({
          ...scenarioSettings,
          wordBank: [...scenarioSettings.wordBank, {
            word: newWord.trim(),
            description: "No description available",
            exampleUsage: "No example available"
          }]
        });
        setNewWord('');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteWord = (index) => {
    const updatedWordBank = [...scenarioSettings.wordBank];
    updatedWordBank.splice(index, 1);
    setScenarioSettings({
      ...scenarioSettings,
      wordBank: updatedWordBank
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setError("Image size too large. Please select an image smaller than 5MB.");
        
        ;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    
    if (scenarioSettings.roles.length === 0) {
      setError("Please add at least one role");
      return false;
    }
    
    return true;
  };

  const prepareContentData = () => {
    // Map each word object to ensure it has the required fields, preserving existing data
    const wordBankItems = scenarioSettings.wordBank.map(item => {
      if (typeof item === 'string') {
        // This case handles words added manually in the UI after initial load
        return {
          word: item,
          description: "No description available", 
          exampleUsage: "No example available"
        };
      }
      // This case handles words loaded from the backend
      return {
        word: item.word,
        description: item.description || "No description available",
        exampleUsage: item.exampleUsage || "No example available"
      };
    });

    // Map each role string to a RoleDTO-compatible object
    const roleItems = scenarioSettings.roles.map(role => ({
      name: role
    }));

    return {
      wordBank: wordBankItems,
      roles: roleItems,
      backgroundImage: imagePreview
    };
  };

  const prepareGameConfig = () => {
    // Return an object directly instead of stringifying it
    return {
      studentsPerGroup: scenarioSettings.studentsPerGroup,
      timePerTurn: scenarioSettings.timePerTurn,
      turnCycles: scenarioSettings.turnCycles
    };
  };

  const handleSave = async (publish = null) => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const dataToSubmit = { 
        ...formData,
        contentData: prepareContentData(),
        gameConfig: prepareGameConfig() // Note: changed gameElementConfig to gameConfig for consistent naming
      };
      
      if (publish !== null) {
        dataToSubmit.published = publish;
      }
      
      const token = await getToken();
      await contentService.updateContent(id, dataToSubmit, token);
      
      let successMessage;
      if (publish === true) {
        successMessage = `Content "${formData.title}" has been published.`;
      } else if (publish === false) {
        successMessage = `Content "${formData.title}" has been unpublished.`;
      } else {
        successMessage = `Content "${formData.title}" has been updated.`;
      }
      
      navigate('/content/dashboard', { 
        state: { 
          message: successMessage,
          success: true
        }
      });
    } catch (err) {
      console.error("Error saving content:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishClick = () => {
    if (validateForm()) {
      setPublishDialogOpen(true);
    }
  };

  const handleUnpublishClick = () => {
    setUnpublishDialogOpen(true);
  };

  const hasChanges = () => {
    return (
      JSON.stringify(formData) !== JSON.stringify(originalState) ||
      JSON.stringify(scenarioSettings) !== JSON.stringify(originalScenarioSettings)
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#5F4B8B' }} />
      </Box>
    );
  }

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
            <Box>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B' }}>
                Edit Content
              </Typography>
              <Box display="flex" alignItems="center" mt={0.5}>
                <Typography sx={{ ...pixelText, color: 'text.secondary', mr: 1 }}>
                  Status:
                </Typography>
                <Chip 
                  label={formData.published ? 'Published' : 'Draft'} 
                  size="small"
                  sx={{ 
                    ...pixelText,
                    backgroundColor: formData.published ? '#e6f7ed' : '#f2f2f2',
                    color: formData.published ? '#0a8043' : '#666666',
                    height: 24
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving || !hasChanges()}
              sx={{
                ...pixelButton,
                background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
                color: '#fff',
                borderRadius: '8px',
                px: 3,
                py: 1,
                minWidth: isMobile ? 'auto' : '140px',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>

            {formData.published ? (
              <Button
                variant="outlined"
                startIcon={<Unpublished />}
                onClick={handleUnpublishClick}
                sx={{
                  ...pixelButton,
                  color: '#f57c00',
                  borderColor: '#f57c00',
                  borderStyle: 'outset',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    backgroundColor: '#fff8e1'
                  }
                }}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Publish />}
                onClick={handlePublishClick}
                sx={{
                  ...pixelButton,
                  backgroundColor: '#4caf50',
                  borderStyle: 'outset',
                  boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                  '&:hover': {
                    backgroundColor: '#388e3c',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Publish
              </Button>
            )}
          </Box>
        </Box>
      </Box>

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
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                ...pixelText,
                backgroundColor: '#ffebee',
                color: '#d32f2f'
              }}
            >
              {error}
            </Alert>
          )}

          <Paper elevation={0} sx={{ 
            borderRadius: '16px',
            p: 4,
            mb: 3,
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            {/* Scenario Details */}
            <Box mb={4}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Scenario Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} width={500}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    sx={{
                      '& .MuiInputBase-root': {
                        ...pixelText,
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} width={500}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    sx={{
                      '& .MuiInputBase-root': {
                        ...pixelText,
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Group Settings */}
            <Box mb={4}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Group Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} width={500}>
                  <FormControl fullWidth>
                    <InputLabel sx={pixelText}>Students per Group</InputLabel>
                    <Select
                      name="studentsPerGroup"
                      value={scenarioSettings.studentsPerGroup}
                      onChange={handleScenarioSettingChange}
                      sx={{
                        ...pixelText,
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      {studentGroupSizes.map((size) => (
                        <MenuItem key={size.value} value={size.value} sx={pixelText}>
                          {size.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex',
                    gap: 2,
                    mb: 2,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <TextField
                      fullWidth
                      label="Add Role"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      sx={{
                        '& .MuiInputBase-root': {
                          ...pixelText,
                          backgroundColor: 'rgba(255,255,255,0.9)'
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddRole}
                      startIcon={<Add />}
                      sx={{
                        ...pixelButton,
                        backgroundColor: '#5F4B8B',
                        minWidth: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      Add Role
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {scenarioSettings.roles.map((role, index) => (
                      <Chip
                        key={index}
                        label={role}
                        onDelete={() => handleDeleteRole(index)}
                        sx={{
                          ...pixelText,
                          backgroundColor: 'rgba(95, 75, 139, 0.1)',
                          color: '#5F4B8B'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Game Settings */}
            <Box mb={4}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Game Settings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} width={500}>
                  <FormControl fullWidth>
                    <InputLabel sx={pixelText}>Time per Turn (seconds)</InputLabel>
                    <Select
                      name="timePerTurn"
                      value={scenarioSettings.timePerTurn}
                      onChange={handleScenarioSettingChange}
                      sx={{
                        ...pixelText,
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      {turnTimes.map((time) => (
                        <MenuItem key={time} value={time} sx={pixelText}>
                          {time} seconds
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} width={500}>
                  <FormControl fullWidth>
                    <InputLabel sx={pixelText}>Turn Cycles</InputLabel>
                    <Select
                      name="turnCycles"
                      value={scenarioSettings.turnCycles}
                      onChange={handleScenarioSettingChange}
                      sx={{
                        ...pixelText,
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      {turnCyclesOptions.map((cycles) => (
                        <MenuItem key={cycles} value={cycles} sx={pixelText}>
                          {cycles} {cycles === 1 ? 'cycle' : 'cycles'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Word Bank */}
            <Box mb={4}>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Word Bank
              </Typography>
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}>
                <TextField
                  fullWidth
                  label="Add Word"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      ...pixelText,
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddWord}
                  startIcon={<Add />}
                  sx={{
                    ...pixelButton,
                    backgroundColor: '#5F4B8B',
                    minWidth: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Add Word
                </Button>
              </Box>
              <List>
                {scenarioSettings.wordBank.map((word, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      borderRadius: '8px',
                      mb: 1
                    }}
                  >
                    <ListItemText 
                      primary={typeof word === 'object' ? word.word : word}
                      sx={{ '& .MuiListItemText-primary': pixelText }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteWord(index)}
                        sx={{ color: '#f44336' }}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Background Image */}
            <Box>
              <Typography sx={{ ...pixelHeading, color: '#5F4B8B', mb: 2 }}>
                Background Image
              </Typography>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<Image />}
                  sx={{
                    ...pixelButton,
                    color: '#5F4B8B',
                    borderColor: '#5F4B8B'
                  }}
                >
                  Choose Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {imagePreview && (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Background preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                )}
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      <PublishConfirmation
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={() => {
          setPublishDialogOpen(false);
          handleSave(true);
        }}
        title={formData.title}
        loading={saving}
      />
      
      <PublishConfirmation
        open={unpublishDialogOpen}
        onClose={() => setUnpublishDialogOpen(false)}
        onConfirm={() => {
          setUnpublishDialogOpen(false);
          handleSave(false);
        }}
        title={formData.title}
        loading={saving}
      />
    </Box>
  );
};

export default EditContent;
