import React from 'react';
import { Box, Typography, TextField, IconButton, Divider, Grid } from '@mui/material';
import { Edit, Delete, Save, Cancel, Class, Person, Description } from '@mui/icons-material';

const ClassroomInfoSection = ({
  classroom,
  editMode,
  updatedData,
  handleDataChange,
  handleUpdateClassroom,
  handleDeleteClassroom,
  setEditMode,
  isClassroomTeacher,
  loading,
  pixelText,
  pixelHeading
}) => {
  return (
    <Box sx={{
      p: 3,
      mb: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      border: '4px solid #5F4B8B',
      borderRadius: '6px',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
        opacity: 0.8
      }
    }} component={Box}>
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
              InputProps={{ style: pixelText }}
              InputLabelProps={{ style: pixelText }}
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
              InputProps={{ style: pixelText }}
              InputLabelProps={{ style: pixelText }}
            />
          </Box>
        ) : (
          <Box>
            <Typography sx={{ ...pixelHeading, fontSize: '20px', mb: 1 }}>
              {classroom.name}
            </Typography>
            {classroom.description && (
              <Typography sx={{ ...pixelText, color: '#4a5568' }}>
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
                  sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                >
                  <Save />
                </IconButton>
                <IconButton 
                  color="secondary" 
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                  sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                >
                  <Cancel />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton 
                  color="primary" 
                  onClick={() => setEditMode(true)}
                  sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                >
                  <Edit />
                </IconButton>
                <IconButton 
                  color="error" 
                  onClick={handleDeleteClassroom}
                  disabled={loading}
                  sx={{ '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s ease' }}
                >
                  <Delete />
                </IconButton>
              </>
            )}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2.5, borderColor: 'rgba(95, 75, 139, 0.3)' }} />

      <Grid container spacing={3} sx={{ mt: 1, mb: 0.3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Class sx={{ color: '#5F4B8B', fontSize: '20px' }} />
            <Typography sx={{ ...pixelText }}>
              <strong>CODE:</strong> {classroom.enrollmentCode}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Person sx={{ color: '#5F4B8B', fontSize: '20px' }} />
            <Typography sx={{ ...pixelText }}>
              <strong>TEACHER:</strong> {classroom.teacher.fname} {classroom.teacher.lname}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Description sx={{ color: '#5F4B8B', fontSize: '20px' }} />
            <Typography sx={{ ...pixelText }}>
              <strong>STUDENTS:</strong> {classroom.studentCount}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClassroomInfoSection;
