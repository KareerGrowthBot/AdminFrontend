/**
 * Authentication utility functions
 */
import apiClient from '../services/apiService';
import { clearXSRFToken } from './csrf';
import { getRefreshToken } from './refreshToken';
import { clearAuthCookies } from './cookieUtils';

// Check if user is authenticated
export const isAuthenticated = () => {
  console.log('Checking if user is authenticated');
  
  const refreshToken = getRefreshToken();
  const isAuth = !!refreshToken;
  
  console.log('Authentication status:', isAuth);
  return isAuth;
};

// Attempt to refresh the access token
export const refreshToken = async () => {
  console.log('Attempting to refresh token');
  
  try {
    // Check if server supports refresh token endpoint
    const response = await apiClient.post('/auth/refresh-token');
    console.log('Token refresh successful');
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Handle user logout
export const logout = async () => {
  console.log('Logging user out');
  
  try {
    // Call logout endpoint to invalidate JWT on server
    await apiClient.post('/auth/logout');
    
    // Clear CSRF token
    clearXSRFToken();
    
    // Clear auth cookies
    clearAuthCookies();
    
    console.log('Logout successful');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if the server request fails, clear local tokens
    clearXSRFToken();
    clearAuthCookies();
    
    return false;
  }
};

