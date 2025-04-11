// src/pages/ClassroomDetailsPage.js
import React from 'react';
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
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Chip,
  Container,
  Grid
} from '@mui/material';
import { Edit, Delete, Save, Cancel, Person, ArrowBack, Class, Description } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import { useClassroomDetails } from './ClassroomDetailFunctions';
import { useNavigate } from 'react-router-dom';

const ClassroomDetailsPage = () => {
  const { authChecked, user, getToken } = useUserAuth();
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
    isTeacher,
    isClassroomTeacher
  } = useClassroomDetails(authChecked, user, getToken);
  
  const navigate = useNavigate();

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
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
            Classroom Details
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Error display */}
        {error && (
          <Box mb={3}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Classroom Info Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="h3" component="h1" gutterBottom>
                  {classroom.name}
                </Typography>
                {classroom.description && (
                  <Typography variant="body1" paragraph>
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
                    >
                      <Save />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => setEditMode(false)}
                      disabled={loading}
                    >
                      <Cancel />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton 
                      color="primary" 
                      onClick={() => setEditMode(true)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={handleDeleteClassroom}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Class color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Enrollment Code:</strong> {classroom.enrollmentCode}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Person color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Teacher:</strong> {classroom.teacher.fname} {classroom.teacher.lname}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center">
                <Description color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  <strong>Students:</strong> {classroom.studentCount}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Members Section */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Members</Typography>
            <Chip 
              label={`${classroom.studentCount + 1} total`} 
              color="primary"
              size="small"
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {/* Teacher Card */}
          <List>
            <ListItem sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <ListItemAvatar>
                <Avatar>
                  {classroom.teacher.fname?.charAt(0)}{classroom.teacher.lname?.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${classroom.teacher.fname} ${classroom.teacher.lname}`}
                secondary="Teacher"
              />
              <Chip label="Owner" color="primary" size="small" />
            </ListItem>

            {/* Students List */}
            {members.length > 0 ? (
              members.map((member) => (
                <ListItem key={member.id}>
                  <ListItemAvatar>
                    <Avatar>
                      {member.fname?.charAt(0)}{member.lname?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${member.fname} ${member.lname}`}
                    secondary="Student"
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                No students enrolled yet
              </Typography>
            )}
          </List>
        </Paper>
      </Container>
    </Box>
  );
};

export default ClassroomDetailsPage;