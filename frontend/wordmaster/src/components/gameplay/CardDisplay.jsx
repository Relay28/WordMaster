// import React, { useState } from 'react';
// import {
//   Box,
//   Typography,
//   Chip,
//   Tooltip,
//   CircularProgress
// } from '@mui/material';

// // Import your card images (adjust paths as needed)
// import Card1 from '../../assets/1c.png';
// import Card2 from '../../assets/2c.png';
// import Card3 from '../../assets/3c.png';
// // Import all your card images...

// /**
//  * A card image map - maps card IDs to their imported images
//  */
// const cardImages = {
//   'card-1': Card1,
//   'card-2': Card2,
//   'card-3': Card3,
//   // Add all your cards here
// };

// /**
//  * Helper function to provide examples based on card description
//  */
// const getCardExamples = (description) => {
//   if (!description) return "";
//   if (description.includes("adjective"))
//     return "Examples: beautiful, great, interesting, smart";
//   if (description.includes("noun"))
//     return "Examples: teacher, school, book, student";
//   if (description.toLowerCase().includes("long"))
//     return "Make sure your sentence has at least 30 characters";
//   if (description.toLowerCase().includes("complex"))
//     return "Use connecting words like: because, when, if, while";
//   return "";
// };

// /**
//  * A reusable component to display power cards with hover effects
//  */
// const CardDisplay = ({
//   card,
//   isSelected,
//   onUse,
//   disabled = false,
//   isProcessing = false,
//   pixelText
// }) => {
//   const [hovered, setHovered] = useState(false);

//   if (!card) return null;

//   const cardImage = cardImages[card.id] || Card1;
//   const examples = getCardExamples(card.description);

//   return (
//     <Box
//       onMouseEnter={() => setHovered(true)}
//       onMouseLeave={() => setHovered(false)}
//       onClick={() => !disabled && !isProcessing && onUse(card.id)}
//       sx={{
//         position: 'relative',
//         width: 150,
//         height: 225,
//         backgroundImage: `url(${cardImage})`,
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         borderRadius: '8px',
//         border: isSelected ? '3px solid gold' : '1px solid rgba(0,0,0,0.2)',
//         boxShadow: isSelected ? '0 0 15px rgba(255,215,0,0.7)' : '0 4px 8px rgba(0,0,0,0.2)',
//         cursor: disabled ? 'default' : 'pointer',
//         transition: 'all 0.3s ease',
//         '&:hover': {
//           transform: disabled ? 'none' : 'translateY(-5px) scale(1.05)',
//           boxShadow: disabled ? 'none' : '0 8px 16px rgba(0,0,0,0.3)'
//         },
//         filter: disabled ? 'grayscale(80%)' : 'none',
//         opacity: disabled ? 0.7 : 1,
//         overflow: 'visible'
//       }}
//     >
//       {/* Processing overlay */}
//       {isProcessing && (
//         <Box sx={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           bgcolor: 'rgba(0,0,0,0.5)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           borderRadius: '8px'
//         }}>
//           <CircularProgress size={24} color="inherit" />
//         </Box>
//       )}

//       {/* Points badge */}
//       <Chip
//         label={`+${card.pointsBonus}`}
//         size="small"
//         sx={{
//           position: 'absolute',
//           top: 8,
//           right: 8,
//           height: 20,
//           fontSize: '15px',
//           fontWeight: 'bold',
//           bgcolor: '#5F4B8B',
//           color: 'white',
//           '& .MuiChip-label': { px: 1 }
//         }}
//       />

//       {/* Custom tooltip above card */}
//       {hovered && (
//   <Box
//     sx={{
//       position: 'absolute',
//       left: '50%',
//       bottom: '100%',
//       transform: 'translateX(-50%) translateY(-20px)',
//       minWidth: 220,
//       maxWidth: 320,
//       bgcolor: 'rgba(255,255,255,0.98)',
//       borderRadius: 3,
//       boxShadow: '0 8px 32px 0 rgba(95,75,139,0.25), 0 1.5px 6px 0 rgba(0,0,0,0.10)',
//       border: '2px solid #5F4B8B',
//       zIndex: 30,
//       p: 0,
//       textAlign: 'left',
//       pointerEvents: 'none',
//       animation: 'fadeIn 0.18s',
//       overflow: 'hidden',
//     }}
//   >
//     {/* Accent bar */}
//     <Box sx={{
//       width: '100%',
//       height: 8,
//       bgcolor: '#5F4B8B',
//       borderTopLeftRadius: 10,
//       borderTopRightRadius: 10,
//       mb: 1,
//     }} />
//     <Box sx={{ p: 2 }}>
//       <Typography sx={{
//         fontWeight: 700,
//         mb: 0.5,
//         color: '#5F4B8B',
//         fontSize: '1.15rem',
//         letterSpacing: 0.5,
//         textShadow: '0 1px 0 #fff'
//       }}>
//         {card.name}
//       </Typography>
//       <Typography sx={{
//         fontStyle: 'italic',
//         fontSize: '1rem',
//         mb: 1,
//         color: '#222',
//         lineHeight: 1.5,
//       }}>
//         {card.description}
//       </Typography>
//       {examples && (
//         <Typography sx={{
//           fontSize: '0.95rem',
//           color: '#444',
//           mb: 1,
//           fontStyle: 'italic',
//           background: '#f6f3fa',
//           borderRadius: 1,
//           px: 1,
//           py: 0.5,
//           display: 'inline-block'
//         }}>
//           {examples}
//         </Typography>
//       )}
//       <Chip
//         label={`+${card.pointsBonus} points`}
//         size="small"
//         sx={{
//           bgcolor: '#5F4B8B',
//           color: 'white',
//           fontSize: '0.8rem',
//           fontWeight: 600,
//           mt: 1
//         }}
//       />
//     </Box>
//   </Box>
// )}
//       <style>
//         {`
//           @keyframes fadeIn {
//             from { opacity: 0; }
//             to { opacity: 1; }
//           }
//         `}
//       </style>
//     </Box>
//   );
// };

// export default CardDisplay;