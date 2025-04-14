// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   Container,
//   Paper,
//   CircularProgress,
//   Alert,
//   Grid,
//   MenuItem,
//   IconButton,
//   Select,
//   Chip,
//   InputLabel,
//   FormControl,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction
// } from '@mui/material';
// import { ArrowBack, Upload, Save, Add, Delete, Image as ImageIcon } from '@mui/icons-material';
// import { useUserAuth } from '../context/UserAuthContext';
// import contentService from '../../services/contentService';
// import PublishConfirmation from './PublishConfirmation';

// // Update group sizes to match SRS requirements
// const studentGroupSizes = [
//   { value: 5, label: "Small Group (2-5 students)" },
//   { value: 10, label: "Medium Group (6-10 students)" },
//   { value: 20, label: "Large Group (11-20 students)" }
// ];
// const turnTimes = [15, 30, 45, 60, 90, 120];
// const turnCyclesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// const UploadContent = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user, getToken } = useUserAuth();

//   // Extract classroom ID from URL query parameters
//   const queryParams = new URLSearchParams(location.search);
//   const classroomId = queryParams.get('classroomId');

//   console.log("Creating content for classroom ID:", classroomId); // Debug logging

//   // Form state
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     backgroundTheme: 'default',
//   });

//   // Specific scenario settings
//   const [scenarioSettings, setScenarioSettings] = useState({
//     studentsPerGroup: 5, // Default to small group
//     roles: [],
//     timePerTurn: 30,
//     wordBank: [],
//     turnCycles: 3,
//   });

//   // Background image handling
//   const [backgroundImage, setBackgroundImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);

//   // Form management
//   const [newRole, setNewRole] = useState('');
//   const [newWord, setNewWord] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [publishDialogOpen, setPublishDialogOpen] = useState(false);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
//   };

//   const handleScenarioSettingChange = (e) => {
//     const { name, value } = e.target;
//     setScenarioSettings({
//       ...scenarioSettings,
//       [name]: value
//     });
//   };

//   // Role management
//   const handleAddRole = () => {
//     if (newRole.trim() !== '') {
//       setScenarioSettings({
//         ...scenarioSettings,
//         roles: [...scenarioSettings.roles, newRole.trim()]
//       });
//       setNewRole('');
//     }
//   };

//   const handleDeleteRole = (index) => {
//     const updatedRoles = [...scenarioSettings.roles];
//     updatedRoles.splice(index, 1);
//     setScenarioSettings({
//       ...scenarioSettings,
//       roles: updatedRoles
//     });
//   };

//   // Word bank management
//   const handleAddWord = () => {
//     if (newWord.trim() !== '') {
//       setScenarioSettings({
//         ...scenarioSettings,
//         wordBank: [...scenarioSettings.wordBank, newWord.trim()]
//       });
//       setNewWord('');
//     }
//   };

//   const handleDeleteWord = (index) => {
//     const updatedWordBank = [...scenarioSettings.wordBank];
//     updatedWordBank.splice(index, 1);
//     setScenarioSettings({
//       ...scenarioSettings,
//       wordBank: updatedWordBank
//     });
//   };

