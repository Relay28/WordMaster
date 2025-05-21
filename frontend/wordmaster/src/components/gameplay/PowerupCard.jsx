
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar
} from '@mui/material';

const PowerUpCard = ({ card, isSelected, onSelect, isMyTurn }) => {
  return (
    <Card 
      sx={{ 
        width: 150, 
        height: 200,
        cursor: isMyTurn && !card.used ? 'pointer' : 'default',
        opacity: card.used ? 0.6 : 1,
        transform: isSelected ? 'scale(1.05)' : 'none',
        transition: 'transform 0.2s, opacity 0.2s',
        position: 'relative',
        overflow: 'visible',
        bgcolor: card.used ? '#f5f5f5' : '#ffffff'
      }}
      onClick={() => isMyTurn && !card.used && onSelect(card)}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          position: 'absolute', 
          top: -10, 
          right: -10, 
          width: 30, 
          height: 30, 
          borderRadius: '50%', 
          bgcolor: '#5F4B8B', 
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}>
          +{card.pointsBonus}
        </Box>
        
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 'bold', 
          fontSize: '1rem',
          mb: 1,
          color: card.used ? 'text.secondary' : 'text.primary'
        }}>
          {card.name}
        </Typography>
        
        <Typography variant="body2" sx={{ 
          flexGrow: 1,
          color: card.used ? 'text.secondary' : 'text.primary'
        }}>
          {card.description}
        </Typography>
        
        {card.used && (
          <Chip 
            label="Used" 
            size="small" 
            sx={{ 
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: '0.6rem'
            }} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PowerUpCard;