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
import defaultProfile from '../../assets/defaultprofile.png';
import { useUserAuth } from '../context/UserAuthContext';
import { sanitizePlainText } from '../../utils/sanitize';

const HomepageHeader = ({ 
  displayName, // ignored for security
  roleDisplay, // ignored for security
  avatarInitials, // ignored for security
  user: _userProp, // ignored for security
  anchorEl,
  pixelText,
  pixelHeading,
  handleMenuOpen,
  handleMenuClose,
  handleProfileClick,
  handleLogout
}) => {
  const navigate = useNavigate();
  const { user } = useUserAuth();

  // Derive trusted values from authenticated context only
  const safeDisplayNameRaw = `${user?.fname || ''} ${user?.lname || ''}`.trim() || (user?.email || 'User');
  const safeDisplayName = sanitizePlainText(safeDisplayNameRaw);
  const roles = user?.authorities || [];
  const trustedRole = user?.role || roles.find(Boolean) || 'UNKNOWN';
  const safeRoleDisplay = sanitizePlainText(trustedRole === 'USER_TEACHER' ? 'Teacher' : trustedRole === 'USER_STUDENT' ? 'Student' : 'Unknown');
  const safeAvatarInitials = (user?.fname && user?.lname)
    ? `${user.fname.charAt(0)}${user.lname.charAt(0)}`
    : user?.email?.charAt(0)?.toUpperCase() || 'U';

  const handleLogoClick = () => {
    navigate('/homepage');
  };

  return (
    <Box sx={{ 
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      py: 2,
      px: { xs: 1.5, md: 6 },
      overflow: 'hidden',
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box 
          display="flex" 
          alignItems="center" 
          gap={4}
          component={Button}
          onClick={handleLogoClick}
          sx={{
            textTransform: 'none',
            p: 0,
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }}
        >
          <img 
            src={logo}
            alt="WordMaster Logo"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <Typography sx={{ 
            ...pixelHeading,
            color: '#5F4B8B',
            fontSize: '16px',
            '&:hover': {
              color: '#6c63ff'
            }
          }}>
            WordMaster
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box textAlign="right">
            <Typography sx={{ ...pixelText, fontSize: '12px', color: 'text.secondary' }}>
              {safeDisplayName}
            </Typography>
            <Typography sx={{ ...pixelText, fontSize: '12px', color: '#5F4B8B' }}>
              {safeRoleDisplay}
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
              src={user?.profilePicture || defaultProfile}
            >
              {safeAvatarInitials}
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