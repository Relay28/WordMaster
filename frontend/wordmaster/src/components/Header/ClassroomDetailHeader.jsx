// src/components/HomepageHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon
} from "@mui/material";
import { ExitToApp, Person } from "@mui/icons-material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

const ClassroomDetailHeader = ({ 
  displayName,
  roleDisplay,
  avatarInitials,
  user,
  anchorEl,
  pixelText,
  pixelHeading,
  handleMenuOpen,
  handleMenuClose,
  handleProfileClick,
  handleLogout
}) => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ 
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: 2,
      px: { xs: 1.5, md: 6 },
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box 
          display="flex" 
          alignItems="center" 
          gap={4}
        >
          <IconButton 
            onClick={() => navigate('/homepage')}
            sx={{
              color: '#5F4B8B',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '2px solid #5F4B8B',
              borderRadius: '4px',
              width: '32px',
              height: '32px',
              '&:hover': {
                backgroundColor: 'rgba(95, 75, 139, 0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeftIcon fontSize="medium" />
          </IconButton>
          <Typography sx={{ 
            ...pixelHeading,
            color: '#5F4B8B',
            fontSize: '16px',
            '&:hover': {
              color: '#6c63ff'
            },
            marginLeft: '8px'
          }}>
            Classroom Details
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box textAlign="right">
            <Typography sx={{ ...pixelText, color: 'text.secondary' }}>
              {displayName}
            </Typography>
              <Typography sx={{ ...pixelText, color: ' #5F4B8B' }}>
                {roleDisplay}
              </Typography>
            </Box>
     
          <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: '#5F4B8B',
                color: 'white'
              }}
              src={user.profilePicture || undefined}
            >
              {avatarInitials}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfileClick} sx={pixelText}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={pixelText}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};

export default ClassroomDetailHeader;