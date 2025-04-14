// forms/ScenarioDetailsForm.jsx
import React from 'react';
import { 
  Box,
  Grid, 
  TextField,
  useTheme,
  Typography
} from '@mui/material';

const ScenarioDetailsForm = ({ formData, handleInputChange, errors }) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
      <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            lineHeight: 1.6
          }}
        >
          Provide basic details about your scenario
        </Typography>
        </Box>
      <Grid container spacing={30}>
      
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
            error={!!errors.title}
            helperText={errors.title}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                width:'200%',
              },
            }}
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Scenario Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            variant="outlined"
            multiline
            required
            rows={4}
            placeholder="Provide a brief description of this scenario"
            error={!!errors.description}
            helperText={errors.description}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                width:'303%',
              },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScenarioDetailsForm;