import Cookies from "js-cookie";

/**
 * Clear all authentication cookies (frontend-specific)
 * Comprehensive cookie cleanup for logout
 */
export const clearAuthCookies = () => {
  // List of all possible cookie names to clear
  const cookiesToRemove = [
    "admin_accessToken",
    "admin_refreshToken",
    "accessToken",
    "refreshToken",
    "token",
    "authToken",
    "jwt",
    "jwtToken",
    "session",
    "sessionId",
    "XSRF-TOKEN",
    "xsrf-token",
    "csrf-token",
    "CSRF-TOKEN",
    "JSESSIONID",
    "admin",
    "user",
    "userId",
    "organizationId",
    "roleId",
    "roleName"
  ];
  
  // Clear cookies with different path options
  const paths = ["/", "/dashboard", "/login"];
  const domains = [undefined, window.location.hostname, `.${window.location.hostname}`];
  
  cookiesToRemove.forEach(cookieName => {
    paths.forEach(path => {
      domains.forEach(domain => {
        try {
          Cookies.remove(cookieName, { path, domain });
          // Also try without domain
          Cookies.remove(cookieName, { path });
        } catch (error) {
          // Ignore errors for cookie removal
        }
      });
    });
  });
  
  // Also clear all cookies by iterating through document.cookie
  try {
    const allCookies = document.cookie.split(';');
    allCookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        // Remove with all possible paths and domains
        paths.forEach(path => {
          domains.forEach(domain => {
            try {
              Cookies.remove(name, { path, domain });
              Cookies.remove(name, { path });
            } catch (error) {
              // Ignore errors
            }
          });
        });
      }
    });
  } catch (error) {
    console.warn('Error clearing all cookies:', error);
  }
};