//   // Background image handling
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.size > 5000000) { // 5MB limit
//         setError("Image size too large. Please select an image smaller than 5MB.");
//         return;
//       }

//       setBackgroundImage(file);

//       // Create preview with compression
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         // Create an image to resize
//         const img = new Image();
//         img.onload = () => {
//           // Create canvas for resizing
//           const canvas = document.createElement('canvas');
//           // Max dimensions (1280px width should be sufficient)
//           const MAX_WIDTH = 1280;
//           const MAX_HEIGHT = 800;

//           let width = img.width;
//           let height = img.height;

//           // Resize image while maintaining aspect ratio
//           if (width > height) {
//             if (width > MAX_WIDTH) {
//               height *= MAX_WIDTH / width;
//               width = MAX_WIDTH;
//             }
//           } else {
//             if (height > MAX_HEIGHT) {
//               width *= MAX_HEIGHT / height;
//               height = MAX_HEIGHT;
//             }
//           }

//           canvas.width = width;
//           canvas.height = height;

//           // Draw and compress
//           const ctx = canvas.getContext('2d');
//           ctx.drawImage(img, 0, 0, width, height);

//           // Get compressed data URL (0.85 quality)
//           const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
//           setImagePreview(compressedDataUrl);
//         };
//         img.src = e.target.result;
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const validateForm = () => {
//     if (!formData.title.trim()) {
//       setError("Title is required");
//       return false;
//     }

//     if (scenarioSettings.roles.length === 0) {
//       setError("Please add at least one role");
//       return false;
//     }

//     return true;
//   };

//   const prepareContentData = () => {
//     return JSON.stringify({
//       wordBank: scenarioSettings.wordBank,
//       roles: scenarioSettings.roles,
//       backgroundImage: imagePreview // Store image as data URL
//     });
//   };

//   const prepareGameConfig = () => {
//     return JSON.stringify({
//       studentsPerGroup: scenarioSettings.studentsPerGroup,
//       timePerTurn: scenarioSettings.timePerTurn,
//       turnCycles: scenarioSettings.turnCycles
//     });
//   };

//   const handleSubmit = async (publish = false) => {
//     if (!validateForm()) return;

//     setLoading(true);
//     setError(null);

//     try {
//       const token = await getToken();
//       const dataToSubmit = {
//         ...formData,
//         contentData: prepareContentData(),
//         gameElementConfig: prepareGameConfig(),
//         published: publish // Make sure to set the published status
//       };

//       console.log("Creating content with data:", dataToSubmit);
//       console.log("ClassroomId:", classroomId);

//       let result;

//       // Check if we're creating content for a specific classroom
//       if (classroomId) {
//         console.log("Creating content for classroom with ID:", classroomId);
//         result = await contentService.createContentForClassroom(
//           dataToSubmit, user.id, classroomId, token
//         );
//         console.log("Content created for classroom:", result);

//         // Navigate back to the classroom page
//         navigate(`/classroom/${classroomId}`, {
//           state: {
//             message: `Content "${formData.title}" created successfully.`,
//             success: true
//           }
//         });
//       } else {
//         // Regular content creation
//         result = await contentService.createContent(
//           dataToSubmit, user.id, token
//         );

//         // Navigate to the dashboard
//         navigate('/content/dashboard', {
//           state: {
//             message: `Content "${formData.title}" created successfully.`,
//             success: true
//           }
//         });
//       }

//     } catch (err) {
//       console.error("Error creating content:", err);
//       setError("Failed to create content. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (classroomId) {
//       navigate(`/classroom/${classroomId}`);
//     } else {
//       navigate('/content/dashboard');
//     }
//   };

//   const handlePublishClick = () => {
//     if (validateForm()) {
//       setPublishDialogOpen(true);
//     }
//   };

//   const handleConfirmPublish = () => {
//     setPublishDialogOpen(false);
//     handleSubmit(true); // Pass true to indicate published content
//   };

//   return (
//     <Box sx={{
//       display: 'flex',
//       flexDirection: 'column',
//       backgroundColor: '#f9f9f9',
//       height: '100vh', // Ensures the Box takes the full viewport height
//       overflowY: 'auto', // Enables vertical scrolling
//       overflowX: 'hidden',
//       width: '100%'
//     }}>
//       {/* Header */}
//       <Box sx={{
//         backgroundColor: 'white',
//         boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
//         py: 2,
//         px: { xs: 2, md: 6 },
//         position: 'sticky',
//         top: 0,
//         zIndex: 1100
//       }}>
//         <Box display="flex" justifyContent="space-between" alignItems="center">
//           <Box display="flex" alignItems="center">
//             <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
//               <ArrowBack />
//             </IconButton>
//             <Typography variant="h5" fontWeight="bold" color="#5F4B8B">
//               {classroomId ? "Create Classroom Content" : "Create New Content"}
//             </Typography>
//           </Box>
//           <Box>
//             <Button
//               variant="outlined"
//               startIcon={<Save />}
//               onClick={() => handleSubmit(false)}
//               disabled={loading}
//               sx={{
//                 borderColor: '#5F4B8B',
//                 color: '#5F4B8B',
//                 mr: 2,
//                 '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
//                 textTransform: 'none',
//                 borderRadius: '8px',
//                 px: 3
//               }}
//             >
//               Save Draft
//             </Button>
//             <Button
//               variant="contained"
//               startIcon={<Upload />}
//               onClick={handlePublishClick}
//               disabled={loading}
//               sx={{
//                 backgroundColor: '#4caf50',
//                 '&:hover': { backgroundColor: '#388e3c' },
//                 textTransform: 'none',
//                 borderRadius: '8px',
//                 px: 3,
//                 py: 1
//               }}
//             >
//               {loading ? <CircularProgress size={24} color="inherit" /> : 'Publish'}
//             </Button>
//           </Box>
//         </Box>
//       </Box>

//       {/* Main Content */}
//       <Container maxWidth="lg" sx={{
//         py: 4,
//         width: '100%',
//         mb: 4
//       }}>
//         {error && (
//           <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
//             {error}
//           </Alert>
//         )}

//         {/* Scenario Details */}
//         <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
//           <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
//             Scenario Details
//           </Typography>

//           <Grid container spacing={3}>
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Scenario Title"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 required
//                 variant="outlined"
//                 placeholder="Enter a descriptive title for your scenario"
//                 sx={{ mb: 2 }}
//               />
//             </Grid>

//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Scenario Description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 variant="outlined"
//                 multiline
//                 rows={3}
//                 placeholder="Describe the context and purpose of this scenario"
//                 sx={{ mb: 1 }}
//               />
//             </Grid>
//           </Grid>
//         </Paper>

//         {/* Group Settings */}
//         <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
//           <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
//             Group Settings
//           </Typography>
          
//           <Grid container spacing={3}>
//             {/* Group Size Section */}
//             <Grid item xs={12}>
//               <Typography variant="subtitle1" fontWeight="medium" mb={1.5} color="#666">
//                 Group Size
//               </Typography>
//               <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
//                 <Select
//                   name="studentsPerGroup"
//                   value={scenarioSettings.studentsPerGroup}
//                   onChange={handleScenarioSettingChange}
//                   displayEmpty
//                 >
//                   {studentGroupSizes.map((size) => (
//                     <MenuItem key={size.value} value={size.value}>
//                       {size.label}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
              
//               <Box sx={{ height: '1px', bgcolor: '#f0f0f0', width: '100%', my: 2 }} />
//             </Grid>
            
//             {/* Role Assignment Section */}
//             <Grid item xs={12}>
//               <Typography variant="subtitle1" fontWeight="medium" mb={1.5} color="#666">
//                 Role Assignment
//               </Typography>
//               <Typography variant="body2" color="text.secondary" mb={2}>
//                 Add roles that students will play in the conversation scenario.
//               </Typography>
              
//               <Box display="flex" alignItems="center" mb={2}>
//                 <TextField
//                   fullWidth
//                   variant="outlined"
//                   label="Add Role"
//                   placeholder="E.g., Customer, Waiter, Manager"
//                   value={newRole}
//                   onChange={(e) => setNewRole(e.target.value)}
//                   sx={{ mr: 1 }}
//                 />
//                 <Button
//                   variant="contained"
//                   startIcon={<Add />}
//                   onClick={handleAddRole}
//                   sx={{
//                     backgroundColor: '#5F4B8B',
//                     height: '56px',
//                     minWidth: '100px',
//                     whiteSpace: 'nowrap',
//                     '&:hover': { backgroundColor: '#4a3a6d' },
//                   }}
//                 >
//                   Add
//                 </Button>
//               </Box>
              
//               <Box sx={{ mb: 2, minHeight: '60px', p: 2, bgcolor: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
//                 {scenarioSettings.roles.length > 0 ? (
//                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
//                     {scenarioSettings.roles.map((role, index) => (
//                       <Chip
//                         key={index}
//                         label={role}
//                         onDelete={() => handleDeleteRole(index)}
//                         sx={{
//                           backgroundColor: '#f0edf5',
//                           color: '#5F4B8B',
//                           m: 0.5,
//                           fontWeight: 500
//                         }}
//                       />
//                     ))}
//                   </Box>
//                 ) : (
//                   <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
//                     No roles added yet. Please add at least one role.
//                   </Typography>
//                 )}
//               </Box>
//             </Grid>
//           </Grid>
//         </Paper>

//         {/* Game Settings */}
//         <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
//           <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
//             Game Settings
//           </Typography>

//           <Grid container spacing={3}>
//             <Grid item xs={12} md={6}>
//               <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
//                 <InputLabel>Time per Turn</InputLabel>
//                 <Select
//                   name="timePerTurn"
//                   value={scenarioSettings.timePerTurn}
//                   onChange={handleScenarioSettingChange}
//                   label="Time per Turn"
//                 >
//                   {turnTimes.map((time) => (
//                     <MenuItem key={time} value={time}>
//                       {time} seconds
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12} md={6}>
//               <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
//                 <InputLabel>Number of Turns</InputLabel>
//                 <Select
//                   name="turnCycles"
//                   value={scenarioSettings.turnCycles}
//                   onChange={handleScenarioSettingChange}
//                   label="Number of Turns"
//                 >
//                   {turnCyclesOptions.map((cycles) => (
//                     <MenuItem key={cycles} value={cycles}>
//                       {cycles} {cycles === 1 ? 'turn' : 'turns'}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
//           </Grid>
//         </Paper>

//         {/* Word Bank */}
//         <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
//           <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
//             Word Bank
//           </Typography>

//           <Box display="flex" alignItems="center" mb={2}>
//             <TextField
//               fullWidth
//               variant="outlined"
//               label="Add Word"
//               placeholder="Enter a word students will need to use"
//               value={newWord}
//               onChange={(e) => setNewWord(e.target.value)}
//               sx={{ mr: 1 }}
//             />
//             <Button
//               variant="contained"
//               startIcon={<Add />}
//               onClick={handleAddWord}
//               sx={{
//                 backgroundColor: '#5F4B8B',
//                 height: '56px',
//                 minWidth: '100px',
//                 whiteSpace: 'nowrap',
//                 '&:hover': { backgroundColor: '#4a3a6d' },
//               }}
//             >
//               Add
//             </Button>
//           </Box>

//           {scenarioSettings.wordBank.length > 0 ? (
//             <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
//               {scenarioSettings.wordBank.map((word, index) => (
//                 <ListItem
//                   key={index}
//                   sx={{
//                     backgroundColor: '#f9f9f9',
//                     mb: 1,
//                     borderRadius: '8px',
//                   }}
//                 >
//                   <ListItemText primary={word} />
//                   <ListItemSecondaryAction>
//                     <IconButton edge="end" onClick={() => handleDeleteWord(index)} color="error">
//                       <Delete />
//                     </IconButton>
//                   </ListItemSecondaryAction>
//                 </ListItem>
//               ))}
//             </List>
//           ) : (
//             <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
//               Word bank is empty. Students will need to come up with their own vocabulary.
//             </Typography>
//           )}
//         </Paper>

//         {/* Background Image */}
//         <Paper elevation={0} sx={{ borderRadius: '12px', p: 4, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
//           <Typography variant="h6" fontWeight="bold" mb={3} color="#5F4B8B">
//             Background Image
//           </Typography>

//           <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//             Select an image that represents your scenario context (e.g., Airport, Classroom, Office, Café).
//           </Typography>

//           <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
//             <Button
//               variant="outlined"
//               component="label"
//               startIcon={<ImageIcon />}
//               sx={{
//                 borderColor: '#5F4B8B',
//                 color: '#5F4B8B',
//                 '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
//                 textTransform: 'none',
//                 borderRadius: '8px',
//                 py: 1
//               }}
//             >
//               Upload Image
//               <input
//                 type="file"
//                 hidden
//                 accept="image/*"
//                 onChange={handleImageChange}
//               />
//             </Button>
            
//             <Typography variant="caption" color="text.secondary">
//               Maximum size: 5MB. Recommended size: 1920x1080px
//             </Typography>
//           </Box>

//           {imagePreview && (
//             <Box
//               sx={{
//                 mt: 3,
//                 borderRadius: '8px',
//                 overflow: 'hidden',
//                 maxWidth: '100%',
//                 maxHeight: '300px',
//                 border: '1px solid #e0e0e0',
//               }}
//             >
//               <img
//                 src={imagePreview}
//                 alt="Background preview"
//                 style={{ width: '100%', objectFit: 'contain' }}
//               />
//             </Box>
//           )}
//         </Paper>
//       </Container>

//       <PublishConfirmation
//         open={publishDialogOpen}
//         onClose={() => setPublishDialogOpen(false)}
//         onConfirm={handleConfirmPublish}
//         title={formData.title || 'this content'}
//         loading={loading}
//       />
//     </Box>
//   );
// };

// export default UploadContent;
