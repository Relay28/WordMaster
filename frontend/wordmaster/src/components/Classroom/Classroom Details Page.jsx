import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Chip,
  Container,
  Grid,
  Tabs,
  Tab,
  Tooltip,
  Pagination,
  Stack, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Edit, Delete, Save, Cancel, Person, ArrowBack, Class, Description, Add, PersonRemove, DeleteOutline, ChevronLeft, Download } from '@mui/icons-material';
import { useUserAuth } from '../context/UserAuthContext';
import { useClassroomDetails } from './ClassroomDetailFunctions';
import { useNavigate, useLocation } from 'react-router-dom';
import ContentList from '../content/ContentList';
import contentService from '../../services/contentService';
import '@fontsource/press-start-2p';
import picbg from '../../assets/picbg.png';
import ClassroomDetailHeader from '../Header/ClassroomDetailHeader';
import { useHomePage } from '../Homepage/HomePageFunctions';
import ClassroomInfoSection from './ClassroomDetailPage Components/ClassroomInfoSection';
import ContentTab from './ClassroomDetailPage Components/ContentTab';
import TeacherReportsTab from './ClassroomDetailPage Components/TeacherReportsTab';
import StudentReportsTab from './ClassroomDetailPage Components/StudentReportsTab';
import MembersTab from './ClassroomDetailPage Components/MembersTab';


