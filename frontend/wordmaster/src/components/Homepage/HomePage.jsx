import React, { useState } from 'react';
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
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  Snackbar,
  Pagination,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Close, Dashboard, Add, Class, Person, CheckCircle, PersonOutline } from "@mui/icons-material";
import { useUserAuth } from '../context/UserAuthContext';
import { useHomePage } from './HomePageFunctions';
import picbg from '../../assets/picbg.png';
import '@fontsource/press-start-2p';
import HomepageHeader from '../Header/HomepageHeader';

const HomePage = () => {
  const { authChecked, user, getToken, login, logout } = useUserAuth();
  const {
    createClassOpen,
    className,
    loadingProfile,
    loadingClassrooms,
    classrooms,
    error,
    anchorEl,
    createSuccess,
    setError,
    setCreateClassOpen,
    setClassName,
    setCreateSuccess,
    handleMenuOpen,
    handleMenuClose,
    handleProfileClick,
    handleLogout,
    handleCreateClass,

    displayName,
    roleDisplay,
    avatarInitials
  } = useHomePage(authChecked, user, getToken, login, logout);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '12px',
    lineHeight: '1.4',
    letterSpacing: '0.3px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '12px' : '18px',
    lineHeight: '1.4',
    letterSpacing: '0.8px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: isMobile ? '8px' : '12px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase'
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 6;

  if (!authChecked || loadingProfile) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );

  if (!user) return null;

  // Calculate pagination
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = classrooms.slice(indexOfFirstClass, indexOfLastClass);
  const totalPages = Math.ceil(classrooms.length / classesPerPage);
  
  return (
    <Box sx={{ 
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  margin: 0,
  padding: 0,
  position: 'fixed',
  top: 0,
  left: 0,
  overflow: 'hidden',
  background: `
    linear-gradient(to bottom, 
      rgba(249, 249, 249, 10) 0%, 
      rgba(249, 249, 249, 10) 40%, 
      rgba(249, 249, 249, 0.1) 100%),
    url(${picbg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  imageRendering: 'pixelated',
}}>
      {/* Header */}
      <HomepageHeader 
        displayName={displayName}
        roleDisplay={roleDisplay}
        avatarInitials={avatarInitials}
        user={user}
        anchorEl={anchorEl}
        isMobile={isMobile}
        pixelText={pixelText}
        pixelHeading={pixelHeading}
        handleMenuOpen={handleMenuOpen}
        handleMenuClose={handleMenuClose}
        handleProfileClick={handleProfileClick}
        handleLogout={handleLogout}
      />
<Box sx={{ 
      flex: 1,
      width: '100%',
      overflow: 'auto',
      px: isMobile ? 0.5 : 0, // less padding on mobile
      // Custom scrollbar styling
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(95, 75, 139, 0.1)',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#5F4B8B',
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: '#4a3a6d',
        },
      },
    }}>
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4, flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={isMobile ? 2 : 4} flexWrap="wrap" gap={isMobile ? 1 : 2}>
          <Typography sx={{ 
            ...pixelHeading, 
            color: 'text.primary',
            fontSize: isMobile ? '10px' : '18px'
          }}>
            YOUR CLASSES
          </Typography>

          <Box display="flex" gap={isMobile ? 1 : 2} width={isMobile ? 'auto' : 'auto'} sx={{ '& button': { position: 'relative' } }}>
            
            <Button
              variant="contained"
              startIcon={<Add sx={{ 
                fontSize: isMobile ? '8px' : '14px',
                filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
              }} />}
              onClick={() => setCreateClassOpen(true)}
              sx={{
                ...pixelButton,
                backgroundColor: '#5a52e0',
                '&:hover': { 
                  backgroundColor: '#4a3a6d',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4',
                px: isMobile ? 1 : 3,
                py: isMobile ? 0.25 : 1,
                minWidth: isMobile ? 'auto' : '140px',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                fontSize: isMobile ? '6px' : '12px',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
              }}
            >
              {isMobile ? 'CLASS' : 'CREATE CLASS'}
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate('/game/create')}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { 
                  backgroundColor: '#5a52e0',
                  transform: 'translateY(-2px)'
                },
                borderRadius: '4',
                px: isMobile ? 1 : 3,
                py: isMobile ? 0.25 : 1,
                minWidth: isMobile ? 'auto' : '120px',
                borderStyle: 'outset',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                transition: 'all 0.1s ease',
                fontSize: isMobile ? '6px' : '12px',
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                  borderStyle: 'inset'
                },
              }}
            >
              {isMobile ? '▶ GAME' : '▶ CREATE GAME'}
            </Button>
          </Box>
        </Box>
        <Divider sx={{ my: isMobile ? 2 : 3 }} />

        {/* Error message */}
        {error && (
          <Box mb={3}>
            <Alert severity="error" onClose={() => setError(null)} sx={pixelText}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Class Cards */}
        {loadingClassrooms ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : classrooms.length === 0 ? (
          <Box 
            textAlign="center" 
            py={4}
            sx={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              p: 4
            }}
          >
            <Typography sx={{ ...pixelHeading, color: 'text.secondary', mb: 2 }}>
              NO CLASSES FOUND
            </Typography>
            <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 3 }}>
              CREATE A CLASS TO GET STARTED
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: isMobile ? '12px' : '14px' }} />}
              onClick={() => setCreateClassOpen(true)}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { backgroundColor: '#4a3a6d' },
                borderRadius: '4px',
                px: 3,
                py: 1
              }}
            >
              CREATE CLASS
            </Button>
          </Box>
        ) : (
          <>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={isMobile ? 2 : 3}>
              {currentClasses.map((classroom) => (
                <ClassroomCard 
                  key={classroom.id} 
                  classroom={classroom}
                  onClick={() => navigate(`/classroom/${classroom.id}`)}
                  pixelText={pixelText}
                  pixelHeading={pixelHeading}
                  isMobile={isMobile}
                />
              ))}
            </Box>
            
            {/* Pagination controls */}
            {classrooms.length > classesPerPage && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event, page) => setCurrentPage(page)}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      ...pixelText,
                      color: '#5F4B8B',
                      '&.Mui-selected': {
                        backgroundColor: '#5F4B8B',
                        color: 'white'
                      }
                    }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Create Class Dialog */}
      <CreateClassDialog 
        open={createClassOpen}
        className={className}
        loading={loadingClassrooms}
        onClose={() => {
          setCreateClassOpen(false);
          setError(null);
        }}
        onChange={(e) => setClassName(e.target.value)}
        onSubmit={handleCreateClass}
        pixelText={pixelText}
        pixelHeading={pixelHeading}
        isMobile={isMobile}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={createSuccess}
        autoHideDuration={2000}
        onClose={() => setCreateSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setCreateSuccess(false)}
          severity="success"
          icon={<CheckCircle fontSize="inherit" />}
          sx={{ 
            width: '100%',
            backgroundColor: '#4caf50',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' },
            ...pixelText
          }}
        >
          CLASS CREATED!
        </Alert>
      </Snackbar>
    </Box>
</Box>
  );
};

const ClassroomCard = ({ classroom, onClick, pixelText, pixelHeading, isMobile }) => (
  <Card 
    sx={{ 
      borderRadius: isMobile ? '8px' : '10px',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
      border: '1px solid rgba(255,255,255,0.3)',
      transition: 'all 0.3s ease',
      backgroundColor: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(8px)',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)',
        cursor: 'pointer'
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: isMobile ? '4px' : '6px',
        background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
        opacity: 0.8
      }
    }}
    onClick={onClick}
  >
    <CardContent sx={{ 
      p: isMobile ? 1 : 2, 
      pt: isMobile ? 1 : 2,
      pb: isMobile ? 1 : 2
    }}>
      <Box display="flex" alignItems="center" mb={isMobile ? 0.5 : 1}>
        <Box sx={{
          p: isMobile ? 0.25 : 0.5,
          mr: isMobile ? 0.25 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Class sx={{ 
            color: '#5F4B8B', 
            fontSize: isMobile ? '16px' : '22px'
          }} />
        </Box>
        <Typography sx={{ 
          ...pixelHeading, 
          color: '#2d3748',
          fontSize: isMobile ? '10px' : '16px',
          fontWeight: 700,
          lineHeight: isMobile ? 1.3 : 2,
          letterSpacing: '-0.5px'
        }}>
          {classroom.name || `CLASS ${classroom.id}`}
        </Typography>
      </Box>
        
      <Box sx={{
        backgroundColor: 'rgba(245, 245, 247, 0.7)',
        borderRadius: isMobile ? '8px' : '12px',
        p: isMobile ? 0.75 : 1,
        mb: isMobile ? 1 : 2,
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: isMobile ? 0.25 : 0.5
        }}>
          <PersonOutline sx={{ 
            fontSize: isMobile ? '14px' : '18px', 
            color: '#5F4B8B',
            mr: isMobile ? 0.5 : 1 
          }} />
          <Typography sx={{ 
            ...pixelText, 
            color: '#4a5568',
            fontSize: isMobile ? '8px' : '10px',
            fontWeight: 100
          }}>
            Students
          </Typography>
        </Box>
        <Typography sx={{ 
          color: '#2d3748',
          fontSize: isMobile ? '11px' : '14px',
          fontWeight: 500,
          pl: isMobile ? '22px' : '26px' // Align with icon
        }}>
          {classroom.studentCount || 0} enrolled
        </Typography>
      </Box>
      
      <Button
        fullWidth
        variant="contained"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        sx={{
          ...pixelText,
          background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
          color: '#fff',
          border: 'none',
          borderRadius: isMobile ? '6px' : '8px',
          boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)',
          textTransform: 'none',
          fontSize: isMobile ? '8px' : '10px',
          fontWeight: 150,
          height: isMobile ? '26px' : '30px',
          '&:hover': { 
            background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
            boxShadow: '0 6px 8px rgba(95, 75, 139, 0.3)',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 2px 4px rgba(95, 75, 139, 0.3)'
          },
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
            transform: 'rotate(45deg)',
            transition: 'all 0.5s ease'
          },
          '&:hover::after': {
            left: '100%'
          }
        }}
      >
        MANAGE CLASS
      </Button>
    </CardContent>
  </Card>
);

const CreateClassDialog = ({ open, className, loading, onClose, onChange, onSubmit, pixelText, pixelHeading, isMobile }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    PaperProps={{ 
      sx: { 
        borderRadius: '12px',
        width: isMobile ? '90vw' : '440px',
        maxWidth: 'none',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)'
      } 
    }}
  >
    <DialogTitle sx={{ 
      px: 3.5,
      py: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderBottom: 'none',
      fontSize: '1.25rem',
      fontWeight: 300,
      color: 'text.primary',
      ...pixelHeading
    }}>
      Create New Class
      <IconButton 
        onClick={onClose}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <Close sx={{ fontSize: 16 }} /> 
      </IconButton>
    </DialogTitle>
    <Divider sx={{ my: 0.1 }} />
    <DialogContent sx={{ px: 3, py: 1 }}>
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 1.5,
          color: 'text.secondary',
          fontSize: '0.875rem',
          ...pixelText 
        }}
      >
        Enter a name for your new class
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="e.g. English 101"
        value={className}
        onChange={onChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderColor: 'divider'
            },
            '&:hover fieldset': {
              borderColor: 'primary.main'
            },
            '&.Mui-focused fieldset': {
              borderWidth: '1px'
            }
          },
          '& .MuiInputBase-input': {
            py: 2,
            ...pixelText
          }
        }}
        InputProps={{
          style: {
            ...pixelText
          }
        }}
      />
    </DialogContent>
    
    <DialogActions sx={{ px: 3, py: 3 }}>
      <Button
        fullWidth
        variant="contained"
        onClick={onSubmit}
        disabled={loading}
        sx={{
          ...pixelText,
          background: 'linear-gradient(135deg, #6c63ff, #5F4B8B)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(95, 75, 139, 0.2)',
          textTransform: 'none',
          fontSize: isMobile ? '10px' : '12px',
          fontWeight: 500,
          height: isMobile ? '36px' : '48px',
          '&:hover': { 
            background: 'linear-gradient(135deg, #5a52e0, #4a3a6d)',
            boxShadow: '0 6px 8px rgba(95, 75, 139, 0.3)',
            transform: 'translateY(-2px)',
            '&::after': {
              left: '100%'
            }
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 2px 4px rgba(95, 75, 139, 0.3)'
          },
          '&.Mui-disabled': {
            background: '#e0e0e0',
            color: '#a0a0a0',
            transform: 'none',
            boxShadow: 'none'
          },
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
            transform: 'rotate(45deg)',
            transition: 'all 0.5s ease'
          }
        }}
      >
        {loading ? (
          <CircularProgress 
            size={15} 
            color="inherit" 
            thickness={4}
            sx={{ color: 'inherit' }}
          />
        ) : (
          'Create Class'
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

export default HomePage;