import apiClient from "./apiService";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Role service - handles role management API calls
 */
export const roleService = {
  /**
   * Get all roles
   * @returns {Promise<Array>}
   */
  getAllRoles: async () => {
    const response = await apiClient.get(API_ENDPOINTS.GET_ALL_ROLES);
    return response.data;
  },

  /**
   * Get role by ID
   * @param {string} id - Role ID (will be URL-encoded to handle special characters)
   * @returns {Promise<Object>}
   */
  getRoleById: async (id) => {
    // URL-encode the ID to handle special characters like / and +
    const encodedId = encodeURIComponent(id);
    const response = await apiClient.get(`${API_ENDPOINTS.GET_ROLE_BY_ID}/${encodedId}`);
    return response.data;
  },

  /**
   * Create a new role
   * @param {Object} payload - {name}
   * @returns {Promise<{message: string, role: object}>}
   */
  createRole: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_ROLE, payload);
    return response.data;
  },

  /**
   * Create a new role for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} payload - {name}
   * @returns {Promise<{message: string, role: object}>}
   */
  createRoleForOrganization: async (organizationId, payload) => {
    const response = await apiClient.post(`/api/roles/organization/${organizationId}`, payload);
    return response.data;
  },

  /**
   * Update a role
   * @param {string} id - Role ID (will be URL-encoded to handle special characters)
   * @param {Object} payload - {name}
   * @returns {Promise<{message: string, role: object}>}
   */
  updateRole: async (id, payload) => {
    // URL-encode the ID to handle special characters like / and +
    const encodedId = encodeURIComponent(id);
    const response = await apiClient.put(`${API_ENDPOINTS.UPDATE_ROLE}/${encodedId}`, payload);
    return response.data;
  },

  /**
   * Get roles by organization ID
   * @param {string} organizationId - Organization ID (will be URL-encoded to handle special characters)
   * @returns {Promise<Array>}
   */
  getRolesByOrganizationId: async (organizationId) => {
    // URL-encode the ID to handle special characters like / and +
    const encodedId = encodeURIComponent(organizationId);
    const response = await apiClient.get(`${API_ENDPOINTS.GET_ROLES_BY_ORGANIZATION}/${encodedId}`);
    return response.data;
  }
};

