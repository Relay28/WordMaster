import axios from 'axios';

// Fix the environment variable access for Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
      throw error;
    }
  },

  // Get content created by the authenticated user
  // Note: No longer requires creatorId parameter as backend uses Authentication object
  getContentByCreator: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/content/creator`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
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
      throw error;
    }
  },

  // Create new content
  // Note: No longer needs creatorId in URL as backend uses Authentication object
  createContent: async (contentData, token) => {
    try {
      const response = await axios.post(`${API_URL}/api/content/creator`, contentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
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
      throw error;
    }
  },

  // Get content for a classroom
  getContentByClassroom: async (classroomId, token) => {
    console.log("Calling getContentByClassroom with ID:", classroomId); // Debug logging
    try {
      const response = await axios.get(`${API_URL}/api/content/classroom/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Content for classroom response:", response.data); // Debug logging
      return response.data;
    } catch (error) {
      console.error("Error fetching classroom content:", error); // Debug logging
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
      throw error;
    }
  },

  // Create content for a classroom
  // Note: No longer requires creatorId in URL as backend uses Authentication object
  createContentForClassroom: async (contentData, classroomId, token) => {
    console.log("Creating content for classroom:", classroomId);
    console.log("Content data being sent:", JSON.stringify(contentData));
    
    try {
      // Make sure classroomId is a valid number
      if (!classroomId || isNaN(Number(classroomId))) {
        throw new Error(`Invalid classroom ID: ${classroomId}`);
      }
      
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
      console.log("Create content for classroom response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating content for classroom:", error.response?.data || error.message);
      throw error;
    }
  },
};

export default contentService;