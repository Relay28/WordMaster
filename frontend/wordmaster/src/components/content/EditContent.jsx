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
  ListItemSecondaryAction
} from '@mui/material';
import { ArrowBack, Save, Publish, Unpublished, Add, Delete, Image } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import contentService from '../../services/contentService';
import PublishConfirmation from './PublishConfirmation';

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
        if (data.contentData) {
          parsedContentData = JSON.parse(data.contentData);
        }
        if (data.gameElementConfig) {
          parsedGameConfig = JSON.parse(data.gameElementConfig);
        }
      } catch (err) {
        console.error("Error parsing JSON data:", err);
        setError("Error parsing content data. Some information may not display correctly.");
      }
      
      const contentState = {
        title: data.title || '',
        description: data.description || '',
        backgroundTheme: data.backgroundTheme || 'default',
        published: data.published || false
      };
      
      const scenarioState = {
        studentsPerGroup: parsedGameConfig.studentsPerGroup || 5,
        roles: parsedContentData.roles || [],
        timePerTurn: parsedGameConfig.timePerTurn || 30,
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

  const handleAddWord = () => {
    if (newWord.trim() !== '') {
      setScenarioSettings({
        ...scenarioSettings,
        wordBank: [...scenarioSettings.wordBank, newWord.trim()]
      });
      setNewWord('');
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
        return;
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
    return JSON.stringify({
      wordBank: scenarioSettings.wordBank,
      roles: scenarioSettings.roles,
      backgroundImage: imagePreview
    });
  };

  const prepareGameConfig = () => {
    return JSON.stringify({
      studentsPerGroup: scenarioSettings.studentsPerGroup,
      timePerTurn: scenarioSettings.timePerTurn,
      turnCycles: scenarioSettings.turnCycles
    });
  };

  const handleSave = async (publish = null) => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const dataToSubmit = { 
        ...formData,
        contentData: prepareContentData(),
        gameElementConfig: prepareGameConfig()
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
      height: '100vh', // Ensures the Box takes the full viewport height
      overflowY: 'auto', // Enables vertical scrolling
      overflowX: 'hidden',
      backgroundColor: '#f9f9f9',
      position: 'relative',
    }}>
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
            <Box>
              <Typography variant="h5" fontWeight="bold" color="#5F4B8B">
                Edit Scenario
              </Typography>
              <Box display="flex" alignItems="center" mt={0.5}>
                <Typography variant="body2" color="text.secondary" mr={1}>
                  Status:
                </Typography>
                <Chip 
                  label={formData.published ? 'Published' : 'Draft'} 
                  size="small"
                  sx={{ 
                    backgroundColor: formData.published ? '#e6f7ed' : '#f2f2f2',
                    color: formData.published ? '#0a8043' : '#666666',
                    fontWeight: 500,
                    height: 24
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving || !hasChanges()}
              sx={{
                backgroundColor: '#5F4B8B',
                '&:hover': { backgroundColor: '#4a3a6d' },
                textTransform: 'none',
                borderRadius: '8px',
                mr: 2,
                px: 3,
                py: 1
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
            
            {formData.published ? (
              <Button
                variant="outlined"
                startIcon={<Unpublished />}
                onClick={handleUnpublishClick}
                disabled={saving}
                sx={{
                  borderColor: '#f57c00',
                  color: '#f57c00',
                  '&:hover': { backgroundColor: '#fff8e1', borderColor: '#ef6c00' },
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3
                }}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Publish />}
                onClick={handlePublishClick}
                disabled={saving}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#388e3c' },
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 1
                }}
              >
                Publish
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ 
        py: 4, 
        width: '100%',
        mb: 4
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
            Scenario Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scenario Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                variant="outlined"
                placeholder="Enter a descriptive title for your scenario"
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Scenario Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                variant="outlined"
                multiline
                rows={3}
                placeholder="Describe the context and purpose of this scenario"
                sx={{ mb: 1 }}
              />
            </Grid>
          </Grid>
        </Paper>
        
        <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
            Group Settings
          </Typography>
          
          <Grid container spacing={3}>
            {/* Group Size Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1.5} color="#666">
                Group Size
              </Typography>
              <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                <Select
                  name="studentsPerGroup"
                  value={scenarioSettings.studentsPerGroup}
                  onChange={handleScenarioSettingChange}
                  displayEmpty
                >
                  {studentGroupSizes.map((size) => (
                    <MenuItem key={size.value} value={size.value}>
                      {size.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ height: '1px', bgcolor: '#f0f0f0', width: '100%', my: 2 }} />
            </Grid>
            
            {/* Role Assignment Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1.5} color="#666">
                Role Assignment
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Add roles that students will play in the conversation scenario.
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <TextField 
                  fullWidth
                  variant="outlined"
                  label="Add Role"
                  placeholder="E.g., Customer, Waiter, Manager"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddRole}
                  sx={{
                    backgroundColor: '#5F4B8B',
                    height: '56px',
                    minWidth: '100px',
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: '#4a3a6d' },
                  }}
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ mb: 2, minHeight: '60px', p: 2, bgcolor: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                {scenarioSettings.roles.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {scenarioSettings.roles.map((role, index) => (
                      <Chip
                        key={index}
                        label={role}
                        onDelete={() => handleDeleteRole(index)}
                        sx={{
                          backgroundColor: '#f0edf5',
                          color: '#5F4B8B',
                          m: 0.5,
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                    No roles added yet. Please add at least one role.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
            Game Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Time per Turn</InputLabel>
                <Select
                  name="timePerTurn"
                  value={scenarioSettings.timePerTurn}
                  onChange={handleScenarioSettingChange}
                  label="Time per Turn"
                >
                  {turnTimes.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time} seconds
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Number of Turns</InputLabel>
                <Select
                  name="turnCycles"
                  value={scenarioSettings.turnCycles}
                  onChange={handleScenarioSettingChange}
                  label="Number of Turns"
                >
                  {turnCyclesOptions.map((cycles) => (
                    <MenuItem key={cycles} value={cycles}>
                      {cycles} {cycles === 1 ? 'turn' : 'turns'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
            Word Bank
          </Typography>
          
          <Box display="flex" alignItems="center" mb={2}>
            <TextField 
              fullWidth
              variant="outlined"
              label="Add Word"
              placeholder="Enter a word students will need to use"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddWord}
              sx={{
                backgroundColor: '#5F4B8B',
                height: '56px',
                minWidth: '100px',
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: '#4a3a6d' },
              }}
            >
              Add
            </Button>
          </Box>
          
          {scenarioSettings.wordBank.length > 0 ? (
            <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {scenarioSettings.wordBank.map((word, index) => (
                <ListItem
                  key={index}
                  sx={{
                    backgroundColor: '#f9f9f9',
                    mb: 1,
                    borderRadius: '8px',
                  }}
                >
                  <ListItemText primary={word} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleDeleteWord(index)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
              Word bank is empty. Students will need to come up with their own vocabulary.
            </Typography>
          )}
        </Paper>
        
        <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
            Background Image
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select an image that represents your scenario context (e.g., Airport, Classroom, Office, Café).
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Image />}
              sx={{
                borderColor: '#5F4B8B',
                color: '#5F4B8B',
                '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
                textTransform: 'none',
                borderRadius: '8px',
                py: 1
              }}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            
            <Typography variant="caption" color="text.secondary">
              Maximum size: 5MB. Recommended size: 1920x1080px
            </Typography>
          </Box>
          
          {imagePreview && (
            <Box
              sx={{
                mt: 3,
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: '100%',
                maxHeight: '300px',
                border: '1px solid #e0e0e0',
              }}
            >
              <img
                src={imagePreview}
                alt="Background preview"
                style={{ width: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Paper>
      </Container>
      
      <PublishConfirmation
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={() => {
          setPublishDialogOpen(false);
          handleSave(true);
        }}
        title={formData.title || 'this content'}
        loading={saving}
      />
      
      <PublishConfirmation
        open={unpublishDialogOpen}
        onClose={() => setUnpublishDialogOpen(false)}
        onConfirm={() => {
          setUnpublishDialogOpen(false);
          handleSave(false);
        }}
        title={formData.title || 'this content'}
        loading={saving}
      />
    </Box>
  );
};

export default EditContent;
