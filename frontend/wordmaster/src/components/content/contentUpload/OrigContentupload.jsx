// Ibilin rani inkaso makabo
//  import React, { useState, useEffect } from 'react';
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
//   Divider,
//   Select,
//   InputLabel,
//   FormControl,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemSecondaryAction
// } from '@mui/material';
// import { ArrowBack, Save, Add, Delete, Image as ImageIcon } from '@mui/icons-material';
// import { useUserAuth } from '../context/UserAuthContext';
// import contentService from '../../services/contentService';

// // Update group sizes to match SRS requirements
// const studentGroupSizes = [
//   { value: 5, label: "Small Group (2-5 students)" },
//   { value: 10, label: "Medium Group (6-10 students)" },
//   { value: 20, label: "Large Group (11-20 students)" }
// ];
// const turnTimes = [15, 30, 45, 60, 90, 120];
// const turnCyclesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// const ContentUpload = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user, getToken } = useUserAuth();
  
//   // Get classroom ID from URL query parameters if it exists
//   const queryParams = new URLSearchParams(location.search);
//   const classroomId = queryParams.get('classroomId');
  
//   console.log("Creating content for classroom:", classroomId); // Debug logging

//   // Form state
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     backgroundTheme: 'default',
//     published: false
//   });
  
//   // Specific scenario settings with updated default value
//   const [scenarioSettings, setScenarioSettings] = useState({
//     studentsPerGroup: 5, // Default to small group
//     roles: [],
//     timePerTurn: 30,
//     wordBank: [],
//     turnCycles: 3,
//   });
  
//   // Background image handling
//   const [imagePreview, setImagePreview] = useState(null);
  
//   // Form management
//   const [newRole, setNewRole] = useState('');
//   const [newWord, setNewWord] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // Handle input changes for main form
//   const handleInputChange = (e) => {
//     const { name, value, checked } = e.target;
//     setFormData({
//       ...formData,
//       [name]: name === 'published' ? checked : value
//     });
//   };

//   // Handle changes for scenario settings
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

//   // Form validation
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

//   // Prepare data for submission
//   const prepareContentData = () => {
//     return JSON.stringify({
//       wordBank: scenarioSettings.wordBank,
//       roles: scenarioSettings.roles,
//       backgroundImage: imagePreview
//     });
//   };

//   const prepareGameConfig = () => {
//     return JSON.stringify({
//       studentsPerGroup: scenarioSettings.studentsPerGroup,
//       timePerTurn: scenarioSettings.timePerTurn,
//       turnCycles: scenarioSettings.turnCycles
//     });
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       const token = await getToken();
//       const dataToSubmit = { 
//         ...formData,
//         contentData: prepareContentData(),
//         gameElementConfig: prepareGameConfig()
//       };
      
//       let result;
//       console.log("Submitting content with classroomId:", classroomId); // Debug logging
      
//       // If classroomId exists, create content for that classroom
//       if (classroomId) {
//         result = await contentService.createContentForClassroom(
//           dataToSubmit, user.id, classroomId, token
//         );
//         navigate(`/classroom/${classroomId}`, { 
//           state: { 
//             message: `Content "${formData.title}" created successfully.`,
//             success: true
//           }
//         });
//       } else {
//         // Otherwise create content normally
//         result = await contentService.createContent(
//           dataToSubmit, user.id, token
//         );
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

//   // Handle cancel/back navigation
//   const handleCancel = () => {
//     if (classroomId) {
//       navigate(`/classroom/${classroomId}`);
//     } else {
//       navigate('/content/dashboard');
//     }
//   };

//   return (
//     <Box sx={{ 
//       display: 'flex',
//       flexDirection: 'column',
//       minHeight: '100vh',
//       backgroundColor: '#f9f9f9',
//     }}>
//       {/* Header */}
//       <Box sx={{ 
//         backgroundColor: 'white',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
//           <Button
//             variant="contained"
//             color="primary"
//             startIcon={<Save />}
//             onClick={handleSubmit}
//             disabled={loading}
//             sx={{
//               backgroundColor: '#5F4B8B',
//               '&:hover': { backgroundColor: '#4a3a6d' },
//               textTransform: 'none',
//               borderRadius: '8px',
//               px: 3,
//               py: 1
//             }}
//           >
//             {loading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
//           </Button>
//         </Box>
//       </Box>

