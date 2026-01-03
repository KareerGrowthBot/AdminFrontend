import apiClient from "./apiService";
import { getCachedResponse, setCachedResponse, clearCacheByPattern } from "../utils/apiCache";

/**
 * Position service - handles position management API calls
 */
export const positionService = {
  // Position Titles
  getAllPositionTitles: async () => {
    const endpoint = "/api/positions/titles";
    // Check cache first
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, {}, response.data);
    return response.data;
  },

  getPositionTitleById: async (id) => {
    const response = await apiClient.get(`/api/positions/titles/${id}`);
    return response.data;
  },

  createPositionTitle: async (title) => {
    const response = await apiClient.post("/api/positions/titles", { title });
    return response.data;
  },

  updatePositionTitle: async (id, title) => {
    const response = await apiClient.put(`/api/positions/titles/${id}`, { title });
    return response.data;
  },

  deletePositionTitle: async (id) => {
    const response = await apiClient.delete(`/api/positions/titles/${id}`);
    return response.data;
  },

  // Positions
  /**
   * Get all positions (with pagination, search, and filters)
   * @param {object} params - Search parameters
   * @param {number} params.page - Page number (0-indexed)
   * @param {number} params.size - Page size
   * @param {string} params.searchTerm - Search term for title, description, etc.
   * @param {string} params.status - Filter by status (ACTIVE, INACTIVE, DRAFT)
   * @param {string} params.createdFrom - Filter by creation date from (YYYY-MM-DD)
   * @param {string} params.createdTo - Filter by creation date to (YYYY-MM-DD)
   * @param {string} params.createdBy - Filter by creator user ID
   * @param {string} params.sortOrder - Sort order (NEWEST_TO_OLDEST, OLDEST_TO_NEWEST, TITLE_ASC)
   * @returns {Promise<{content: Array, page: number, size: number, totalElements: number, totalPages: number, last: boolean}>}
   */
  getAllPositions: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.organizationId) {
      queryParams.append('organizationId', params.organizationId);
    }
    if (params.page !== undefined) {
      queryParams.append('page', params.page);
    }
    if (params.size !== undefined) {
      queryParams.append('size', params.size);
    }
    if (params.searchTerm) {
      queryParams.append('searchTerm', params.searchTerm);
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.createdFrom) {
      queryParams.append('createdFrom', params.createdFrom);
    }
    if (params.createdTo) {
      queryParams.append('createdTo', params.createdTo);
    }
    if (params.createdBy) {
      queryParams.append('createdBy', params.createdBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    const endpoint = queryParams.toString()
      ? `/api/positions?${queryParams.toString()}`
      : "/api/positions";

    // For paginated requests, don't use cache
    if (queryParams.toString()) {
      const response = await apiClient.get(endpoint);
      return response.data;
    }

    // For non-paginated requests, use cache
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, {}, response.data);
    return response.data;
  },

  getPositionById: async (id) => {
    const endpoint = `/api/positions/${id}`;
    // Check cache first
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    // The API now returns ApiResponse<PositionDetailDTO>
    const data = response.data.data;
    setCachedResponse(endpoint, {}, data);
    return data;
  },

  getPositionDetails: async (id) => {
    const endpoint = `/api/positions/${id}/details`;
    const response = await apiClient.get(endpoint);
    return response.data.data;
  },

  createPosition: async (position) => {
    const response = await apiClient.post("/api/positions", position);
    // Clear positions cache after create
    clearCacheByPattern("/api/positions");
    return response.data.data;
  },

  updatePosition: async (id, position) => {
    const response = await apiClient.put(`/api/positions/${id}`, position);
    // Clear positions cache after update
    clearCacheByPattern("/api/positions");
    return response.data.data;
  },

  activatePosition: async (id) => {
    const response = await apiClient.patch(`/api/positions/${id}/activate`);
    // Clear positions cache after status change
    clearCacheByPattern("/api/positions");
    return response.data.data;
  },

  deactivatePosition: async (id) => {
    const response = await apiClient.patch(`/api/positions/${id}/deactivate`);
    // Clear positions cache after status change
    clearCacheByPattern("/api/positions");
    return response.data.data;
  },

  // Position Skills (DEPRECATED - now handled in consolidated position object)
  // Components should receive skills directly from getPositionById / getPositionDetails
  // and send skills directly in createPosition / updatePosition

  // Global Skills (for dropdowns)
  getAllMandatorySkills: async () => {
    const endpoint = "/api/skills/mandatory";
    // Check cache first
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, {}, response.data);
    return response.data;
  },

  getAllOptionalSkills: async () => {
    const endpoint = "/api/skills/optional";
    // Check cache first
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, {}, response.data);
    return response.data;
  },

  /**
   * Generate Skills using AI
   * @param {object} params
   */
  generateAiSkills: async (params) => {
    const response = await apiClient.post("/api/ai/generate-skills", params);
    return response.data;
  }
};