const ClassroomDetailsPage = () => {
  const { authChecked, user, getToken, logout, login } = useUserAuth();
  const {
    loading,
    error,
    classroom,
    members,
    editMode,
    updatedData,
    setEditMode,
    handleDataChange,
    handleUpdateClassroom,
    handleDeleteClassroom,
    handleRemoveStudent,
    isTeacher,
    isClassroomTeacher,
    deleteDialogOpen,
    setDeleteDialogOpen,
    removeStudentDialogOpen,
    setRemoveStudentDialogOpen,
    confirmRemoveStudent,
    confirmDeleteClassroom
  } = useClassroomDetails(authChecked, user, getToken);
  
  const {
      anchorEl,
      handleMenuOpen,
      handleMenuClose,
      handleProfileClick,
      handleLogout,
      displayName,
      roleDisplay,
      avatarInitials
    } = useHomePage(authChecked, user, getToken, logout, login);

  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedExportDate, setSelectedExportDate] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedContentForExport, setSelectedContentForExport] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0);
  const [contentList, setContentList] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add this line
  const theme = useTheme();

  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(2); 

  const [gameSessions, setGameSessions] = useState([]);
  const [loadingGameSessions, setLoadingGameSessions] = useState(false);
  const [gameSessionsError, setGameSessionsError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [studentReports, setStudentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [studentFeedbacks, setStudentFeedbacks] = useState([]);
  const [loadingStudentFeedback, setLoadingStudentFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  // New state variables
  const [publishedContent, setPublishedContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [loadingCompletedSessions, setLoadingCompletedSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [showContentList, setShowContentList] = useState(true);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (contentList || []).slice(indexOfFirstItem, indexOfLastItem);

  const pixelText = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    lineHeight: '1.5',
    letterSpacing: '0.5px'
  };

  const pixelHeading = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '1px'
  };

  const pixelButton = {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '10px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchGameSessions = async () => {
  console.log("Fetching game sessions...");
  if (!classroom?.id) {
    console.error("No classroom ID - cannot fetch sessions");
    return;
  }
  
  setLoadingGameSessions(true);
  setGameSessionsError(null);
  
  try {
    const token = await getToken();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    const response = await fetch(`${API_URL}/api/game/classroom/${classroom.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Failed to fetch game sessions (${response.status}): ${errorText || 'Unknown error'}`);
    }
    
    const data = await response.json();
    setGameSessions(data);
  } catch (err) {
    console.error("Error loading game sessions:", err);
    setGameSessionsError(err.message || "Failed to load game sessions for this classroom.");
  } finally {
    setLoadingGameSessions(false);
  }
};

  const fetchStudentReports = async (sessionId) => {
    setLoadingReports(true);
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      // Change the endpoint to match the controller mapping
      const response = await fetch(`${API_URL}/api/teacher-feedback/summary/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch student reports (${response.status}): ${errorText || 'Unknown error'}`);
      }
      
      const data = await response.json();
      setStudentReports(data);
      setSelectedSession(sessionId);
    } catch (err) {
      console.error("Error loading student reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };
  
  // Fetch classroom content
  const fetchClassroomContent = async () => {
    if (!classroom?.id) {
      console.log("No classroom ID available");
      return;
    }
    
    console.log("Fetching content for classroom ID:", classroom.id);
    setLoadingContent(true);
    setContentError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      // Choose the correct endpoint based on user role
      const endpoint = user?.role === 'USER_STUDENT' 
        ? `/api/content/classroom/${classroom.id}/published`
        : `/api/content/classroom/${classroom.id}`;
      
      console.log("Making request to:", `${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`Failed to fetch content: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Fetched content data:", data);
      
      // Ensure data is always an array
      const contentArray = Array.isArray(data) ? data : [];
      setContentList(contentArray);
      setContentError(null);
      
    } catch (err) {
      console.error("Error in fetchClassroomContent:", err);
      setContentError(err.message || "Failed to load content for this classroom.");
      setContentList([]); // Ensure contentList is always an array
    } finally {
      setLoadingContent(false);
    }
  };

  // Make sure this useEffect calls the function properly
  useEffect(() => {
    if (classroom?.id && authChecked && user) {
      fetchClassroomContent();
    }
  }, [classroom?.id, authChecked, user, refreshTrigger]);

  const handleCreateContent = () => {
    if (!classroom) return;
    console.log("Navigating to create content with classroom:", classroom.id); // Debug logging
    navigate(`/content/upload?classroomId=${classroom.id}`);
  };

  // Update the handleGenerateAIContent function
  const handleGenerateAIContent = () => {
    if (!classroom) return;
    navigate(`/content/ai-generate?classroomId=${classroom.id}&studentCount=${classroom.studentCount}`, {
      state: { 
        returnTo: `/classroom/${classroom.id}`,
        refreshOnReturn: true,
        studentCount: classroom.studentCount // Pass student count in state too
      }
    });
  };

  const handleEditContent = (contentId) => {
    navigate(`/content/edit/${contentId}?classroomId=${classroom?.id}`);
  };

  const handleViewContent = (contentId) => {
        navigate(`/content/${contentId}`);    
  };

  const handleDeleteContent = (contentId) => {
  setContentToDelete(contentId);
  setDeleteContentDialogOpen(true);
};

const confirmDeleteContent = async () => {
  try {
    const token = await getToken();
    await contentService.deleteContent(contentToDelete, token);
    setContentList(prev => prev.filter(content => content.id !== contentToDelete));
    setDeleteContentDialogOpen(false);
    setContentToDelete(null);
  } catch (err) {
    setContentError("Failed to delete content. Please try again.");
    console.error("Error deleting content:", err);
  }
};

  const handlePublishToggle = async (contentId, currentStatus) => {
    try {
      const token = await getToken();
      let updatedContent;
      
      if (currentStatus) {
        updatedContent = await contentService.unpublishContent(contentId, token);
     
      } else {
        try {
          const token = await getToken();
         updatedContent =  await contentService.publishContent(contentId, token);
          // Redirect to waiting room after successful publish
        
        } catch (error) {
          console.error("Error publishing content:", error);
          // Handle error
        }

      }
     
      setContentList(contentList.map(item => 
        item.id === contentId ? updatedContent : item
      ));
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setContentError("Failed to update content status. Please try again.");
    }
  };

  // Check for state when component mounts or updates
  useEffect(() => {
    if (location.state?.refreshOnReturn) {
      setRefreshTrigger(prev => prev + 1);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (tabValue === 1) {
      if (user?.role === 'USER_TEACHER') {
        fetchGameSessions();
      } else {
        fetchStudentFeedback();
      }
    }
  }, [tabValue, classroom?.id, user?.role]);



  // Fetch student feedback
  const fetchStudentFeedback = async () => {
    if (!classroom || user?.role === 'USER_TEACHER') return;
    
    setLoadingStudentFeedback(true);
    setFeedbackError(null);
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      // Fix the URL path to include the /api/teacher-feedback prefix
      const response = await fetch(
        `${API_URL}/api/teacher-feedback/student-feedback/classroom/${classroom.id}/student/${user.id}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      
      const data = await response.json();
      setStudentFeedbacks(data);
    } catch (err) {
      console.error("Error loading student feedback:", err);
      setFeedbackError(err.message || 'Failed to load feedback data');
    } finally {
      setLoadingStudentFeedback(false);
    }
  };

  // Fetch student feedback on mount and when classroom or user changes
  useEffect(() => {
    fetchStudentFeedback();
  }, [classroom, user?.id, getToken]);

  const handleDeleteSession = (sessionId, event) => {
  event.stopPropagation();
  setSessionToDelete(sessionId);
  setDeleteSessionDialogOpen(true);
};

// Add this new function
const confirmDeleteSession = async () => {
  try {
    setLoadingGameSessions(true);
    const token = await getToken();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    
    const response = await fetch(`${API_URL}/api/sessions/${sessionToDelete}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete game session (${response.status})`);
    }
    
    setGameSessions(gameSessions.filter(session => session.id !== sessionToDelete));
    
    if (selectedSession === sessionToDelete) {
      setSelectedSession(null);
      setStudentReports([]);
    }
  } catch (err) {
    console.error("Error deleting game session:", err);
    setGameSessionsError(err.message || "Failed to delete game session");
  } finally {
    setLoadingGameSessions(false);
    setDeleteSessionDialogOpen(false);
    setSessionToDelete(null);
  }
};

  // New function to fetch published content for reports
  const fetchPublishedContent = async () => {
    if (!classroom) return;
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      // We can use the existing content service or make a direct call
      let data;
      if (contentList.length > 0) {
        // Filter existing content list for published content
        data = contentList.filter(item => item.published);
      } else {
        // Fetch published content directly
        data = await contentService.getPublishedContentByClassroom(classroom.id, token);
      }
      
      setPublishedContent(data);
    } catch (err) {
      console.error("Error loading published content:", err);
    }
  };

  // New function to fetch completed game sessions for a content item
  const fetchCompletedSessionsByContent = async (contentId) => {
    setLoadingCompletedSessions(true);
    setSessionsError(null);
    
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${API_URL}/api/game/content/${contentId}/completed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch completed sessions (${response.status}): ${errorText || 'Unknown error'}`);
      }
      
      const data = await response.json();
      setCompletedSessions(data);
      setShowContentList(false);
    } catch (err) {
      console.error("Error loading completed sessions:", err);
      setSessionsError(err.message || "Failed to load game sessions for this content.");
    } finally {
      setLoadingCompletedSessions(false);
    }
  };

  // Handle content selection
  const handleContentSelect = (content) => {
    setSelectedContent(content);
    fetchCompletedSessionsByContent(content.id);
  };

  // Handle back button to return to content list
  const handleBackToContentList = () => {
    setShowContentList(true);
    setSelectedContent(null);
    setCompletedSessions([]);
  };

  // Fetch published content when tab changes to Student Reports
  useEffect(() => {
    if (tabValue === 1 && user?.role === 'USER_TEACHER') {
      fetchPublishedContent();
    } else if (tabValue === 1) {
      fetchStudentFeedback();
    }
  }, [tabValue, classroom?.id, user?.role, contentList]);

  const handleExportReports = async (content) => {
    setSelectedContentForExport(content);
    setExportDialogOpen(true);
    
    // Fetch available dates for this content
    try {
      setLoadingDates(true);
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const response = await fetch(
        `${API_URL}/api/export/available-dates/${content.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const dates = await response.json();
        setAvailableDates(dates);
      } else {
        console.warn('Could not fetch available dates');
        setAvailableDates([]);
      }
    } catch (err) {
      console.error('Error fetching available dates:', err);
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const confirmExportReports = async () => {
    if (!selectedContentForExport) return;
    
    try {
      setExportLoading(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      console.log('=== EXPORT REQUEST START ===');
      console.log('Content ID:', selectedContentForExport.id);
      console.log('Selected date:', selectedExportDate);
      console.log('User role:', user?.role);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      const params = new URLSearchParams();
      if (selectedExportDate) {
        params.append('date', selectedExportDate);
      }
      
      const url = `${API_URL}/api/export/student-reports/${selectedContentForExport.id}?${params}`;
      console.log('Export URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = 'Failed to export reports';
        
        try {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'Access denied. You can only export reports for your own content.';
          } else if (response.status === 400) {
            errorMessage = errorText || 'No data available for export.';
          } else {
            errorMessage = errorText || `Server error (${response.status})`;
          }
        } catch (e) {
          console.error('Could not read error response:', e);
          errorMessage = `Server error (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Get the blob
      const blob = await response.blob();
      console.log('Blob received - Size:', blob.size, 'Type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Verify it's actually an Excel file
      if (!blob.type.includes('officedocument') && !blob.type.includes('excel') && !blob.type.includes('sheet')) {
        console.warn('Unexpected blob type:', blob.type);
        // Try to read as text to see if it's an error message
        try {
          const text = await blob.text();
          if (text.length < 1000) { // If it's short, it might be an error message
            console.error('Received text instead of Excel:', text);
            throw new Error('Server returned an error: ' + text);
          }
        } catch (e) {
          // If we can't read it as text, assume it's binary Excel data
          console.log('Could not read as text, assuming it is Excel data');
        }
      }
      
      // Create download
      const url2 = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      
      const dateStr = selectedExportDate ? selectedExportDate.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
      const sanitizedTitle = selectedContentForExport.title.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `class_record_${sanitizedTitle}_${dateStr}.xlsx`;
      
      console.log('Download filename:', link.download);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url2);
      
      console.log('=== EXPORT SUCCESS ===');
      
      // Close dialog
      setExportDialogOpen(false);
      setSelectedExportDate('');
      setSelectedContentForExport(null);
      setAvailableDates([]);
      
    } catch (err) {
      console.error("=== EXPORT ERROR ===", err);
      setContentError(err.message || "Failed to export reports. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!classroom) {
    return (
      <Box p={4}>
        <Alert severity="error">{error || 'Classroom not found'}</Alert>
      </Box>
    );
  }

return (
    <Box sx={{ 
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100%',
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
      <ClassroomDetailHeader 
        displayName={displayName}
        roleDisplay={roleDisplay}
        avatarInitials={avatarInitials}
        user={user}
        anchorEl={anchorEl}
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
      <Container maxWidth="lg" sx={{ py: 4, flex: 1,  }}>
        {/* Error display */}
        {error && (
          <Box mb={3}>
            <Alert severity="error" sx={pixelText}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Classroom Info Section */}
        <ClassroomInfoSection
          classroom={classroom}
          editMode={editMode}
          updatedData={updatedData}
          handleDataChange={handleDataChange}
          handleUpdateClassroom={handleUpdateClassroom}
          handleDeleteClassroom={handleDeleteClassroom}
          setEditMode={setEditMode}
          isClassroomTeacher={isClassroomTeacher}
          loading={loading}
          pixelText={pixelText}
          pixelHeading={pixelHeading}
        />
        {/* Tabs for Members and Content */}
        <Paper elevation={0} sx={{ 
          p: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '4px solid #5F4B8B',
          borderRadius: '6px',
          position: 'relative',
           '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
              opacity: 0.8
          },
          
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
              '& .MuiTabs-indicator': { backgroundColor: '#5F4B8B' },
              '& .MuiTab-root': { 
                ...pixelHeading, 
                fontSize: '12px',
                flexGrow: 1,
                minWidth: 'unset',
                px: 1,
              },
              '& .Mui-selected': { 
                color: '#5F4B8B !important',
              }
            }}
            variant="fullWidth"
          >
            <Tab label="LEARNING CONTENT" />
            {user?.role === 'USER_TEACHER' ? (
              <Tab label="STUDENT REPORTS" />
            ) : (
              <Tab label="GRADE REPORTS" />
            )}
            <Tab label="MEMBERS" />
          </Tabs>

          {/* Reports Tab (Teacher / Student) */}
          {tabValue === 1 && user?.role === 'USER_TEACHER' && (
            <TeacherReportsTab
              pixelText={pixelText}
              pixelHeading={pixelHeading}
              pixelButton={pixelButton}
              publishedContent={publishedContent}
              showContentList={showContentList}
              selectedContent={selectedContent}
              completedSessions={completedSessions}
              loadingCompletedSessions={loadingCompletedSessions}
              sessionsError={sessionsError}
              selectedSession={selectedSession}
              studentReports={studentReports}
              loadingReports={loadingReports}
              handleContentSelect={handleContentSelect}
              handleBackToContentList={handleBackToContentList}
              fetchStudentReports={fetchStudentReports}
              handleDeleteSession={handleDeleteSession}
              handleExportReports={handleExportReports}
              navigate={navigate}
            />
          )}
          {tabValue === 1 && user?.role !== 'USER_TEACHER' && (
            <StudentReportsTab
              pixelHeading={pixelHeading}
              pixelText={pixelText}
              pixelButton={pixelButton}
              loadingStudentFeedback={loadingStudentFeedback}
              studentFeedbacks={studentFeedbacks}
              feedbackError={feedbackError}
              navigate={navigate}
              user={user}
            />
          )}

          {/* Members Tab */}
          {tabValue === 2 && (
            <MembersTab
              members={members}
              classroom={classroom}
              isClassroomTeacher={isClassroomTeacher}
              handleRemoveStudent={handleRemoveStudent}
              pixelText={pixelText}
            />
          )}

          {/* Content Tab */}
          {tabValue === 0 && (
            <ContentTab
              isClassroomTeacher={isClassroomTeacher}
              pixelButton={pixelButton}
              pixelHeading={pixelHeading}
              pixelText={pixelText}
              contentError={contentError}
              clearContentError={() => setContentError(null)}
              loadingContent={loadingContent}
              contentList={contentList}
              currentItems={currentItems}
              handleCreateContent={handleCreateContent}
              handleGenerateAIContent={handleGenerateAIContent}
              handleEditContent={handleEditContent}
              handleViewContent={handleViewContent}
              handleDeleteContent={handleDeleteContent}
              handlePublishToggle={handlePublishToggle}
              page={page}
              itemsPerPage={itemsPerPage}
              handlePageChange={handlePageChange}
            />
          )}
        </Paper>
      </Container>
    </Box>

<Dialog
  open={deleteSessionDialogOpen}
  onClose={() => setDeleteSessionDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }
  }}
>
  <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
    Delete Game Session
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ ...pixelText, color: '#666' }}>
      Are you sure you want to delete this game session? This will remove all student data and feedback for this session.
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button
      onClick={() => setDeleteSessionDialogOpen(false)}
      variant="outlined"
      sx={{
        ...pixelButton,
        color: '#5F4B8B',
        borderColor: '#5F4B8B',
        '&:hover': {
          borderColor: '#4a3a6d',
          backgroundColor: 'rgba(95, 75, 139, 0.1)'
        }
      }}
    >
      CANCEL
    </Button>
    <Button
      onClick={confirmDeleteSession}
      variant="contained"
      sx={{
        ...pixelButton,
        backgroundColor: '#d32f2f',
        color: 'white',
        '&:hover': {
          backgroundColor: '#b71c1c'
        }
      }}
    >
      DELETE
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }
  }}
>
  <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
    Delete Classroom
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ ...pixelText, color: '#666' }}>
      Are you sure you want to delete this classroom? This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button
      onClick={() => setDeleteDialogOpen(false)}
      variant="outlined"
      sx={{
        ...pixelButton,
        color: '#5F4B8B',
        borderColor: '#5F4B8B',
        '&:hover': {
          borderColor: '#4a3a6d',
          backgroundColor: 'rgba(95, 75, 139, 0.1)'
        }
      }}
    >
      CANCEL
    </Button>
    <Button
      onClick={confirmDeleteClassroom}
      variant="contained"
      sx={{
        ...pixelButton,
        backgroundColor: '#d32f2f',
        color: 'white',
        '&:hover': {
          backgroundColor: '#b71c1c'
        }
      }}
    >
      DELETE
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={removeStudentDialogOpen}
  onClose={() => setRemoveStudentDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }
  }}
