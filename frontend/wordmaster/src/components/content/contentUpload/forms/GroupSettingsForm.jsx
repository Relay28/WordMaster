import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton,
  Chip
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

const studentGroupSizes = [
  { value: 5, label: "Small Group (2-5 students)" },
  { value: 10, label: "Medium Group (6-10 students)" },
  { value: 20, label: "Large Group (11-20 students)" }
];

const GroupSettingsForm = ({ scenarioSettings, setScenarioSettings, handleScenarioSettingChange, errors }) => {
  const [newRole, setNewRole] = useState('');

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

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Configure student groups and roles
      </Typography>
      </Box>

      <Grid container spacing={20} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <FormControl fullWidth>
            <InputLabel>Number of Students per Group</InputLabel>
            <Select
              name="studentsPerGroup"
              value={scenarioSettings.studentsPerGroup}
              onChange={handleScenarioSettingChange}
              label="Number of Students per Group"
              sx={{ width: '150%' }}
            >
              {studentGroupSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sx={{ mt: -5.5 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Custom Roles
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" mb={2} sx={{minWidth: 500}}>
            <TextField 
              fullWidth
              variant="outlined"
              label="Add a role"
              placeholder="E.g., Leader, Researcher, Presenter"
              required
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              error={!!errors.roles}
              helperText={errors.roles}
              sx={{
                width: "500px", // Fixed width
                // OR maxWidth: "200px" (flexible but capped)
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddRole}
              sx={{
                height: '52px',
                minWidth: '60px',
                paddingLeft: '40px',
                paddingRight: '40px',
                whiteSpace: 'nowrap',
                backgroundColor: '#5F4B8B',
                '&:hover': { backgroundColor: '#4a3a6d' },
              }}
            >
              Add
            </Button>
          </Box>
          
          <Box>
            {scenarioSettings.roles.length > 0 ? (
              <Box
                display="grid"
                gridTemplateColumns="repeat(7, 1fr)" // 7 columns per row
                gap={1}
                sx={{
                  // Responsive fallback for smaller screens
                  '@media (max-width: 1200px)': {
                    gridTemplateColumns: 'repeat(4, 1fr)' // 4 columns on smaller screens
                  },
                  '@media (max-width: 600px)': {
                    gridTemplateColumns: 'repeat(2, 1fr)' // 2 columns on mobile
                  }
                }}
              >
                {scenarioSettings.roles.map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    onDelete={() => handleDeleteRole(index)}
                    deleteIcon={<span style={{ fontSize: '18px' }}>×</span>}
                    sx={{
                      backgroundColor: '#f0edf5',
                      borderRadius: '16px',
                      '& .MuiChip-deleteIcon': {
                        color: '#5F4B8B',
                        '&:hover': {
                          color: '#4a3a6d'
                        }
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No roles added yet. Students will be assigned roles randomly.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GroupSettingsForm;