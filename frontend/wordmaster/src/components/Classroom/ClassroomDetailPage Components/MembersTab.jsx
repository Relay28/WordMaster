import React from 'react';
import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { PersonRemove } from '@mui/icons-material';

const MembersTab = ({ members = [], classroom, isClassroomTeacher, handleRemoveStudent, pixelText }) => {
  return (
    <Box>
      <List>
        <ListItem sx={{ 
          backgroundColor: 'rgba(95, 75, 139, 0.1)',
          borderRadius: '4px',
          mb: 1
        }}>
          <ListItemAvatar>
            <Avatar
              src={classroom.teacher.profilePicture || undefined}
              sx={{ bgcolor: '#5F4B8B' }}
            >
              {!classroom.teacher.profilePicture && (
                <>
                  {classroom.teacher.fname?.charAt(0)}
                  {classroom.teacher.lname?.charAt(0)}
                </>
              )}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography sx={{ ...pixelText, fontWeight: 'bold' }}>
                {`${classroom.teacher.fname} ${classroom.teacher.lname}`}
              </Typography>
            }
            secondary={
              <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                TEACHER
              </Typography>
            }
          />
          <Chip 
            label="OWNER" 
            color="primary" 
            size="small" 
            sx={{ 
              ...pixelText,
              fontSize: '8px',
              height: '20px'
            }} 
          />
        </ListItem>

        {members.length > 0 ? (
          members.map((member) => (
            <ListItem 
              key={member.id}
              sx={{
                '&:hover': { backgroundColor: 'rgba(95, 75, 139, 0.05)' }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={member.profilePicture || undefined}
                  sx={{ bgcolor: '#6c63ff' }}
                >
                  {!member.profilePicture && (
                    <>
                      {member.fname?.charAt(0)}
                      {member.lname?.charAt(0)}
                    </>
                  )}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography sx={{ ...pixelText }}>
                    {`${member.fname} ${member.lname}`}
                  </Typography>
                }
                secondary={
                  <Typography sx={{ ...pixelText, fontSize: '8px' }}>
                    STUDENT
                  </Typography>
                }
              />
              {isClassroomTeacher && (
                <Tooltip title="Remove student">
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveStudent(member.id)}
                    sx={{
                      color: '#ff5252',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        backgroundColor: 'rgba(255, 82, 82, 0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <PersonRemove />
                  </IconButton>
                </Tooltip>
              )}
            </ListItem>
          ))
        ) : (
          <Typography sx={{ ...pixelText, color: 'text.secondary', p: 2 }}>
            NO STUDENTS ENROLLED YET
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default MembersTab;
