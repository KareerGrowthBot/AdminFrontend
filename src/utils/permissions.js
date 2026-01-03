/**
 * Permission utility functions
 */

/**
 * Get all permissions from localStorage
 * Returns: [{ featureName: "CANDIDATE", permissionScopes: ["READ", "CREATE"] }, ...]
 */
export const getAllPermissions = () => {
  try {
    // Check if localStorage is available (not in service worker, iframe with restrictions, etc.)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    return JSON.parse(localStorage.getItem("FeaturesPermissions")) || [];
  } catch (e) {
    // Handle "Access to storage is not allowed from this context" error
    if (e.name === 'SecurityError' || e.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context:", e.message);
    } else {
      console.error("Error parsing permissions from localStorage", e);
    }
    return [];
  }
};

/**
 * Get scopes for a specific feature (e.g., "CANDIDATE", "POSITION")
 * Checks both FeaturesPermissions array and individual feature permissions (like frontend_admin)
 */
export const getPermissionsForFeature = (featureName) => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    // First try FeaturesPermissions array
    const allPermissions = getAllPermissions();
    const feature = allPermissions.find(
      (p) => p.featureName?.toUpperCase() === featureName.toUpperCase()
    );
    if (feature?.permissionScopes) {
      return feature.permissionScopes;
    }
    
    // Fallback to individual feature permissions (like frontend_admin)
    const featureNameLower = featureName.toLowerCase();
    const permissionKeys = [
      `${featureNameLower}Permissions`,
      `${featureName}Permissions`,
      `${featureNameLower.slice(0, -1)}Permissions` // Handle plural/singular (e.g., candidate/candidates)
    ];
    
    for (const key of permissionKeys) {
      const permissionsStr = localStorage.getItem(key);
      if (permissionsStr) {
        try {
          const permissions = JSON.parse(permissionsStr);
          if (Array.isArray(permissions)) {
            return permissions;
          }
        } catch (parseError) {
          console.error(`Error parsing permissions from ${key}:`, parseError);
        }
      }
    }
    
    return [];
  } catch (e) {
    if (e.name === 'SecurityError' || e.message?.includes('storage')) {
      console.warn("Storage access not allowed in this context:", e.message);
    } else {
      console.error("Error getting permissions for feature:", e);
    }
    return [];
  }
};

/**
 * Check if user has ANY permission for a feature (READ, CREATE, UPDATE, DELETE)
 * @param {string} featureName - Feature name (e.g., "CANDIDATE")
 * @returns {boolean} True if user has any permission for this feature
 */
export const hasAnyPermission = (featureName) => {
  try {
    // Check if user is ADMIN or SUPERADMIN - grant full access
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const roleName = localStorage.getItem('roleName') || '';
      const roleCode = localStorage.getItem('roleCode') || '';
      const isSystemRole = localStorage.getItem('isSystemRole') === 'true';
      
      // ADMIN and SUPERADMIN have complete access to everything
      if (roleName === 'ADMIN' || roleName === 'SUPERADMIN' || 
          roleCode === 'ADMIN' || roleCode === 'SUPERADMIN' ||
          isSystemRole) {
        return true;
      }
    }
    
    // Check if user has any permission for this feature
    const scopes = getPermissionsForFeature(featureName);
    return scopes && scopes.length > 0;
  } catch (error) {
    console.error('Error checking any permission:', error);
    return false;
  }
};

/**
 * Check if user has a specific permission scope for a feature
 * e.g. hasPermission("CANDIDATE", "CREATE")
 * Works like frontend_admin's checkPermission function
 * ADMIN and SUPERADMIN roles have full access to everything
 */
export const hasPermission = (featureName, permissionScopes) => {
  try {
    // Check if user is ADMIN or SUPERADMIN - grant full access
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const roleName = localStorage.getItem('roleName') || '';
      const roleCode = localStorage.getItem('roleCode') || '';
      const isSystemRole = localStorage.getItem('isSystemRole') === 'true';
      
      // ADMIN and SUPERADMIN have complete access to everything
      if (roleName === 'ADMIN' || roleName === 'SUPERADMIN' || 
          roleCode === 'ADMIN' || roleCode === 'SUPERADMIN' ||
          isSystemRole) {
        return true;
      }
    }
    
    // For other roles, check permissions normally
    const scopes = getPermissionsForFeature(featureName);
    const actionUpper = String(permissionScopes).toUpperCase();
    const featureUpper = String(featureName).toUpperCase();
    
    // Debug logging for permission checks
    if (featureUpper === 'CANDIDATE') {
      console.log('Permission check for CANDIDATE:', {
        featureName: featureUpper,
        permissionScopes: actionUpper,
        availableScopes: scopes,
        allPermissions: getAllPermissions()
      });
    }
    
    // Check if permissions array includes the action (case-insensitive)
    // Also handle WRITE as CREATE for backward compatibility
    const hasPermission = scopes.some(perm => {
      const permUpper = String(perm).toUpperCase();
      return permUpper === actionUpper || 
             (actionUpper === 'CREATE' && permUpper === 'WRITE') ||
             (actionUpper === 'WRITE' && permUpper === 'CREATE');
    });
    
    return hasPermission;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

/**
 * Custom hook for feature permissions
 * @param {string} featureName - Feature name
 * @returns {Object} Permission flags
 */
export const useFeaturePermissions = (featureName) => {
  const can = (permissionScopes) => hasPermission(featureName, permissionScopes);

  return {
    canCreate: can("CREATE"),
    canRead: can("READ"),
    canUpdate: can("UPDATE"),
    canDelete: can("DELETE"),
  };
};

