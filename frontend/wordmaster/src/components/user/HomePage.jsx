import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Divider,
  CircularProgress
} from "@mui/material";
import { Close, ExitToApp, Add, Class } from "@mui/icons-material";
import { useUserAuth } from '../context/UserAuthContext';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { authChecked, user, getToken, logout, login } = useUserAuth();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authChecked && getToken() && !user) {
        setLoadingProfile(true);
        try {
          const response = await axios.get('/api/profile', {
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          });
          
          if (response.data) {
            // Transform the API response to match your auth context structure
            const userData = {
              id: response.data.id,
              email: response.data.email,
              fname: response.data.fname || '',
              lname: response.data.lname || '',
              role: response.data.role,
              profilePicture: response.data.profilePicture
            };
            login(userData, getToken());
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          logout();
          navigate('/login');
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
  }, [authChecked, user, getToken, login, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login?logout=true');
  };

  if (!authChecked || loadingProfile) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );

  if (!user) return null;

  // Safe user display values
  const displayName = `${user?.fname || ''} ${user?.lname || ''}`.trim() || user?.email || '';
  const roleDisplay = user?.role?.replace('USER_', '') || 'Student';
  const avatarInitials = user?.fname && user?.lname 
    ? `${user.fname.charAt(0)}${user.lname.charAt(0)}`
    : user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f9f9f9'
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        py: 2,
        px: { xs: 2, md: 6 }
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold" color="#5F4B8B">
            WordMaster
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Box textAlign="right">
              <Typography variant="subtitle2" color="text.secondary">
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roleDisplay}
              </Typography>
            </Box>
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
            <IconButton onClick={handleLogout} color="inherit">
              <ExitToApp sx={{ color: '#5F4B8B' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Your Classes
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setJoinClassOpen(true)}
            sx={{
              backgroundColor: '#5F4B8B',
              '&:hover': { backgroundColor: '#4a3a6d' },
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1
            }}
          >
            Join Class
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Class Cards */}
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={3}>
          {[1, 2, 3].map((item) => (
            <Card 
              key={item} 
              sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Class sx={{ color: '#5F4B8B', mr: 2 }} />
                  <Typography variant="h6" fontWeight="medium">
                    Class {item}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Teacher: Professor Smith
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderColor: '#5F4B8B',
                    color: '#5F4B8B',
                    '&:hover': { 
                      backgroundColor: '#f0edf5',
                      borderColor: '#4a3a6d'
                    }
                  }}
                >
                  Enter Class
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Join Class Dialog */}
      <Dialog 
        open={joinClassOpen} 
        onClose={() => setJoinClassOpen(false)}
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f5f3fa',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Typography fontWeight="bold">Join Class</Typography>
          <IconButton onClick={() => setJoinClassOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3, px: 3 }}>
          <Typography variant="body1" mb={2}>
            Enter the class code provided by your teacher
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="e.g. A1B2C3"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: '#5F4B8B',
              '&:hover': { backgroundColor: '#4a3a6d' },
              borderRadius: '8px',
              py: 1,
              textTransform: 'none'
            }}
          >
            Join Class
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage;