import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';

/**
 * A reusable component to display and manage power cards
 */
const CardDisplay = ({ 
  card,
  isSelected,
  onUse,
  disabled = false,
  isProcessing = false,
  pixelText
}) => {
  if (!card) return null;

  // Function to provide more specific examples based on card type
  const getCardExamples = (description) => {
    if (description.includes("adjective"))
      return "Examples: beautiful, great, interesting, smart";
    if (description.includes("noun"))
      return "Examples: teacher, school, book, student";
    if (description.toLowerCase().includes("long"))
      return "Make sure your sentence has at least 30 characters";
    if (description.toLowerCase().includes("complex"))
      return "Use connecting words like: because, when, if, while";
    return "";
  };

  const examples = getCardExamples(card.description);
  
  return (
    <Tooltip 
      title={
        <Box sx={{ p: 1 }}>
          <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
            {card.description}
          </Typography>
          {examples && (
            <Typography sx={{ fontStyle: 'italic', fontSize: '0.9em' }}>
              {examples}
            </Typography>
          )}
        </Box>
      }
      arrow
      placement="right"
    >
      <Paper
        sx={{
          p: 1.5,
          borderRadius: '6px',
          bgcolor: isSelected ? 'rgba(95, 75, 139, 0.1)' : 'white',
          border: `1px solid ${isSelected ? '#5F4B8B' : '#e0e0e0'}`,
          boxShadow: isSelected ? '0 0 0 2px rgba(95, 75, 139, 0.3)' : 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          },
          cursor: disabled ? 'default' : 'pointer'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoFixHigh sx={{ color: '#5F4B8B', fontSize: '16px', mr: 0.5 }} />
            <Typography sx={{ 
              ...(pixelText || {}), 
              fontSize: '8px', 
              fontWeight: 'bold', 
              color: '#5F4B8B',
              textTransform: 'uppercase'
            }}>
              {card.name}
            </Typography>
          </Box>
          <Chip
            label={`+${card.pointsBonus}`}
            size="small"
            sx={{ 
              height: 18, 
              fontSize: '8px', 
              '& .MuiChip-label': { px: 1 },
              bgcolor: '#5F4B8B',
              color: 'white'
            }}
          />
        </Box>
        <Typography sx={{ 
          ...(pixelText || {}), 
          fontSize: '7px', 
          color: '#666', 
          mb: 1,
          minHeight: '2.4em', // Ensure consistent height
        }}>
          {card.description}
        </Typography>
        <Button
          fullWidth
          size="small"
          variant="contained"
          disabled={disabled || isProcessing}
          onClick={() => onUse(card.id)}
          sx={{
            bgcolor: '#5F4B8B',
            fontSize: '6px',
            py: 0.5,
            mt: 0.5,
            textTransform: 'uppercase',
            '&:hover': {
              bgcolor: '#4a3a6d'
            },
            '&.Mui-disabled': {
              bgcolor: '#c5c5c5'
            }
          }}
        >
          {isProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={10} sx={{ mr: 1, color: 'white' }} />
              <span>Processing...</span>
            </Box>
          ) : (
            'Use Card'
          )}
        </Button>
      </Paper>
    </Tooltip>
  );
};

export default CardDisplay;