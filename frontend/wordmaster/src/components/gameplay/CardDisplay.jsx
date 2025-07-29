import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';

// Import your card images (adjust paths as needed)
import Card1 from '../../assets/1c.png';
import Card2 from '../../assets/2c.png';
import Card3 from '../../assets/3c.png';
// Import all your card images...

/**
 * A card image map - maps card IDs to their imported images
 */
const cardImages = {
  'card-1': Card1,
  'card-2': Card2,
  'card-3': Card3,
  // Add all your cards here
};

/**
 * Helper function to provide examples based on card description
 */
const getCardExamples = (description) => {
  if (!description) return "";
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

/**
 * A reusable component to display power cards with hover effects
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

  // Get the appropriate image for this card
  const cardImage = cardImages[card.id] || Card1; // Fallback to Card1 if not found
  const examples = getCardExamples(card.description);

  return (
    <Tooltip 
      title={
        <Box sx={{ p: 1, maxWidth: 300 }}>
          <Typography sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            color: '#5F4B8B',
            fontSize: '1.1rem'
          }}>
            {card.name}
          </Typography>
          <Typography sx={{ 
            fontStyle: 'italic',
            fontSize: '0.9rem',
            mb: 1
          }}>
            {card.description}
          </Typography>
          {examples && (
            <Typography sx={{
              fontSize: '0.8rem',
              color: '#666',
              mb: 1,
              fontStyle: 'italic'
            }}>
              {examples}
            </Typography>
          )}
          <Chip 
            label={`+${card.pointsBonus} points`} 
            size="small" 
            sx={{ 
              bgcolor: '#5F4B8B',
              color: 'white',
              fontSize: '0.7rem'
            }}
          />
        </Box>
      }
      arrow
      placement="right"
    >
      <Box
        onClick={() => !disabled && !isProcessing && onUse(card.id)}
        sx={{
          position: 'relative',
          width: 120,
          height: 180,
          backgroundImage: `url(${cardImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '8px',
          border: isSelected ? '3px solid gold' : '1px solid rgba(0,0,0,0.2)',
          boxShadow: isSelected ? '0 0 15px rgba(255,215,0,0.7)' : '0 4px 8px rgba(0,0,0,0.2)',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: disabled ? 'none' : 'translateY(-5px) scale(1.05)',
            boxShadow: disabled ? 'none' : '0 8px 16px rgba(0,0,0,0.3)'
          },
          filter: disabled ? 'grayscale(80%)' : 'none',
          opacity: disabled ? 0.7 : 1
        }}
      >
        {/* Processing overlay */}
        {isProcessing && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
          }}>
            <CircularProgress size={24} color="inherit" />
          </Box>
        )}
        
        {/* Points badge */}
        <Chip
          label={`+${card.pointsBonus}`}
          size="small"
          sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            height: 20,
            fontSize: '10px',
            fontWeight: 'bold',
            bgcolor: '#5F4B8B',
            color: 'white',
            '& .MuiChip-label': { px: 1 }
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default CardDisplay;