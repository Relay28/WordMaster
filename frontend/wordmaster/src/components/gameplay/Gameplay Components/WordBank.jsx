import React from 'react';
import { Paper, Box, Typography, Chip, Tooltip } from '@mui/material';
import { sanitizePlainText } from '../../../utils/sanitize';

const WordBank = ({ wordBank = [], onWordClick, pixelHeading, pixelText, getWordBankCount }) => {
  return (
    <Paper sx={{ position: 'absolute', bottom: 0, left: 0, width: '97%', p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderTop: '4px solid #5F4B8B', maxHeight: '15%', overflowY: 'auto', display: 'flex', flexDirection: 'column', zIndex: 5, borderRadius: '0 0 16px 16px', boxShadow: '0 -4px 8px rgba(0,0,0,0.1)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ ...pixelHeading, color: '#5F4B8B', fontSize: '14px', textShadow: '1px 1px 0px rgba(255,255,255,0.8)' }}>WORD BANK</Typography>
          {wordBank.length > 0 && (
            <Typography sx={{ ...pixelText, fontSize: '8px', color: '#5F4B8B', opacity: 0.6, mt: 0.5 }}>
              CLICK A WORD TO ADD IT TO YOUR MESSAGE
            </Typography>
          )}
        </Box>
        <Chip label={`${getWordBankCount()} words`} size="small" sx={{ bgcolor: 'rgba(95, 75, 139, 0.2)', borderRadius: '8px', height: '22px', border: '2px solid #5F4B8B', '& .MuiChip-label': { px: 1.5, fontSize: '0.7rem', fontWeight: 'bold', color: '#5F4B8B' } }} />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pb: 1 }}>
        {wordBank.map((wordItem, index) => {
          const word = typeof wordItem === 'string' ? wordItem : wordItem.word;
          const label = sanitizePlainText(word);
          const desc = sanitizePlainText((wordItem.description || 'NO DESCRIPTION AVAILABLE'));
          const example = wordItem.exampleUsage ? sanitizePlainText(wordItem.exampleUsage) : '';
          return (
            <Tooltip key={index} title={
              <Box sx={{ ...pixelText, p: 1 }}>
                <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                  {desc}
                </Typography>
                {example && (
                  <Typography sx={{ fontStyle: 'italic' }}>
                    EXAMPLE: "{example}"
                  </Typography>
                )}
              </Box>
            } arrow placement="top">
              <Chip label={label} onClick={() => onWordClick(word)} sx={{ ...pixelText, backgroundColor: 'white', border: '2px solid #5F4B8B', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', py: 0.5, px: 0.5, cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { backgroundColor: '#f0edf5', transform: 'translateY(-2px) scale(1.05)', boxShadow: '3px 3px 0px rgba(95, 75, 139, 0.3)' } }} />
            </Tooltip>
          );
        })}
        {wordBank.length === 0 && (
          <Typography sx={{ ...pixelText, color: '#5F4B8B', width: '100%', textAlign: 'center', py: 2, opacity: 0.7 }}>
            NO WORDS AVAILABLE IN WORD BANK.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default WordBank;
