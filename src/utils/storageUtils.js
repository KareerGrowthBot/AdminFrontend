/**
 * Utility functions for accessing stored values from localStorage
 * These values are set during login and session check
 */

/**
 * Get the current user's ID from localStorage
 * @returns {string|null} User ID or null if not found
 */
export const getUserId = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem('userId');
};

/**
 * Get the current user's organization ID from localStorage
 * @returns {string|null} Organization ID or null if not found
 */
export const getOrganizationId = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem('organizationId');
};

/**
 * Get the current user's database name from localStorage
 * This is the organization-specific database name (e.g., "kareerGrowth_demo")
 * @returns {string|null} Database name or null if not found
 */
export const getDbName = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem('dbName');
};

/**
 * Get all stored user information from localStorage
 * @returns {Object} Object containing userId, organizationId, dbName, roleName, etc.
 */
export const getUserInfo = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }

  return {
    userId: localStorage.getItem('userId'),
    organizationId: localStorage.getItem('organizationId'),
    dbName: localStorage.getItem('dbName'),
    roleName: localStorage.getItem('roleName'),
    roleCode: localStorage.getItem('roleCode'),
    isSystemRole: localStorage.getItem('isSystemRole') === 'true',
  };
};

/**
 * Clear all stored user information from localStorage
 * Used during logout - clears ALL localStorage items
 */
export const clearUserInfo = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  // Clear all known localStorage items
  const itemsToRemove = [
    'userId',
    'organizationId',
    'dbName',
    'roleName',
    'roleCode',
    'roleId',
    'isSystemRole',
    'FeaturesPermissions',
    'admin',
    'adminInfo',
    'permissions',
    'candidatesPermissions',
    'positionsPermissions',
    'usersPermissions',
    'rolesPermissions',
    'isAuthenticated',
    'accessToken',
    'refreshToken',
    'admin_accessToken',
    'admin_refreshToken',
    'token',
    'authToken',
    'user',
    'userData',
    'currentUser',
    'session',
    'sessionData'
  ];

  itemsToRemove.forEach(item => {
    try {
      localStorage.removeItem(item);
    } catch (error) {
      console.warn(`Failed to remove localStorage item ${item}:`, error);
    }
  });

  // Clear all localStorage items EXCEPT preserved keys
  try {
    const preservedKeys = [
      'admin_remembered_email',
      'admin_remembered_password',
      'admin_remember_me'
    ];

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!preservedKeys.includes(key)) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key ${key}:`, error);
        }
      }
    });
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
  }
};


