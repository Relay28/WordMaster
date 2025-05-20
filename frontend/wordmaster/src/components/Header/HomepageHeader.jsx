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
  ListItemIcon
} from "@mui/material";
import { ExitToApp, Person } from "@mui/icons-material";
import logo from '../../assets/LOGO.png'

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
  return (
    <Box sx={{ 
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: 2,
      px: { xs: 2, md: 6 }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={isMobile ? 2 : 4}>
          <img 
            src={logo}
            alt="WordMaster Logo"
            style={{
              height: isMobile ? '30px' : '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <Typography sx={{ 
            ...pixelHeading,
            color: '#5F4B8B',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            WordMaster
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
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
                width: isMobile ? 32 : 40, 
                height: isMobile ? 32 : 40, 
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