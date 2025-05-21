import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Grid,
  Divider,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Visibility, PublishedWithChanges, Unpublished, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import API_URL from '../../services/apiConfig';
import { styled } from '@mui/material/styles';

// Styled Card with pixel aesthetic
const ContentCard = styled(Card)(({ theme }) => ({
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  border: '1px solid rgba(255,255,255,0.3)',
  transition: 'all 0.3s ease',
  backgroundColor: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(8px)',
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
    opacity: 0.8
  }
}));

const ContentList = ({
  content,
  onEdit,
  onView,
  onDelete,
  onPublishToggle,
  disableActions = false
}) => {
  const navigate = useNavigate();
  const { getToken } = useUserAuth();

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

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleContentClick = async (contentId) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/waiting-room/content/${contentId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Failed to join waiting room:", response.status, response.statusText);
        return;
      }

      navigate(`/waiting-room/${contentId}`);

    } catch (error) {
      console.error("Error joining waiting room:", error);
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {content.map(item => (
          <Grid item xs={12} key={item.id}>
            <ContentCard onClick={() => handleContentClick(item.id)}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography sx={{ ...pixelHeading, fontSize: '16px', fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  <Box>
                    <Chip
                      label={item.published ? "Published" : "Draft"}
                      sx={{ 
                        ...pixelText,
                        backgroundColor: item.published ? '#e6f7ed' : '#f2f2f2',
                        color: item.published ? '#0a8043' : '#666666',
                        mr: 1
                      }}
                      size="small"
                    />
                    {item.classroomName && (
                      <Chip
                        label={`Class: ${item.classroomName}`}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          ...pixelText,
                          color: '#5F4B8B',
                          borderColor: '#5F4B8B'
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {item.description && (
                  <Typography sx={{ 
                    ...pixelText, 
                    color: '#4a5568',
                    mb: 2
                  }}>
                    {item.description.length > 100
                      ? `${item.description.substring(0, 100)}...`
                      : item.description}
                  </Typography>
                )}

                <Divider sx={{ 
                  my: 1.5,
                  borderColor: 'rgba(0,0,0,0.1)'
                }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <Typography sx={{ 
                      ...pixelText, 
                      color: '#666',
                      mr: 2
                    }}>
                      Updated: {formatDate(item.updatedAt || item.createdAt)}
                    </Typography>
                    {item.creatorName && (
                      <Box display="flex" alignItems="center">
                        <Person fontSize="small" sx={{ color: '#5F4B8B', mr: 0.5 }} />
                        <Typography sx={{ 
                          ...pixelText, 
                          color: '#5F4B8B'
                        }}>
                          By: {item.creatorName}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(item.id);
                        }}
                        sx={{ color: '#5F4B8B' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {!disableActions && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item.id);
                            }}
                            sx={{ color: '#5F4B8B' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={item.published ? "Unpublish" : "Publish"}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPublishToggle(item.id, item.published);
                            }}
                            sx={{ color: item.published ? '#4caf50' : '#9e9e9e' }}
                          >
                            {item.published
                              ? <PublishedWithChanges fontSize="small" />
                              : <Unpublished fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }}
                            sx={{ color: '#d32f2f' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </ContentCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentList;