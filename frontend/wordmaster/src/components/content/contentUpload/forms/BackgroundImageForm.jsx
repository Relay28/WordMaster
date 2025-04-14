// forms/BackgroundImageForm.jsx
import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

const BackgroundImageForm = ({ imagePreview, setImagePreview }) => {
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        alert("Image size too large. Please select an image smaller than 5MB.");
        return;
      }
      
      // Create preview with compression
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create an image to resize
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          // Max dimensions (1280px width should be sufficient)
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          // Resize image while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed data URL (0.85 quality)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, backgroundColor: 'white' }}>
      <Typography variant="h6" fontWeight="bold" mb={3}>
        Background Image
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose an image that represents your scenario context (e.g., Airport, Classroom, Office, Café, Hospital).
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<ImageIcon />}
          sx={{
            borderColor: '#5F4B8B',
            color: '#5F4B8B',
            '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
            textTransform: 'none',
            borderRadius: '8px'
          }}
        >
          Upload Background Image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageChange}
          />
        </Button>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Upload an image to use as the scenario background. Maximum size: 5MB. Images will be resized if needed.
      </Typography>
      
      {imagePreview && (
        <Box
          sx={{
            mt: 2,
            borderRadius: '8px',
            overflow: 'hidden',
            maxWidth: '100%',
            maxHeight: '300px',
            textAlign: 'center'
          }}
        >
          <img
            src={imagePreview}
            alt="Background preview"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              objectFit: 'contain',
              border: '1px solid #eee',
              borderRadius: '8px'
            }}
            onError={(e) => {
              console.error("Error loading image preview:", e);
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/800x450?text=Preview+Not+Available";
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default BackgroundImageForm;