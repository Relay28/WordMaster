// src/pages/HomePage.js
import React, {useState} from 'react';
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
  Pagination
} from "@mui/material";
import { Close, ExitToApp, Add, Class, Person, CheckCircle } from "@mui/icons-material";
import { useUserAuth } from '../context/UserAuthContext';
import { useHomePage } from './HomePageFunctions';
import logo from '../../assets/WOMS.png'

const HomePage = () => {
  const { authChecked, user, getToken, login, logout } = useUserAuth();
  const {
    // State
    joinClassOpen,
    createClassOpen, // Add this
    classCode,
    className, // Add this
    loadingProfile,
    loadingClassrooms,
    classrooms,
    error,
    anchorEl,
    joinSuccess, 
    createSuccess,  
    
    // Handlers
    setJoinClassOpen,
    setCreateClassOpen, // Add this
    setClassCode,
    setClassName, // Add this
    setJoinSuccess,  // Add this
    setCreateSuccess,  // Add this
    handleMenuOpen,
    handleMenuClose,
    handleProfileClick,
    handleLogout,
    handleJoinClass,
    handleCreateClass, // Add this

    // Derived values
    displayName,
    roleDisplay,
    avatarInitials,
    isTeacher // Add this
  } = useHomePage(authChecked, user, getToken, login, logout);
  const navigate = useNavigate();
 console.log(isTeacher)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 6; // Number of classes to show per page

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
        <Box display="flex" alignItems="center" gap={4}>
        <img 
                src={logo}
                alt="WordMaster Logo"
                style={{
                  height: '50px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
          <Typography variant="h5" fontWeight="bold" color="#5F4B8B">
            WordMaster
          </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box textAlign="right">
              <Typography variant="subtitle2" color="text.secondary">
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToApp fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Your Classes
          </Typography>
          <Box display="flex" gap={2}>
            {isTeacher && (
              <Button
                variant="outlined"
                onClick={() => navigate('/content/dashboard')}
                sx={{
                  borderColor: '#5F4B8B',
                  color: '#5F4B8B',
                  '&:hover': { backgroundColor: '#f0edf5', borderColor: '#4a3a6d' },
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 1
                }}
              >
                Content Dashboard
              </Button>
            )}
            {isTeacher ? (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateClassOpen(true)}
                sx={{
                  backgroundColor: '#5F4B8B',
                  '&:hover': { backgroundColor: '#4a3a6d' },
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 1
                }}
              >
                Create Class
              </Button>
            ) : (
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
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 3 }} />

        {/* Error message */}
        {error && (
          <Box mb={3}>
            <Alert severity="error" onClose={() => setError(null)}>
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
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              p: 4
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
      {isTeacher ? "You haven't created any classes yet" : "You're not enrolled in any classes yet"}
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={3}>
      {isTeacher ? "Create a class to get started with WordMaster" : "Join a class to get started with WordMaster"}
    </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => isTeacher ? setCreateClassOpen(true) : setJoinClassOpen(true)}
              sx={{
                backgroundColor: '#5F4B8B',
                '&:hover': { backgroundColor: '#4a3a6d' },
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                py: 1
              }}
            >
              {isTeacher ? "Create Your First Class" : "Join Your First Class"}
            </Button>
          </Box>
        ) : (
          <>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={3}>
          {currentClasses.map((classroom) => (
            <ClassroomCard 
              key={classroom.id} 
              classroom={classroom}
              onClick={() => navigate(`/classroom/${classroom.id}`)}
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
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
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

      {/* Join Class Dialog */}
      <JoinClassDialog 
        open={joinClassOpen}
        classCode={classCode}
        loading={loadingClassrooms}
        onClose={() => {
          setJoinClassOpen(false);
          setError(null);
        }}
        onChange={(e) => setClassCode(e.target.value)}
        onSubmit={handleJoinClass}
      />
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
/>

    {/* Success Snackbars */}
    <Snackbar
      open={joinSuccess}
      autoHideDuration={2000} // 2 seconds
      onClose={() => setJoinSuccess(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Position at bottom right
      sx={{ 
        '& .MuiSnackbar-root': {
          bottom: '24px !important',
          right: '24px !important'
        }
      }}
    >
      <Alert
        onClose={() => setJoinSuccess(false)}
        severity="success"
        icon={<CheckCircle fontSize="inherit" />}
        sx={{ 
          width: '100%',
          backgroundColor: '#4caf50',
          color: 'white',
          '& .MuiAlert-icon': { color: 'white' }
        }}
      >
        Successfully joined the class!
      </Alert>
    </Snackbar>

    <Snackbar
      open={createSuccess}
      autoHideDuration={2000} // 2 seconds
      onClose={() => setCreateSuccess(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Position at bottom right
      sx={{ 
        '& .MuiSnackbar-root': {
          bottom: '24px !important',
          right: '24px !important'
        }
      }}
    >
      <Alert
        onClose={() => setCreateSuccess(false)}
        severity="success"
        icon={<CheckCircle fontSize="inherit" />}
        sx={{ 
          width: '100%',
          backgroundColor: '#4caf50',
          color: 'white',
          '& .MuiAlert-icon': { color: 'white' }
        }}
      >
        Class created successfully!
      </Alert>
    </Snackbar>
    </Box>
  );
};

// Sub-components for better organization
// In HomePage.js, update the ClassroomCard component to use navigate
const ClassroomCard = ({ classroom, onClick }) => (
  <Card 
    sx={{ 
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        cursor: 'pointer'
      }
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Class sx={{ color: '#5F4B8B', mr: 2 }} />
        <Typography variant="h6" fontWeight="medium">
          {classroom.name || `Class ${classroom.id}`}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Teacher: {classroom.teacher.fname +" "+classroom.teacher.lname || 'Unknown Teacher'}
      </Typography>
      <Button
        fullWidth
        variant="outlined"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
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
);
const JoinClassDialog = ({ open, classCode, loading, onClose, onChange, onSubmit }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
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
      <IconButton onClick={onClose}>
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
        onChange={onChange}
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
        onClick={onSubmit}
        disabled={loading}
        sx={{
          backgroundColor: '#5F4B8B',
          '&:hover': { backgroundColor: '#4a3a6d' },
          borderRadius: '8px',
          py: 1,
          textTransform: 'none'
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Join Class'}
      </Button>
    </DialogActions>
  </Dialog>
  
);
const CreateClassDialog = ({ open, className, loading, onClose, onChange, onSubmit }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: '12px' } }}
  >
    <DialogTitle sx={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f5f3fa',
      borderBottom: '1px solid #e0e0e0'
    }}>
      <Typography fontWeight="bold">Create New Class</Typography>
      <IconButton onClick={onClose}>
        <Close />
      </IconButton>
    </DialogTitle>
    
    <DialogContent sx={{ py: 3, px: 3 }}>
      <Typography variant="body1" mb={2}>
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
            borderRadius: '8px'
          }
        }}
      />
    </DialogContent>
    
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button
        fullWidth
        variant="contained"
        onClick={onSubmit}
        disabled={loading}
        sx={{
          backgroundColor: '#5F4B8B',
          '&:hover': { backgroundColor: '#4a3a6d' },
          borderRadius: '8px',
          py: 1,
          textTransform: 'none'
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Class'}
      </Button>
    </DialogActions>
  </Dialog>

  
);


export default HomePage;