// forms/WordBankForm.jsx
import React, { useState } from 'react';
import { 
  Paper, Typography, Box, TextField, Button, 
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton 
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

const WordBankForm = ({ scenarioSettings, setScenarioSettings, errors }) => {
  const [newWord, setNewWord] = useState('');

  const handleAddWord = () => {
    if (newWord.trim() !== '') {
      setScenarioSettings({
        ...scenarioSettings,
        wordBank: [...scenarioSettings.wordBank, newWord.trim()]
      });
      setNewWord('');
    }
  };

  const handleDeleteWord = (index) => {
    const updatedWordBank = [...scenarioSettings.wordBank];
    updatedWordBank.splice(index, 1);
    setScenarioSettings({
      ...scenarioSettings,
      wordBank: updatedWordBank
    });
  };

  return (
    <Box>
      
      <Box display="flex" alignItems="center" mb={2}>
        <TextField 
          fullWidth
          variant="outlined"
          label="Add a word"
          placeholder="Enter a word for the word bank"
          value={newWord}
          error={!!errors.wordBank}
            helperText={errors.wordBank}
          onChange={(e) => setNewWord(e.target.value)}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddWord}
          sx={{
            backgroundColor: '#5F4B8B',
            height: '56px',
            minWidth: '100px',
            whiteSpace: 'nowrap',
            '&:hover': { backgroundColor: '#4a3a6d' },
          }}
        >
          Add Word
        </Button>
      </Box>
      
      {scenarioSettings.wordBank.length > 0 ? (
        <List>
          {scenarioSettings.wordBank.map((word, index) => (
            <ListItem
              key={index}
              sx={{
                backgroundColor: '#f9f9f9',
                mb: 1,
                borderRadius: '8px',
              }}
            >
              <ListItemText primary={word} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDeleteWord(index)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No words added to the word bank yet. Please add atleast three words to proceed.
        </Typography>
      )}
  </Box>
  );
};

export default WordBankForm;