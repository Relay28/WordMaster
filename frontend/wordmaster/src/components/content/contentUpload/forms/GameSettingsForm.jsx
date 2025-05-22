// forms/GameSettingsForm.jsx
import React from 'react';
import { Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Box, Tooltip } from '@mui/material';

const turnTimes = [15, 30, 45, 60, 90, 120];
const turnCyclesOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]; // Added more options

const GameSettingsForm = ({ scenarioSettings, handleScenarioSettingChange }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Configure timing and duration for the game.
      </Typography>
      </Box>
      <Grid container spacing={3}> {/* Adjusted spacing */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="time-per-turn-label">Time per Turn (Seconds)</InputLabel>
            <Select
              labelId="time-per-turn-label"
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
            <InputLabel id="turn-cycles-label">Rounds / Total Turns</InputLabel> {/* Updated Label */}
            <Tooltip title="For multiplayer, this is 'Number of Rounds'. For single-player, this is 'Total Turns'.">
              <Select
                labelId="turn-cycles-label"
                name="turnCycles"
                value={scenarioSettings.turnCycles}
                onChange={handleScenarioSettingChange}
                label="Rounds / Total Turns" // Updated Label to match InputLabel
              >
                {turnCyclesOptions.map((cycles) => (
                  <MenuItem key={cycles} value={cycles}>
                    {cycles} {cycles === 1 ? 'Round/Turn' : 'Rounds/Turns'}
                  </MenuItem>
                ))}
              </Select>
            </Tooltip>
          </FormControl>
        </Grid>
      </Grid>
      </Box>
  );
};

export default GameSettingsForm;
