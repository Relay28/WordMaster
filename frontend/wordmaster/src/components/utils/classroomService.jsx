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