import apiClient from "./apiService";

/**
 * Question Section service - handles question section management API calls
 * This stores the detailed structure of all 4 interview rounds linked to a question set.
 */
export const questionSectionService = {
    /**
     * Create or update a question section
     * @param {string} questionSetId - The ID of the question set
     * @param {Object} data - The question section data (all 4 rounds)
     */
    createQuestionSection: async (questionSetId, data) => {
        const response = await apiClient.post(`/api/question-sections?questionSetId=${questionSetId}`, data);
        return response.data;
    },

    /**
     * Get question section by question set ID
     * @param {string} questionSetId 
     */
    getQuestionSectionByQuestionSet: async (questionSetId) => {
        const response = await apiClient.get(`/api/question-sections/question-set/${questionSetId}`);
        return response.data;
    },

    /**
     * Update question section by ID
     * @param {string} id 
     * @param {Object} data 
     */
    updateQuestionSection: async (id, data) => {
        const response = await apiClient.put(`/api/question-sections/${id}`, data);
        return response.data;
    },

    /**
     * Delete question section by ID
     * @param {string} id 
     */
    deleteQuestionSection: async (id) => {
        const response = await apiClient.delete(`/api/question-sections/${id}`);
        return response.data;
    }
};
