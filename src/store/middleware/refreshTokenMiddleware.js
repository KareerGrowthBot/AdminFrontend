/**
 * Middleware to handle Refresh Token management
 * This is a utility function that can be used in API interceptors
 */
import { getRefreshToken } from '../../utils/refreshToken';

/**
 * Check and handle refresh token in API responses
 * @param {Object} response - Axios response object
 */
export const handleRefreshTokenInResponse = (response) => {
  console.log('RefreshToken Middleware processing response:', response.config?.url);
  
  // Check if response contains refresh token in cookies
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    console.log('Refresh token found and stored automatically in cookies');
  } else {
    console.warn('No refresh token found after request');
  }
  
  return response;
};

/**
 * Handle refresh token on logout
 */
export const handleRefreshTokenOnLogout = () => {
  console.log('Logout: Clearing refresh token cookies');
  // Token clearing is handled by cookieUtils
};

/**
 * Get current refresh token status
 * @returns {boolean} Whether refresh token exists
 */
export const hasRefreshToken = () => {
  const refreshToken = getRefreshToken();
  return !!refreshToken;
};

export default {
  handleRefreshTokenInResponse,
  handleRefreshTokenOnLogout,
  hasRefreshToken
};

