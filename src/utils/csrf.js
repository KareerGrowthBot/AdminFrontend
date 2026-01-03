/**
 * Utilities for handling CSRF tokens in the application
 */
import Cookies from 'js-cookie';

// Get XSRF token from cookies
export const getXSRFToken = () => {
  // Try js-cookie first
  const token = Cookies.get('XSRF-TOKEN');
  if (token) {
    console.log("XSRF token found:", token);
    return token;
  }
  
  // Fallback to manual cookie parsing
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      console.log("XSRF token is:", value);
      return value;
    }
  }
  return null;
};

// Set CSRF token in cookie (usually not needed as server sets it)
export const setCSRFToken = (token) => {
  console.log('Setting CSRF token in cookie:', token);
  Cookies.set('csrf', token, { path: '/', sameSite: 'lax', maxAge: 86400 });
  console.log('Cookie set, all cookies now:', document.cookie);
};

// Clear CSRF token (used during logout)
export const clearXSRFToken = () => {
  console.log('Clearing CSRF token from cookie');
  Cookies.remove('csrf', { path: '/' });
  Cookies.remove('XSRF-TOKEN', { path: '/' });
  document.cookie = 'csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  document.cookie = 'XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
};

// Function to decode base64 encoded CSRF token if needed
export const decodeCSRFToken = (token) => {
  if (!token) return null;
  
  try {
    console.log('Decoding CSRF token payload');
    // For base64 encoded tokens, you can decode with:
    // return JSON.parse(atob(token.split('.')[1]));
    
    // If your token is not actually encoded, just return it
    return token;
  } catch (error) {
    console.error('Error decoding CSRF token:', error);
    return null;
  }
};

