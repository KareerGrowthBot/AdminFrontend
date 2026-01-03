/**
 * Middleware to handle CSRF token management
 */
import { clearXSRFToken, getXSRFToken } from '../../utils/csrf';

/**
 * Handle CSRF token on login success
 * @param {Object} response - API response object
 */
export const handleCSRFOnLogin = (response) => {
  console.log('XSRF Middleware: Login success');
  const xsrfToken = getXSRFToken();
  if (xsrfToken) {
    console.log('XSRF token found after login');
  } else {
    console.warn('No XSRF token found after login');
  }
  return response;
};

/**
 * Handle CSRF token on logout
 */
export const handleCSRFOnLogout = () => {
  console.log('Clearing CSRF token on logout');
  clearXSRFToken();
};

/**
 * Handle CSRF token refresh
 * @param {Object} response - API response object
 */
export const handleCSRFOnRefresh = (response) => {
  console.log('Updating CSRF token after token refresh');
  const xsrfToken = getXSRFToken();
  if (xsrfToken) {
    console.log('XSRF token updated');
  }
  return response;
};

/**
 * Get current CSRF token status
 * @returns {boolean} Whether CSRF token exists
 */
export const hasCSRFToken = () => {
  const xsrfToken = getXSRFToken();
  return !!xsrfToken;
};

export default {
  handleCSRFOnLogin,
  handleCSRFOnLogout,
  handleCSRFOnRefresh,
  hasCSRFToken
};

