/**
 * Axios configuration with interceptors
 */
import axios from 'axios';
import { getXSRFToken } from '../utils/csrf';
import { getRefreshToken } from '../utils/refreshToken';
import { clearAuthCookies } from '../utils/cookieUtils';
import { logRequest, logResponse, logError } from '../store/middleware/loggerMiddleware';
import { API_BASE_URL } from '../constants/api';

// Flag to prevent redirects during session check
let isCheckingSession = false;
let isRefreshingToken = false;

export const setSessionCheckFlag = (value) => {
  isCheckingSession = value;
};

// Create axios instance with baseURL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  withCredentials: true, // Important for cookies to be sent automatically
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if logging should be suppressed (from config or session check flag)
    // Check both relative URL and full URL
    const url = config.url || '';
    const isAuthMeRequest = url.includes('/auth/me') || url.endsWith('/auth/me');
    
    // Set flags if this is a session check request
    if (isCheckingSession && isAuthMeRequest && !config._suppressLogging) {
      config._isSessionCheck = true;
      config._suppressLogging = true;
    }
    
    // Only log requests that aren't marked to suppress logging
    if (!config._suppressLogging && !config._isSessionCheck) {
      logRequest(config);
    }
    
    // Add CSRF token to headers if available
    const xsrfToken = getXSRFToken();
    if (xsrfToken) {
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }
    
    // Add frontend type identifier to differentiate cookies between frontends
    config.headers['X-Frontend-Type'] = 'admin';
    
    return config;
  },
  (error) => {
    // Suppress logging if flag is set
    if (!error.config?._suppressLogging && !error.config?._isSessionCheck) {
      logError(error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Only log responses that aren't marked to suppress logging
    if (!response.config?._suppressLogging && !response.config?._isSessionCheck) {
      logResponse(response);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthError = error.response && (error.response.status === 401 || error.response.status === 403);
    
    // Check if logging should be suppressed (calculate once, reuse throughout)
    const shouldSuppressLogging = originalRequest?._suppressLogging || 
                                  originalRequest?._isSessionCheck ||
                                  (isCheckingSession && (originalRequest?.url?.includes('/auth/me') || originalRequest?.url?.endsWith('/auth/me')));
    
    // Only log errors that aren't marked to suppress logging
    if (!shouldSuppressLogging) {
      logError(error);
    }
    
    // Handle 401 Unauthorized and 403 Forbidden errors globally (both indicate auth failures)
    if (isAuthError) {
      const status = error.response.status;
      const url = originalRequest?.url || '';
      const isLogoutRequest = url.includes('/auth/logout') || url.endsWith('/auth/logout');
      
      // Don't try to refresh token or redirect for logout requests - just let them fail gracefully
      if (isLogoutRequest) {
        return Promise.reject(error);
      }
      
      // Don't redirect if we're checking session - let the App handle it
      if (isCheckingSession) {
        // Silently reject during session check - this is expected when no session exists
        return Promise.reject(error);
      }
      
      // Don't redirect if we're already refreshing token
      if (isRefreshingToken) {
        return Promise.reject(error);
      }
      
      // Try to refresh token if we haven't already retried
      // Note: We can't check if refresh token exists (httpOnly cookie), so we just try
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        isRefreshingToken = true;
        
        try {
          // Attempt to refresh token - cookies are sent automatically
          const response = await axiosInstance.post('/auth/refresh-token');
          isRefreshingToken = false;
          
          // Retry original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed or endpoint doesn't exist
          isRefreshingToken = false;
          
          // Only clear and redirect if not during session check
          if (!isCheckingSession) {
            clearAuthCookies();
            // Use window.location only if we're not in a protected route check
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Already retried, clear auth and redirect
        // Only clear and redirect if not during session check
        if (!isCheckingSession) {
          clearAuthCookies();
          // Use window.location only if we're not in a protected route check
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      }
      
      return Promise.reject(error);
    }
    
    // Handle other API errors (only log if not suppressed - reuse shouldSuppressLogging from above)
    if (!shouldSuppressLogging) {
      if (error.response) {
        console.error(`Request failed with status: ${error.response.status}`);
        console.error('Error data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

