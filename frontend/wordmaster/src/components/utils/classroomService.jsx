// src/services/classroomService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const getUserClassrooms = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/classrooms`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw error;
  }
};


export const createClassroom = async (token, classroomData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/classrooms`,
      classroomData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating classroom:', error);
    throw error;
  }
};

export const joinClassroom = async (token, enrollmentCode) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/classrooms/enroll`,
      null,
      {
        params: { enrollmentCode },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error joining classroom:', error);
    throw error;
  }

  
};

// src/services/classroomService.js
// ... (existing imports and functions)

export const getClassroomDetails = async (token, classroomId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/classrooms/${classroomId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching classroom details:', error);
    throw error;
  }
};

export const getClassroomMembers = async (token, classroomId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/classrooms/${classroomId}/members`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching classroom members:', error);
    throw error;
  }
};

export const getClassroomMemberCount = async (token, classroomId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/classrooms/${classroomId}/member-count`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching member count:', error);
    throw error;
  }
};

export const updateClassroom = async (token, classroomId, updatedData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/classrooms/${classroomId}`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating classroom:', error);
    throw error;
  }
};

export const deleteClassroom = async (token, classroomId) => {
  try {
    await axios.delete(`${API_BASE_URL}/classrooms/${classroomId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    throw error;
  }
};