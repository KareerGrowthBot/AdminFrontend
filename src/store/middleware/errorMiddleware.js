/**
 * Error handling utilities for API errors
 */

// Error action types
export const API_ERROR = 'api/error';
export const AUTH_ERROR = 'auth/error';

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @param {Function} showToast - Function to show toast notification
 */
export const handleApiError = (error, showToast) => {
  console.error('API Error:', error);
  
  // Handle different error types
  if (error.response?.status === 401) {
    console.log('Unauthorized error - should redirect to login');
    // Clear auth and redirect
    if (showToast) {
      showToast({
        type: 'error',
        message: 'Session expired. Please login again.'
      });
    }
    return { type: AUTH_ERROR, shouldRedirect: true };
  }
  
  // Trigger toast notification if available
  if (showToast) {
    showToast({
      type: 'error',
      message: error.response?.data?.error || error.message || 'An error occurred'
    });
  }
  
  return { type: API_ERROR, error };
};

/**
 * Handle authentication errors
 * @param {Error} error - Error object
 * @param {Function} showToast - Function to show toast notification
 */
export const handleAuthError = (error, showToast) => {
  console.error('Auth Error:', error);
  
  if (showToast) {
    showToast({
      type: 'error',
      message: error.response?.data?.error || error.message || 'Authentication error'
    });
  }
  
  return { type: AUTH_ERROR, error };
};

export default {
  handleApiError,
  handleAuthError
};

