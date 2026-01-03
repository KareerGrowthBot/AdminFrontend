import apiClient from "./apiService";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Permission service - handles permission management API calls
 */
export const permissionService = {
  /**
   * Get all permissions
   * @returns {Promise<Array>}
   */
  getAllPermissions: async () => {
    const response = await apiClient.get("/api/permissions");
    return response.data;
  },

  /**
   * Get permissions by role ID
   * @param {string} roleId - Role ID (will be URL-encoded to handle special characters)
   * @returns {Promise<Array>}
   */
  getPermissionsByRole: async (roleId) => {
    // URL-encode the ID to handle special characters like / and +
    const encodedId = encodeURIComponent(roleId);
    const response = await apiClient.get(`/api/permissions/role/${encodedId}`);
    return response.data;
  },

  /**
   * Assign permissions to a role
   * @param {string} roleId - Role ID
   * @param {Array<string>} featureIds - Array of feature IDs
   * @returns {Promise<Object>}
   */
  assignPermissions: async (roleId, featureIds) => {
    const response = await apiClient.post("/api/permissions/assign", {
      roleId,
      featureIds
    });
    return response.data;
  },

  /**
   * Create a single permission
   * @param {Object} payload - { roleId, featureId, canAccess }
   * @returns {Promise<Object>}
   */
  createPermission: async (payload) => {
    const response = await apiClient.post("/api/permissions", payload);
    return response.data;
  }
};

