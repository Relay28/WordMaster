import axios from 'axios';
import API_URL from './apiConfig';

const contentService = {
  // Get all content for the teacher
  getAllContent: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all content:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get content by ID
  getContentById: async (id, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching content with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Get content created by the authenticated user
  getContentByCreator: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content/creator`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching content by creator:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get published content
  getPublishedContent: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content/published`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching published content:", error.response?.data || error.message);
      throw error;
    }
  },

  // Create content
  createContent: async (contentData, token) => {
    try {
      const response = await axios.post(`${API_URL}/api/content`, contentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error creating content:", error.response?.data || error.message);
      throw error;
    }
  },

  // Update content
  updateContent: async (id, contentData, token) => {
    try {
      const response = await axios.put(`${API_URL}/api/content/${id}`, contentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating content with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Delete content
  deleteContent: async (id, token) => {
    try {
      await axios.delete(`${API_URL}/api/content/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch (error) {
      console.error(`Error deleting content with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Publish content
  publishContent: async (id, token) => {
    try {
      const response = await axios.put(`${API_URL}/api/content/${id}/publish`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error publishing content with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Unpublish content
  unpublishContent: async (id, token) => {
    try {
      const response = await axios.put(`${API_URL}/api/content/${id}/unpublish`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error unpublishing content with ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Get content for a classroom
  getContentByClassroom: async (classroomId, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content/classroom/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching content for classroom ${classroomId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Get published content for a classroom
  getPublishedContentByClassroom: async (classroomId, token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content/classroom/${classroomId}/published`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching published content for classroom ${classroomId}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Create content for a classroom
  createContentForClassroom: async (contentData, classroomId, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/content/classroom/${classroomId}`, 
        contentData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error creating content for classroom ${classroomId}:`, error.response?.data || error.message);
      throw error;
    }
  },
};

export default contentService;