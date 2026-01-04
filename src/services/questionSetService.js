import apiClient from "./apiService";
import { getCachedResponse, setCachedResponse, clearCacheByPattern } from "../utils/apiCache";

/**
 * Question Set service - handles question set management API calls
 */
export const questionSetService = {
  // Question Sets
  getAllQuestionSets: async () => {
    const endpoint = "/api/question-sets";
    // Check cache first
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, {}, response.data);
    return response.data;
  },

  getQuestionSetById: async (id) => {
    const endpoint = `/api/question-sets/${id}`;
    // Check cache first
    const cached = getCachedResponse(endpoint);
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, {}, response.data);
    return response.data;
  },

  getQuestionSetsByPositionId: async (positionId) => {
    const endpoint = `/api/question-sets/position/${positionId}`;
    // Check cache first
    const cached = getCachedResponse(endpoint, { positionId });
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, { positionId }, response.data);
    return response.data;
  },

  getQuestionSetDetailsByPositionId: async (positionId) => {
    const endpoint = `/api/question-sets/position/${positionId}/details`;
    // Check cache first
    const cached = getCachedResponse(endpoint, { positionId });
    if (cached) {
      return cached;
    }

    const response = await apiClient.get(endpoint);
    setCachedResponse(endpoint, { positionId }, response.data);
    return response.data;
  },

  createQuestionSet: async (questionSet) => {
    const response = await apiClient.post("/api/question-sets", questionSet);
    // Clear question sets cache after create
    clearCacheByPattern("/api/question-sets");
    return response.data;
  },

  updateQuestionSet: async (id, questionSet) => {
    const response = await apiClient.put(`/api/question-sets/${id}`, questionSet);
    // Clear question sets cache after update
    clearCacheByPattern("/api/question-sets");
    return response.data;
  },

  deleteQuestionSet: async (id) => {
    const response = await apiClient.delete(`/api/question-sets/${id}`);
    // Clear question sets cache after delete
    clearCacheByPattern("/api/question-sets");
    return response.data;
  }
};