//       {/* Main Content */}
//       <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
//         {error && (
//           <Alert severity="error" sx={{ mb: 3 }}>
//             {error}
//           </Alert>
//         )}
        
//         <form onSubmit={handleSubmit}>
//           <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
//             <Typography variant="h6" fontWeight="bold" mb={3}>
//               Scenario Details
//             </Typography>
            
//             <Grid container spacing={3}>
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Scenario Title"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleInputChange}
//                   required
//                   variant="outlined"
//                   placeholder="Enter a title for your scenario"
//                   sx={{ mb: 2 }}
//                 />
//               </Grid>
              
//               <Grid item xs={12}>
//                 <TextField
//                   fullWidth
//                   label="Scenario Description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   variant="outlined"
//                   multiline
//                   rows={3}
//                   placeholder="Provide a brief description of this scenario"
//                 />
//               </Grid>
//             </Grid>
//           </Paper>
          
//           <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
//             <Typography variant="h6" fontWeight="bold" mb={3}>
//               Group Settings
//             </Typography>
            
//             <Grid container spacing={3}>
//               <Grid item xs={12} md={6}>
//                 <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
//                   <InputLabel>Number of Students per Group</InputLabel>
//                   <Select
//                     name="studentsPerGroup"
//                     value={scenarioSettings.studentsPerGroup}
//                     onChange={handleScenarioSettingChange}
//                     label="Number of Students per Group"
//                   >
//                     {studentGroupSizes.map((size) => (
//                       <MenuItem key={size.value} value={size.value}>
//                         {size.label}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
              
//               <Grid item xs={12}>
//                 <Typography variant="subtitle1" fontWeight="medium" mb={1}>
//                   Custom Roles
//                 </Typography>
//                 <Box display="flex" alignItems="center" mb={2}>
//                   <TextField 
//                     fullWidth
//                     variant="outlined"
//                     label="Add a role"
//                     placeholder="E.g., Mage, Warrior, Healer"
//                     value={newRole}
//                     onChange={(e) => setNewRole(e.target.value)}
//                     sx={{ mr: 1 }}
//                   />
//                   <Button
//                     variant="contained"
//                     startIcon={<Add />}
//                     onClick={handleAddRole}
//                     sx={{
//                       backgroundColor: '#5F4B8B',
//                       height: '56px',
//                       minWidth: '100px',
//                       whiteSpace: 'nowrap',
//                       '&:hover': { backgroundColor: '#4a3a6d' },
//                     }}
//                   >
//                     Add Role
//                   </Button>
//                 </Box>
                
//                 <Box sx={{ mb: 2 }}>
//                   {scenarioSettings.roles.length > 0 ? (
//                     <Grid container spacing={1}>
//                       {scenarioSettings.roles.map((role, index) => (
//                         <Grid item key={index}>
//                           <Paper
//                             sx={{
//                               py: 1,
//                               px: 2,
//                               display: 'flex',
//                               alignItems: 'center',
//                               backgroundColor: '#f0edf5',
//                               borderRadius: '20px',
//                             }}
//                           >
//                             <Typography variant="body2" sx={{ mr: 1 }}>
//                               {role}
//                             </Typography>
//                             <IconButton
//                               size="small"
//                               onClick={() => handleDeleteRole(index)}
//                               sx={{ padding: '2px' }}
//                             >
//                               <Delete fontSize="small" />
//                             </IconButton>
//                           </Paper>
//                         </Grid>
//                       ))}
//                     </Grid>
//                   ) : (
//                     <Typography variant="body2" color="text.secondary">
//                       No roles added yet. Students will be assigned roles randomly.
//                     </Typography>
//                   )}
//                 </Box>
//               </Grid>
//             </Grid>
//           </Paper>
          
//           <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
//             <Typography variant="h6" fontWeight="bold" mb={3}>
//               Game Settings
//             </Typography>
            
