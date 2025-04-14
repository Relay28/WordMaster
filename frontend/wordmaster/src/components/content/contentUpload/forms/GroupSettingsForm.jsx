
// forms/GroupSettingsForm.jsx
import React, { useState } from 'react';
import { 
  Paper, Typography, Grid, TextField, Button, Box, 
  FormControl, InputLabel, Select, MenuItem, IconButton, Paper as RolePaper
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

// Update group sizes to match SRS requirements
const studentGroupSizes = [
  { value: 5, label: "Small Group (2-5 students)" },
  { value: 10, label: "Medium Group (6-10 students)" },
  { value: 20, label: "Large Group (11-20 students)" }
];

const GroupSettingsForm = ({ scenarioSettings, setScenarioSettings, handleScenarioSettingChange }) => {
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
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Group Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Number of Students per Group</InputLabel>
            <Select
              name="studentsPerGroup"
              value={scenarioSettings.studentsPerGroup}
              onChange={handleScenarioSettingChange}
              label="Number of Students per Group"
            >
              {studentGroupSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight="medium" mb={1}>
            Custom Roles
          </Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField 
              fullWidth
              variant="outlined"
              label="Add a role"
              placeholder="E.g., Mage, Warrior, Healer"
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
              Add Role
            </Button>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            {scenarioSettings.roles.length > 0 ? (
              <Grid container spacing={1}>
                {scenarioSettings.roles.map((role, index) => (
                  <Grid item key={index}>
                    <RolePaper
                      sx={{
                        py: 1,
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f0edf5',
                        borderRadius: '20px',
                      }}
                    >
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {role}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(index)}
                        sx={{ padding: '2px' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </RolePaper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No roles added yet. Students will be assigned roles randomly.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GroupSettingsForm;