>
  <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
    Remove Student
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ ...pixelText, color: '#666' }}>
      Are you sure you want to remove this student from the classroom?
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button
      onClick={() => setRemoveStudentDialogOpen(false)}
      variant="outlined"
      sx={{
        ...pixelButton,
        color: '#5F4B8B',
        borderColor: '#5F4B8B',
        '&:hover': {
          borderColor: '#4a3a6d',
          backgroundColor: 'rgba(95, 75, 139, 0.1)'
        }
      }}
    >
      CANCEL
    </Button>
    <Button
      onClick={confirmRemoveStudent}
      variant="contained"
      sx={{
        ...pixelButton,
        backgroundColor: '#d32f2f',
        color: 'white',
        '&:hover': {
          backgroundColor: '#b71c1c'
        }
      }}
    >
      REMOVE
    </Button>
  </DialogActions>
</Dialog>
<Dialog
  open={deleteContentDialogOpen}
  onClose={() => setDeleteContentDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }
  }}
>
  <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
    Delete Content
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ ...pixelText, color: '#666' }}>
      Are you sure you want to delete this content? This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button
      onClick={() => setDeleteContentDialogOpen(false)}
      variant="outlined"
      sx={{
        ...pixelButton,
        color: '#5F4B8B',
        borderColor: '#5F4B8B',
        '&:hover': {
          borderColor: '#4a3a6d',
          backgroundColor: 'rgba(95, 75, 139, 0.1)'
        }
      }}
    >
      CANCEL
    </Button>
    <Button
      onClick={confirmDeleteContent}
      variant="contained"
      sx={{
        ...pixelButton,
        backgroundColor: '#d32f2f',
        color: 'white',
        '&:hover': {
          backgroundColor: '#b71c1c'
        }
      }}
    >
      DELETE
    </Button>
  </DialogActions>
