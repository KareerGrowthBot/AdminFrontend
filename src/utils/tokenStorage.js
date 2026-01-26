/**
 * Token storage for AdminFrontend (localStorage-based auth).
 * Keys align with backend cookie names for consistency.
 */
const ACCESS_KEY = 'admin_accessToken';
const REFRESH_KEY = 'admin_refreshToken';

export const getAccessToken = () => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
  } catch {
    return null;
  }
};

export const setTokens = (accessToken, refreshToken) => {
  try {
    if (typeof window === 'undefined') return;
    if (accessToken != null) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken != null) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch (e) {
    console.warn('tokenStorage setTokens error', e);
  }
};

export const clearTokens = () => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch (e) {
    console.warn('tokenStorage clearTokens error', e);
  }
};

export const hasTokens = () => !!(getAccessToken() || getRefreshToken());
