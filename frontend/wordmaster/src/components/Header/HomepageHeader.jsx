// src/components/HomepageHeader.jsx
import React from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Button
} from "@mui/material";
import { ExitToApp, Person } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/LOGO.png';

const HomepageHeader = ({ 
  displayName,
  roleDisplay,
  avatarInitials,
  user,
  anchorEl,
  isMobile,
  pixelText,
  pixelHeading,
  handleMenuOpen,
  handleMenuClose,
  handleProfileClick,
  handleLogout
}) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/homepage');
  };

  return (
    <Box sx={{ 
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: isMobile ? 1.5 : 2,
      px: { xs: 1.5, md: 6 },
      overflow: 'hidden',
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box 
          display="flex" 
          alignItems="center" 
          gap={isMobile ? 1.5 : 4}
          component={Button} // Make the whole container a clickable button
          onClick={handleLogoClick}
          sx={{
            textTransform: 'none', // Prevent uppercase transformation
            p: 0, // Remove padding
            '&:hover': {
              backgroundColor: 'transparent' // Remove hover background
            }
          }}
        >
          <img 
            src={logo}
            alt="WordMaster Logo"
            style={{
              height: isMobile ? '24px' : '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <Typography sx={{ 
            ...pixelHeading,
            color: '#5F4B8B',
            fontSize: isMobile ? '12px' : '16px',
            '&:hover': {
              color: '#6c63ff' // Add hover effect
            }
          }}>
            WordMaster
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
          {!isMobile && (
            <Box textAlign="right">
              <Typography sx={{ ...pixelText, color: 'text.secondary' }}>
                {displayName}
              </Typography>
              <Typography sx={{ ...pixelText, color: ' #5F4B8B' }}>
                {roleDisplay}
              </Typography>
            </Box>
          )}
          <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
            <Avatar 
              sx={{ 
                width: isMobile ? 28 : 40, 
                height: isMobile ? 28 : 40, 
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

export default HomepageHeader;