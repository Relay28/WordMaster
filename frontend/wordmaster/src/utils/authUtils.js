/**
 * Authentication utility functions for WordMaster application
 */

/**
 * Logs out the current user by removing authentication data from localStorage
 * @returns {void}
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Checks if a user is currently logged in
 * @returns {boolean} True if user is logged in
 */
export const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

/**
 * Gets the current user from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage', error);
    return null;
  }
};

/**
 * Gets the authentication token
 * @returns {string|null} The token or null if not present
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Saves authentication data to localStorage
 * @param {string} token - JWT token
 * @param {Object} user - User data object
 */
export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};
