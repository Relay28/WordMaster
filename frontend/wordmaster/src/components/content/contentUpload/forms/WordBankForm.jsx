// forms/WordBankForm.jsx
import React, { useState } from 'react';
import { 
  Paper, Typography, Box, TextField, Button, 
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  CircularProgress, Tooltip
} from '@mui/material';
import { Add, Delete, Info } from '@mui/icons-material';
import axios from 'axios';
import API_URL from '../../../../services/apiConfig';
import { useUserAuth } from '../../../context/UserAuthContext';

const WordBankForm = ({ scenarioSettings, setScenarioSettings, errors }) => {
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(false);
  const { getToken } = useUserAuth();

  const enrichWord = async (word) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.post(`${API_URL}/api/wordbank/enrich`, 
        { word }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      return {
        word: response.data.word,
        description: response.data.description,
        exampleUsage: response.data.exampleUsage
      };
    } catch (error) {
      console.error("Error enriching word:", error);
      return { word, description: "No description available", exampleUsage: "No example available" };
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (newWord.trim() !== '') {
      const enrichedWord = await enrichWord(newWord.trim());
      
      setScenarioSettings({
        ...scenarioSettings,
        wordBank: [...scenarioSettings.wordBank, enrichedWord]
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
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, mb: 4, backgroundColor: 'white' }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Word Bank
      </Typography>
      
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
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Add Word'}
        </Button>
      </Box>
      
      {scenarioSettings.wordBank.length > 0 ? (
        <List>
          {scenarioSettings.wordBank.map((wordItem, index) => {
            const word = typeof wordItem === 'string' ? wordItem : wordItem.word;
            const description = wordItem.description || "No description available";
            const example = wordItem.exampleUsage || "No example available";
            
            return (
              <Tooltip
                key={index}
                title={
                  <React.Fragment>
                    <Typography color="inherit" variant="subtitle2">Description:</Typography>
                    <Typography variant="body2">{description}</Typography>
                    <Typography color="inherit" variant="subtitle2" sx={{ mt: 1 }}>Example:</Typography>
                    <Typography variant="body2" fontStyle="italic">{example}</Typography>
                  </React.Fragment>
                }
              >
                <ListItem
                  sx={{
                    backgroundColor: '#f9f9f9',
                    mb: 1,
                    borderRadius: '8px',
                    position: 'relative',
                  }}
                >
                  <ListItemText primary={word} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleDeleteWord(index)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No words added to the word bank yet. Students will need to come up with their own words.
        </Typography>
      )}
    </Paper>
  );
};

export default WordBankForm;