import apiClient from "./apiService";

/**
 * Instruction Section service - handles instruction section management API calls
 * This stores the detailed instructions linked to a question set in MongoDB.
 */
export const instructionService = {
    /**
     * Create or update an instruction section
     * @param {Object} data - The instruction section data
     */
    saveInstruction: async (data) => {
        const response = await apiClient.post("/api/instruction-sections", data);
        return response.data;
    },

    /**
     * Get instructions by question set ID
     * @param {string} questionSetId 
     */
    getInstructionsByQuestionSet: async (questionSetId) => {
        const response = await apiClient.get(`/api/instruction-sections/question-set/${questionSetId}`);
        return response.data;
    },

    /**
     * Get instructions by position ID
     * @param {string} positionId 
     */
    getInstructionsByPosition: async (positionId) => {
        const response = await apiClient.get(`/api/instruction-sections/position/${positionId}`);
        return response.data;
    },

    /**
     * Delete instruction section by ID
     * @param {string} id 
     */
    deleteInstruction: async (id) => {
        const response = await apiClient.delete(`/api/instruction-sections/${id}`);
        return response.data;
    }
};