//             <Grid container spacing={3}>
//               <Grid item xs={12} md={6}>
//                 <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
//                   <InputLabel>Time per Turn (Seconds)</InputLabel>
//                   <Select
//                     name="timePerTurn"
//                     value={scenarioSettings.timePerTurn}
//                     onChange={handleScenarioSettingChange}
//                     label="Time per Turn (Seconds)"
//                   >
//                     {turnTimes.map((time) => (
//                       <MenuItem key={time} value={time}>
//                         {time} seconds
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
//                   <InputLabel>Turn Cycles</InputLabel>
//                   <Select
//                     name="turnCycles"
//                     value={scenarioSettings.turnCycles}
//                     onChange={handleScenarioSettingChange}
//                     label="Turn Cycles"
//                   >
//                     {turnCyclesOptions.map((cycles) => (
//                       <MenuItem key={cycles} value={cycles}>
//                         {cycles} {cycles === 1 ? 'cycle' : 'cycles'}
//                       </MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//             </Grid>
//           </Paper>
          
//           <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
//             <Typography variant="h6" fontWeight="bold" mb={3}>
//               Word Bank
//             </Typography>
            
//             <Box display="flex" alignItems="center" mb={2}>
//               <TextField 
//                 fullWidth
//                 variant="outlined"
//                 label="Add a word"
//                 placeholder="Enter a word for the word bank"
//                 value={newWord}
//                 onChange={(e) => setNewWord(e.target.value)}
//                 sx={{ mr: 1 }}
//               />
//               <Button
//                 variant="contained"
//                 startIcon={<Add />}
//                 onClick={handleAddWord}
//                 sx={{
//                   backgroundColor: '#5F4B8B',
//                   height: '56px',
//                   minWidth: '100px',
//                   whiteSpace: 'nowrap',
//                   '&:hover': { backgroundColor: '#4a3a6d' },
//                 }}
//               >
//                 Add Word
//               </Button>
//             </Box>
            
//             {scenarioSettings.wordBank.length > 0 ? (
//               <List>
//                 {scenarioSettings.wordBank.map((word, index) => (
//                   <ListItem
//                     key={index}
//                     sx={{
//                       backgroundColor: '#f9f9f9',
//                       mb: 1,
//                       borderRadius: '8px',
//                     }}
//                   >
//                     <ListItemText primary={word} />
//                     <ListItemSecondaryAction>
//                       <IconButton edge="end" onClick={() => handleDeleteWord(index)}>
//                         <Delete />
//                       </IconButton>
//                     </ListItemSecondaryAction>
//                   </ListItem>
//                 ))}
//               </List>
//             ) : (
//               <Typography variant="body2" color="text.secondary">
//                 No words added to the word bank yet. Students will need to come up with their own words.
//               </Typography>
//             )}
//           </Paper>
          
//           <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, backgroundColor: 'white' }}>
//             <Typography variant="h6" fontWeight="bold" mb={3}>
//               Background Image
//             </Typography>
            
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//               Choose an image that represents your scenario context (e.g., Airport, Classroom, Office, Café, Hospital).
//             </Typography>
            
//             <Box sx={{ mb: 2 }}>
//               <Button
//                 variant="outlined"
//                 component="label"
//                 startIcon={<ImageIcon />}
//                 sx={{
//                   borderColor: '#5F4B8B',
//                   color: '#5F4B8B',
//                   '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
//                   textTransform: 'none',
//                   borderRadius: '8px'
//                 }}
//               >
//                 Upload Background Image
//                 <input
//                   type="file"
//                   hidden
//                   accept="image/*"
//                   onChange={handleImageChange}
//                 />
//               </Button>
//             </Box>
            
//             <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
//               Upload an image to use as the scenario background. Maximum size: 5MB. Images will be resized if needed.
//             </Typography>
            
//             {imagePreview && (
//               <Box
//                 sx={{
//                   mt: 2,
//                   borderRadius: '8px',
//                   overflow: 'hidden',
//                   maxWidth: '100%',
//                   maxHeight: '300px',
//                   textAlign: 'center'
//                 }}
//               >
//                 <img
//                   src={imagePreview}
//                   alt="Background preview"
//                   style={{ 
//                     maxWidth: '100%', 
//                     maxHeight: '300px', 
//                     objectFit: 'contain',
//                     border: '1px solid #eee',
//                     borderRadius: '8px'
//                   }}
//                   onError={(e) => {
//                     console.error("Error loading image preview:", e);
//                     e.target.onerror = null;
//                     e.target.src = "https://via.placeholder.com/800x450?text=Preview+Not+Available";
//                   }}
//                 />
//               </Box>
//             )}
//           </Paper>
//         </form>
//       </Container>
//     </Box>
//   );
// };

// export default ContentUpload;