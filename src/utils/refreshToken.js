/**
 * Utility to get refresh token from cookies
 */
import Cookies from 'js-cookie';

export const getRefreshToken = () => {
  // Try js-cookie first
  const token = Cookies.get('refreshToken');
  if (token) {
    console.log('Refresh token found in cookies');
    return token;
  }
  
  // Fallback to manual cookie parsing
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'refreshToken') {
      console.log('Refresh token found in cookies:', value);
      return value;
    }
  }
  
  console.warn('No refresh token found in cookies');
  return null;
};

