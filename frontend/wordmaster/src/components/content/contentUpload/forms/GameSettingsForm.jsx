// forms/GameSettingsForm.jsx
import React from 'react';
import { Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const turnTimes = [15, 30, 45, 60, 90, 120];
const turnCyclesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const GameSettingsForm = ({ scenarioSettings, handleScenarioSettingChange }) => {
  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Game Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Time per Turn (Seconds)</InputLabel>
            <Select
              name="timePerTurn"
              value={scenarioSettings.timePerTurn}
              onChange={handleScenarioSettingChange}
              label="Time per Turn (Seconds)"
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
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Turn Cycles</InputLabel>
            <Select
              name="turnCycles"
              value={scenarioSettings.turnCycles}
              onChange={handleScenarioSettingChange}
              label="Turn Cycles"
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
    </Paper>
  );
};

export default GameSettingsForm;
