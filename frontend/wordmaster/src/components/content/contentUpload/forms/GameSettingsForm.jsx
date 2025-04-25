// forms/GameSettingsForm.jsx
import React from 'react';
import { Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const turnTimes = [15, 30, 45, 60, 90, 120];
const turnCyclesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const GameSettingsForm = ({ scenarioSettings, handleScenarioSettingChange }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
      Select time per turn and number of cycles
      </Typography>
      </Box>
      <Grid container spacing={45}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2,  minWidth: 170 }}>
            <InputLabel>Time per Turn (Seconds)</InputLabel>
            <Select
              name="timePerTurn"
              value={scenarioSettings.timePerTurn}
              onChange={handleScenarioSettingChange}
              label="Time per Turn (Seconds)"
              sx={{ width: '300%' }}
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
          <FormControl fullWidth variant="outlined" sx={{ mb: 2, minWidth: 140 }}>
            <InputLabel>Turn Cycles</InputLabel>
            <Select
              name="turnCycles"
              value={scenarioSettings.turnCycles}
              onChange={handleScenarioSettingChange}
              label="Turn Cycles"
              sx={{ width: '400%' }}
            >
              {turnCyclesOptions.map((cycles) => (
                <MenuItem key={cycles} value={cycles}>
                  {cycles} {cycles === 1 ? 'cycle' : 'cycles'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      </Box>
  );
};

export default GameSettingsForm;
