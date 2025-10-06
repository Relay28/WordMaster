import React from 'react';
import { Box, Button, Alert, Paper, Typography, CircularProgress, Stack, Pagination } from '@mui/material';
import { Add } from '@mui/icons-material';
import ContentList from '../../content/ContentList';

const ContentTab = ({
  isClassroomTeacher,
  pixelButton,
  pixelHeading,
  pixelText,
  contentError,
  clearContentError,
  loadingContent,
  contentList,
  currentItems,
  handleCreateContent,
  handleGenerateAIContent,
  handleEditContent,
  handleViewContent,
  handleDeleteContent,
  handlePublishToggle,
  page,
  itemsPerPage,
  handlePageChange
}) => {
  return (
    <Box>
      <Box display="flex" justifyContent="flex-start" alignItems="center" mb={2} gap={1}>
        {isClassroomTeacher && (
          <>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateContent}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                px: 1,
                fontSize: '10px',
                height: '32px',
                '&:hover': { backgroundColor: '#4a3a6d', transform: 'translateY(-2px)' },
                boxShadow: '0 4px 0 #4a3a6d',
                '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 0 #4a3a6d' },
                transition: 'all 0.2s ease'
              }}
            >
              CREATE
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleGenerateAIContent}
              sx={{
                ...pixelButton,
                backgroundColor: '#6c63ff',
                px: 1.5,
                fontSize: '9px',
                height: '30px',
                '&:hover': { backgroundColor: '#5a52e0', transform: 'translateY(-2px)' },
                boxShadow: '0 4px 0 #5a52e0',
                '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 0 #5a52e0' },
                transition: 'all 0.2s ease'
              }}
            >
              AI GENERATE
            </Button>
          </>
        )}
      </Box>

      {contentError && (
        <Alert severity="error" sx={{ mb: 2, ...pixelText }} onClose={clearContentError}>
          {contentError}
        </Alert>
      )}

      {loadingContent ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : contentList.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(245, 245, 247, 0.7)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Typography sx={{ ...pixelHeading, color: 'text.secondary', mb: 1 }}>
            NO CONTENT AVAILABLE
          </Typography>
          <Typography sx={{ ...pixelText, color: 'text.secondary', mb: 3 }}>
            {isClassroomTeacher ? 'CREATE YOUR FIRST CONTENT' : "Your teacher hasn't created/published a content yet."}
          </Typography>
          {isClassroomTeacher && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateContent}
              sx={{
                ...pixelButton,
                backgroundColor: '#5F4B8B',
                '&:hover': { backgroundColor: '#4a3a6d', transform: 'translateY(-2px)' },
                boxShadow: '0 4px 0 #4a3a6d',
                '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 0 #4a3a6d' },
                transition: 'all 0.2s ease',
                height: '32px'
              }}
            >
              CREATE CONTENT
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={3}>
          <ContentList
            content={currentItems}
            onEdit={handleEditContent}
            onView={handleViewContent}
            onDelete={handleDeleteContent}
            onPublishToggle={handlePublishToggle}
            disableActions={!isClassroomTeacher}
            pixelText={pixelText}
            pixelHeading={pixelHeading}
          />
          <Box display="flex" justifyContent="center" sx={{ mt: 4, pb: 2 }}>
            <Pagination
              count={Math.ceil(contentList.length / itemsPerPage)}
              page={page}
              onChange={handlePageChange}
              variant="outlined"
              shape="rounded"
              size="medium"
              siblingCount={1}
              boundaryCount={2}
              sx={{
                '& .MuiPaginationItem-root': {
                  fontFamily: '"Press Start 2P", cursive',
                  fontSize: '10px',
                  color: '#5F4B8B',
                  border: '2px solid #5F4B8B',
                  borderRadius: '4px',
                  margin: '0 4px',
                  minWidth: '32px',
                  height: '32px',
                  '&:hover': { backgroundColor: 'rgba(95, 75, 139, 0.1)' },
                  '&.Mui-selected': { backgroundColor: '#5F4B8B', color: 'white', '&:hover': { backgroundColor: '#4a3a6d' } }
                }
              }}
            />
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default ContentTab;
