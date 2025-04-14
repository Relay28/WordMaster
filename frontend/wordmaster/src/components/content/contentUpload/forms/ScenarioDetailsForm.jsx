
// forms/ScenarioDetailsForm.jsx
import React from 'react';
import { Paper, Typography, Grid, TextField } from '@mui/material';

const ScenarioDetailsForm = ({ formData, handleInputChange }) => {
  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
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
            placeholder="Enter a title for your scenario"
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
            placeholder="Provide a brief description of this scenario"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ScenarioDetailsForm;