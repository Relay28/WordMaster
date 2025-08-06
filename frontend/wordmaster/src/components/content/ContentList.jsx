import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Grid,
  Tooltip,
  CardActionArea,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Edit, Delete, Visibility, PublishedWithChanges, Unpublished, Class } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import API_URL from '../../services/apiConfig';
import { styled } from '@mui/material/styles';

const ContentCard = styled(Card)(({ theme, ismobile, istablet }) => ({
  width: '100%',
  maxWidth: ismobile ? 340 : istablet ? 400 : 530,
  minWidth: ismobile ? 0 : istablet ? 320 : 340,
  height: ismobile ? 170 : istablet ? 200 : 225,
  borderRadius: ismobile ? '12px' : istablet ? '14px' : '16px',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.15)',
    '& .action-buttons': {
      opacity: 1,
      transform: 'translateY(0)',
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ismobile ? '3px' : istablet ? '4px' : '4px',
    background: 'linear-gradient(90deg, #6c63ff 0%, #5F4B8B 50%, #ff8e88 100%)',
  }
}));

const ActionButtons = styled(Box)(({ ismobile, istablet }) => ({
  position: 'absolute',
  right: ismobile ? 8 : istablet ? 12 : 16,
  bottom: ismobile ? 8 : istablet ? 12 : 16,
  display: 'flex',
  gap: ismobile ? '4px' : istablet ? '6px' : '8px',
  opacity: 0,
  transform: 'translateY(10px)',
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(5px)',
  borderRadius: ismobile ? '16px' : istablet ? '18px' : '20px',
  padding: ismobile ? '2px 4px' : istablet ? '3px 6px' : '4px 8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}));

const ContentList = ({ content, onEdit, onView, onDelete, onPublishToggle, disableActions = false }) => {
  const navigate = useNavigate();
  const { getToken } = useUserAuth();
  const theme = useTheme();
  const ismobile = useMediaQuery(theme.breakpoints.down('sm'));
  const istablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const handleContentClick = async (contentId) => {
    try {
      const token = await getToken();
      // const response = await fetch(`${API_URL}/api/waiting-room/content/${contentId}/join`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
     // if (response.ok) navigate(`/waiting-room/${contentId}`);
    } catch (error) {
      console.error("Error joining waiting room:", error);
    }
  };

  return (
    <Grid container spacing={ismobile ? 2 : istablet ? 2.5 : 3}>
      {content.map(item => (
        console.log(item),
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <ContentCard 
            ismobile={ismobile ? true : undefined}
            istablet={istablet ? true : undefined}>
            <CardActionArea component="div" onClick={() => handleContentClick(item.id)}>
              <CardContent sx={{ 
                p: ismobile ? 2 : istablet ? 2.5 : 3, 
                pb: ismobile ? 6 : istablet ? 7 : 8, 
                position: 'relative', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
               }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: ismobile ? 1 : istablet ? 1.5 : 2,
                  gap: ismobile ? 1 : istablet ? 1.5 : 2
                }}>
                  {/* Title */}
                  <Typography sx={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: ismobile ? '10px' : istablet ? '12px' : '14px',
                    color: '#2D3748',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.title ? item.title : "Untitled"}
                  </Typography>

                  {/* Status Badge */}
                  <Chip
                    label={item.published ? "Published" : "Draft"}
                    sx={{
                      fontFamily: '"Press Start 2P", cursive',
                      fontSize: ismobile ? '7px' : istablet ? '8px' : '8px',
                      backgroundColor: item.published ? '#e6f7ed' : '#f2f2f2',
                      color: item.published ? '#0a8043' : '#666666',
                      flexShrink: 0,
                      height: ismobile ? '18px' : istablet ? '19px' : '20px',
                      minWidth: ismobile ? '60px' : istablet ? '65px' : '70px'
                    }}
                    size="small"
                  />
                </Box>

                {/* Description */}
                {item.description && (
                  <Typography sx={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: ismobile ? '8px' : istablet ? '9px' : '10px',
                    color: '#4A5568',
                    mb: ismobile ? 1 : istablet ? 1.5 : 2,
                    height: ismobile ? '50px' : istablet ? '55px' : '60px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {item.description}
                  </Typography>
                )}
                {/* Bottom Info Section */}
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    {/* Classroom Tag */}
                    {item.classroomName && (
                      <Box display="flex" alignItems="center">
                        <Class sx={{ color: '#5F4B8B', fontSize: ismobile ? 14 : istablet ? 15 : 16, mr: ismobile ? 0.5 : istablet ? 0.75 : 1 }} />
                        <Typography sx={{
                          fontFamily: '"Press Start 2P", cursive',
                          fontSize: ismobile ? '7px' : istablet ? '8px' : '8px',
                          color: '#5F4B8B',
                          maxWidth: ismobile ? '100px' : istablet ? '110px' : '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.classroomName}
                        </Typography>
                      </Box>
                    )}

                    {/* Creator Info */}
                    <Box display="flex" alignItems="center" gap={ismobile ? 0.5 : istablet ? 0.75 : 1}>
                      <Avatar 
                        src={item.creatorProfilePicture || undefined}
                        sx={{
                          width: ismobile ? 20 : istablet ? 22 : 24,
                          height: ismobile ? 20 : istablet ? 22 : 24,
                          bgcolor: '#5F4B8B',
                          fontSize: ismobile ? '8px' : istablet ? '9px' : '10px',
                          fontFamily: '"Press Start 2P", cursive',
                        }}>
                        {!item.creatorProfilePicture && item.creatorName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography sx={{
                          fontFamily: '"Press Start 2P", cursive',
                          fontSize: ismobile ? '7px' : istablet ? '8px' : '8px',
                          color: '#2D3748',
                        }}>
                          {item.creatorName}
                        </Typography>
                        <Typography sx={{
                          fontFamily: '"Press Start 2P", cursive',
                          fontSize: ismobile ? '6px' : istablet ? '7px' : '7px',
                          color: '#718096',
                        }}>
                          Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                {/* Action Buttons */}
                <ActionButtons className="action-buttons" 
                ismobile={ismobile ? true : undefined}
                istablet={istablet ? true : undefined}>
                  {!disableActions && (
                  <Tooltip title="View">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      onView(item.id);
                    }} sx={{ color: '#5F4B8B' }}>
                      <Visibility sx={{ fontSize: ismobile ? 14 : istablet ? 16 : 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
                  {!disableActions && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item.id);
                        }} sx={{ color: '#5F4B8B' }}>
                          <Edit sx={{ fontSize: ismobile ? 14 : istablet ? 16 : 18 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={item.published ? "Unpublish" : "Publish"}>
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          onPublishToggle(item.id, item.published);
                        }} sx={{ color: item.published ? '#4caf50' : '#9e9e9e' }}>
                          {item.published ? 
                            <PublishedWithChanges sx={{ fontSize: ismobile ? 14 : istablet ? 16 : 18 }} /> : 
                            <Unpublished sx={{ fontSize: ismobile ? 14 : istablet ? 16 : 18 }} />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }} sx={{ color: '#d32f2f' }}>
                          <Delete sx={{ fontSize: ismobile ? 14 : istablet ? 16 : 18 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </ActionButtons>
              </CardContent>
            </CardActionArea>
          </ContentCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default ContentList;