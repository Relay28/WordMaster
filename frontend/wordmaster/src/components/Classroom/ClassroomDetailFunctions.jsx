// src/hooks/useClassroomDetails.js
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getClassroomDetails, 
  getClassroomMembers,
  getClassroomMemberCount,
  updateClassroom,
  deleteClassroom
} from '../utils/classroomService';
export const useClassroomDetails = (authChecked, user, getToken) => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [members, setMembers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [updatedData, setUpdatedData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (authChecked && user && getToken()) {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch classroom details
          const classroomData = await getClassroomDetails(getToken(), classroomId);
          setClassroom(classroomData);
          setUpdatedData({
            name: classroomData.name,
            description: classroomData.description || ''
          });
          
          // Fetch members if needed (separate endpoint)
          const membersData = await getClassroomMembers(getToken(), classroomId);
          setMembers(membersData);
          
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load classroom data');
          console.error('Error fetching classroom data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClassroomData();
  }, [authChecked, user, getToken, classroomId]);

  const handleUpdateClassroom = async () => {
    try {
      setLoading(true);
      const updatedClassroom = await updateClassroom(
        getToken(), 
        classroomId, 
        { 
          name: updatedData.name,
          description: updatedData.description
        }
      );
      setClassroom(updatedClassroom);
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async () => {
    try {
      setLoading(true);
      await deleteClassroom(getToken(), classroomId);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete classroom');
      setLoading(false);
    }
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setUpdatedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return {
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
    isTeacher: user?.role === "USER_TEACHER",
    isClassroomTeacher: user?.id === classroom?.teacher?.id
  };
};