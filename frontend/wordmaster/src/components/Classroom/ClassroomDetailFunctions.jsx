// src/hooks/useClassroomDetails.js
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getClassroomDetails, 
  getClassroomMembers,
  updateClassroom,
  deleteClassroom,
  removeStudentFromClassroom,
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
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student from the classroom?")) {
      return;
    }
    
    try {
      setLoading(true);
      await removeStudentFromClassroom(getToken(), classroomId, studentId);
      
      // Update members list by filtering out the removed student
      setMembers(prev => prev.filter(member => member.id !== studentId));
      
      // Update student count in classroom data
      setClassroom(prev => ({
        ...prev,
        studentCount: Math.max(0, prev.studentCount - 1)
      }));
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to remove student from classroom');
      console.error('Error removing student:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchClassroomData = async () => {
      if (authChecked && user && getToken()) {
        try {
          setLoading(true);
          setError(null);
          
          const classroomData = await getClassroomDetails(getToken(), classroomId);
          setClassroom(classroomData);
          setUpdatedData({
            name: classroomData.name,
            description: classroomData.description || ''
          });
          
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
      
      // Only send the fields we want to update
      const updatePayload = {
        ...(updatedData.name && { name: updatedData.name }),
        ...(updatedData.description && { description: updatedData.description })
      };

      // Get the updated fields from the API
      const updatedFields = await updateClassroom(
        getToken(), 
        classroomId, 
        updatePayload
      );

      // Merge the updated fields with the existing classroom data
      setClassroom(prev => ({
        ...prev,
        ...updatedFields,
        // Ensure we don't overwrite critical fields with null/undefined
        name: updatedFields.name ?? prev.name,
        description: updatedFields.description ?? prev.description
      }));
      
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteClassroom(getToken(), classroomId);
      navigate('/homepage');
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
    handleRemoveStudent,
    handleUpdateClassroom,
    handleDeleteClassroom,
    isTeacher: user?.role === "USER_TEACHER",
    isClassroomTeacher: user?.role === classroom?.teacher?.role
  };
};