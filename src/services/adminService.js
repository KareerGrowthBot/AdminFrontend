import apiClient from "./apiService";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Admin service - handles admin management API calls
 */
export const adminService = {
  /**
   * Get all admins
   * @returns {Promise<Array>}
   */
  getAllAdmins: async (params) => {
    // If organizationId is provided in params, use the organization-scoped endpoint
    if (params && params.organizationId) {
      const encodedId = encodeURIComponent(params.organizationId);
      const response = await apiClient.get(`${API_ENDPOINTS.GET_USERS_BY_ORGANIZATION}/${encodedId}`, { params });
      return response.data;
    }
    const response = await apiClient.get(API_ENDPOINTS.GET_ALL_ADMINS, { params });
    return response.data;
  },

  /**
   * Create a new admin
   * @param {Object} payload - {email, password, fullName, role, organizationName}
   * @returns {Promise<{message: string, admin: object}>}
   */
  createAdmin: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_ADMIN, payload);
    return response.data;
  },

  /**
   * Update an admin
   * @param {number} id - Admin ID
   * @param {Object} payload - {fullName, phone, active}
   * @returns {Promise<{message: string, admin: object}>}
   */
  updateAdmin: async (id, payload) => {
    const response = await apiClient.put(`${API_ENDPOINTS.UPDATE_ADMIN}/${id}`, payload);
    return response.data;
  },

  /**
   * Get admin by ID
   * @param {string} id - Admin ID
   * @returns {Promise<Object>}
   */
  getAdminById: async (id) => {
    const encodedId = encodeURIComponent(id);
    const response = await apiClient.get(`/api/admins/${encodedId}`);
    return response.data;
  },

  /**
   * Get users by organization ID
   * @param {string} organizationId - Organization ID (will be URL-encoded to handle special characters)
   * @returns {Promise<Array>}
   */
  getUsersByOrganizationId: async (organizationId) => {
    // URL-encode the ID to handle special characters like / and +
    const encodedId = encodeURIComponent(organizationId);
    const response = await apiClient.get(`${API_ENDPOINTS.GET_USERS_BY_ORGANIZATION}/${encodedId}`);
    return response.data;
  },

  /**
   * Activate an admin user
   * @param {string} id - Admin ID
   * @returns {Promise<{message: string, admin: object}>}
   */
  activateAdmin: async (id) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.UPDATE_ADMIN}/${id}/activate`);
    return response.data;
  },

  /**
   * Deactivate an admin user
   * @param {string} id - Admin ID
   * @returns {Promise<{message: string, admin: object}>}
   */
  deactivateAdmin: async (id) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.UPDATE_ADMIN}/${id}/deactivate`);
    return response.data;
  },

  /**
   * Get role by admin ID
   * @param {string} id - Admin ID
   * @returns {Promise<Object>} Role with permissions
   */
  getRoleByAdminId: async (id) => {
    const encodedId = encodeURIComponent(id);
    const response = await apiClient.get(`/api/admins/${encodedId}/role`);
    return response.data;
  },

  /**
   * Create a new user for an organization
   * @param {string} organizationId
   * @param {Object} payload - {email, password, fullName, roleId, phone}
   * @returns {Promise<{message: string, user: object}>}
   */
  createUserForOrganization: async (organizationId, payload) => {
    const encodedId = encodeURIComponent(organizationId);
    const response = await apiClient.post(`${API_ENDPOINTS.GET_USERS_BY_ORGANIZATION}/${encodedId}/users`, payload);
    return response.data;
  }
};

