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
  Tooltip
} from '@mui/material';
import { Edit, Delete, Visibility, PublishedWithChanges, Unpublished, Person } from '@mui/icons-material';

const ContentList = ({ 
  content, 
  onEdit, 
  onView, 
  onDelete, 
  onPublishToggle,
  disableActions = false
}) => {
  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {content.map(item => (
          <Grid item xs={12} key={item.id}>
            <Card sx={{ 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }
            }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" component="div" fontWeight="500">
                    {item.title}
                  </Typography>
                  <Box>
                    <Chip 
                      label={item.published ? "Published" : "Draft"} 
                      color={item.published ? "success" : "default"}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {item.classroomName && (
                      <Chip
                        label={`Class: ${item.classroomName}`}
                        variant="outlined"
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                </Box>
                
                {item.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description}
                  </Typography>
                )}
                
                <Divider sx={{ my: 1.5 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      Updated: {formatDate(item.updatedAt || item.createdAt)}
                    </Typography>
                    {item.creatorName && (
                      <Box display="flex" alignItems="center">
                        <Person fontSize="small" sx={{ color: '#5F4B8B', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          By: {item.creatorName}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box>
                    <Tooltip title="View">
                      <IconButton 
                        size="small" 
                        onClick={() => onView(item.id)}
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
                            onClick={() => onEdit(item.id)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={item.published ? "Unpublish" : "Publish"}>
                          <IconButton 
                            size="small" 
                            onClick={() => onPublishToggle(item.id, item.published)}
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
                            onClick={() => onDelete(item.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentList;
