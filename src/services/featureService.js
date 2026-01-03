import apiClient from "./apiService";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Feature service - handles feature management API calls
 */
export const featureService = {
  /**
   * Get all features
   * @returns {Promise<Array>}
   */
  getAllFeatures: async () => {
    const response = await apiClient.get("/api/features");
    return response.data;
  },

  /**
   * Get feature by ID
   * @param {string} id - Feature ID
   * @returns {Promise<Object>}
   */
  getFeatureById: async (id) => {
    const response = await apiClient.get(`/api/features/${id}`);
    return response.data;
  }
};

