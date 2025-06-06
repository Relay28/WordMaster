// forms/ScenarioDetailsForm.jsx
import React from 'react';
import { 
  Box,
  Grid, 
  TextField,
  useTheme,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
      
      <Grid container spacing={3} >
        <Grid item xs={12} width={350}> 
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
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} width={800}>
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
              },
            }}
          />
        </Grid>
        
        <Grid item xs={12} width={200}>
          <FormControl fullWidth>
            <InputLabel>Background Theme Color</InputLabel>
            <Select
              name="backgroundTheme"
              value={formData.backgroundTheme || 'blue'}
              onChange={handleInputChange}
              label="Background Theme Color"
              error={!!errors.backgroundTheme}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            >
              <MenuItem value="blue">Blue</MenuItem>
              <MenuItem value="green">Green</MenuItem>
              <MenuItem value="purple">Purple</MenuItem>
              <MenuItem value="red">Red</MenuItem>
              <MenuItem value="yellow">Yellow</MenuItem>
              <MenuItem value="orange">Orange</MenuItem>
              <MenuItem value="teal">Teal</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScenarioDetailsForm;