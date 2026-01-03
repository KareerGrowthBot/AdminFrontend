import apiClient from "./apiService";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Authentication service - handles all auth-related API calls
 */
export const authService = {
  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{message: string, admin: object}>}
   */
  login: async (email, password) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
      email,
      password
    });
    // Normalize response: extract first element if admin is an array
    if (response.data && response.data.admin && Array.isArray(response.data.admin)) {
      response.data.admin = response.data.admin[0];
    }
    return response.data;
  },

  /**
   * Logout the current admin
   * @returns {Promise<{message: string}>}
   */
  logout: async () => {
    const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<{message: string, email: string}>}
   */
  refreshToken: async () => {
    const response = await apiClient.post(API_ENDPOINTS.REFRESH_TOKEN);
    return response.data;
  },

  /**
   * Get current admin information
   * @param {boolean} suppressLogging - If true, suppresses logging for this request (used during session check)
   * @returns {Promise<{id, email, fullName, role, organization, college}>}
   */
  getCurrentAdmin: async (suppressLogging = false) => {
    // Axios config object - pass custom flags to suppress logging
    const config = suppressLogging ? {
      _suppressLogging: true,
      _isSessionCheck: true
    } : {};
    const response = await apiClient.get(API_ENDPOINTS.GET_CURRENT_ADMIN, config);
    // Normalize response: extract first element if admin is an array
    if (response.data && response.data.admin && Array.isArray(response.data.admin)) {
      response.data.admin = response.data.admin[0];
    } else if (Array.isArray(response.data)) {
      // Handle case where response itself is an array
      return response.data[0];
    }
    return response.data;
  },

  /**
   * Fetch role permissions and store in localStorage
   * Similar to frontend_admin's fetchRolePermissions
   * @param {string} roleName - Role name (e.g., "ADMIN", "SUPERADMIN")
   * @param {string} organizationId - Organization ID (optional, required for ADMIN role)
   * @returns {Promise<Object>}
   */
  fetchRolePermissions: async (roleName, organizationId = null) => {
    if (!roleName) {
      console.error('Auth API: Role name not found');
      throw new Error('Role name not found');
    }

    console.log('Auth API: Attempting to fetch role permissions for role:', roleName, 'organizationId:', organizationId);
    try {
      let role = null;

      // Always use organizationId if available - call /api/roles/organization/{organizationId}
      if (organizationId) {
        const encodedOrgId = encodeURIComponent(organizationId);
        const rolesResponse = await apiClient.get(`/api/roles/organization/${encodedOrgId}`);
        const roles = rolesResponse.data || [];
        role = roles.find(r =>
          (typeof r === 'object' && (r.name === roleName || r.code === roleName)) ||
          r === roleName
        );
      } else {
        // Only use /api/roles if no organizationId (for SUPERADMIN without organization)
        const allRolesResponse = await apiClient.get('/api/roles');
        const allRoles = allRolesResponse.data || [];
        role = allRoles.find(r =>
          (typeof r === 'object' && (r.name === roleName || r.code === roleName)) ||
          r === roleName
        );
      }

      if (!role || !role.id) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Use the role data we already have - permissions are included in the response
      console.log('Auth API: Role found, using role data directly');
      console.log('Auth API: Role permissions from backend:', role.permissions);

      // Build roleData from the role object we already have
      // The backend now includes permissions in the role response
      let permissions = role.permissions || [];

      // If no permissions from backend and it's ADMIN/SUPERADMIN, grant CANDIDATE and POSITION permissions only
      // USER, ROLE, QUESTION are accessible to all users without permission checks
      if (permissions.length === 0 && (roleName === 'ADMIN' || roleName === 'SUPERADMIN')) {
        console.log('Auth API: No permissions found, granting CANDIDATE and POSITION permissions for system role');
        // Grant only CANDIDATE and POSITION permissions for system roles
        const allowedFeatures = ['CANDIDATE', 'POSITION'];
        permissions = allowedFeatures.map(feature => ({
          featureName: feature,
          permissionScopes: ['READ', 'CREATE', 'UPDATE', 'DELETE']
        }));
      }

      const roleData = {
        id: role.id,
        name: role.name || roleName,
        code: role.code || roleName,
        organizationId: role.organization?.organizationId || organizationId || null,
        isSystem: role.system || role.isSystem || false,
        permissions: permissions
      };

      console.log('Auth API: Final roleData with permissions:', {
        roleName: roleData.name,
        permissionsCount: roleData.permissions.length,
        permissions: roleData.permissions
      });

      if (roleData) {
        // Store role data in localStorage
        try {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('roleData', JSON.stringify(roleData));
            localStorage.setItem('roleName', roleData.name || '');
            localStorage.setItem('roleCode', roleData.code || '');
            localStorage.setItem('roleId', roleData.id || '');
            // Store organizationId from roleData or from parameter
            const orgId = roleData.organizationId || organizationId || '';
            localStorage.setItem('organizationId', orgId);
            localStorage.setItem('isSystemRole', (roleData.isSystem || false).toString());

            const permissions = roleData.permissions || [];

            // Store permissions in FeaturesPermissions array (like frontend_admin)
            const featuresPermissions = permissions.map(perm => ({
              featureName: perm.featureName,
              permissionScopes: perm.permissionScopes || []
            }));
            localStorage.setItem('FeaturesPermissions', JSON.stringify(featuresPermissions));

            // Also store individual feature permissions (like frontend_admin)
            permissions.forEach(permission => {
              const featureName = permission.featureName?.toLowerCase();
              if (featureName) {
                localStorage.setItem(`${featureName}Permissions`, JSON.stringify(permission.permissionScopes || []));
              }
            });

            console.log('Auth API: Role data and feature permissions stored in localStorage');
          }
        } catch (storageError) {
          if (storageError.name === 'SecurityError' || storageError.message?.includes('storage')) {
            console.warn("Storage access not allowed in this context:", storageError.message);
          } else {
            console.error("Error storing permissions in localStorage:", storageError);
          }
        }
      }

      return roleData;
    } catch (error) {
      console.error('Auth API: Fetch role permissions error', error);
      throw error;
    }
  }
};