</Dialog>

<Dialog
    open={exportDialogOpen}
    onClose={() => {
      setExportDialogOpen(false);
      setSelectedExportDate('');
      setAvailableDates([]);
    }}
    PaperProps={{
      sx: {
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }
    }}
  >
    <DialogTitle sx={{ ...pixelHeading, color: '#5F4B8B' }}>
      Export Class Record
    </DialogTitle>
    <DialogContent sx={{ minWidth: '400px' }}>
      <DialogContentText sx={{ ...pixelText, color: '#666', mb: 3 }}>
        Export class record for: {selectedContentForExport?.title}
      </DialogContentText>
      
      {loadingDates ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel style={pixelText}>Filter by Date (Optional)</InputLabel>
          <Select
            value={selectedExportDate}
            onChange={(e) => setSelectedExportDate(e.target.value)}
            label="Filter by Date (Optional)"
            sx={{
              '& .MuiSelect-select': pixelText,
            }}
          >
            <MenuItem value="">
              <em style={pixelText}>All Dates</em>
            </MenuItem>
            {availableDates.map((date) => (
              <MenuItem key={date} value={date} style={pixelText}>
                {new Date(date + 'T00:00:00').toLocaleDateString()}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText style={pixelText}>
            {availableDates.length === 0 
              ? "No session dates available" 
              : `${availableDates.length} session date(s) available`}
          </FormHelperText>
        </FormControl>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 2, gap: 1 }}>
      <Button
        onClick={() => {
          setExportDialogOpen(false);
          setSelectedExportDate('');
          setAvailableDates([]);
        }}
        variant="outlined"
        sx={{
          ...pixelButton,
          color: '#5F4B8B',
          borderColor: '#5F4B8B',
          '&:hover': {
            borderColor: '#4a3a6d',
            backgroundColor: 'rgba(95, 75, 139, 0.1)'
          }
        }}
      >
        CANCEL
      </Button>
      <Button
        onClick={confirmExportReports}
        variant="contained"
        disabled={exportLoading}
        sx={{
          ...pixelButton,
          backgroundColor: '#6c63ff',
          color: 'white',
          '&:hover': {
            backgroundColor: '#5a52e0'
          }
        }}
      >
        {exportLoading ? 'EXPORTING...' : 'EXPORT CLASS RECORD'}
      </Button>
    </DialogActions>
  </Dialog>


    </Box>
  );
};

export default ClassroomDetailsPage;