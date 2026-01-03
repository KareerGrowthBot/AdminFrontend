import aiBackendClient from "./aiBackendService";

/**
 * AI Service for generating questions using AI
 * Calls Python AI service directly (no Java backend interaction)
 */
export const aiService = {
  /**
   * Generate interview questions using AI
   * @param {Object} params - Generation parameters
   * @param {string} params.questionType - Type of questions (GENERAL, POSITION_SPECIFIC)
   * @param {string} params.difficulty - Difficulty level (EASY, MEDIUM, HARD)
   * @param {string} params.positionTitle - Position title for context
   * @param {Array<string>} params.topics - Optional topics
   * @returns {Promise<Object>} Response with questions array and questionId
   */
  generateInterviewQuestions: async ({ questionType, difficulty, positionTitle, topics }) => {
    const response = await aiBackendClient.post("/generate-interview-questions", {
      questionType,
      difficulty: difficulty || "MEDIUM",
      positionTitle: positionTitle || "",
      topics: topics || []
    });
    return response.data;
  },

  /**
   * Get all generated questions from MongoDB
   * @param {Object} params - Query parameters
   * @param {string} params.questionType - Filter by question type (optional)
   * @param {number} params.limit - Maximum results (default: 100)
   * @param {number} params.skip - Skip results (default: 0)
   * @returns {Promise<Object>} Response with questions array
   */
  getAllQuestions: async ({ questionType, limit = 100, skip = 0 } = {}) => {
    const params = new URLSearchParams();
    if (questionType) params.append("question_type", questionType);
    params.append("limit", limit.toString());
    params.append("skip", skip.toString());

    const response = await aiBackendClient.get(`/questions?${params.toString()}`);
    return response.data;
  },

  /**
   * Generate coding question using AI
   * @param {Object} params - Generation parameters
   * @param {string} params.language - Programming language
   * @param {string} params.difficulty - Difficulty level (EASY, MEDIUM, HARD)
   * @param {Array<string>} params.topics - Optional topics
   * @returns {Promise<Object>} Response with coding problem details
   */
  generateCodingQuestion: async ({ language, difficulty, topics }) => {
    const response = await apiClient.post("/api/ai/generate-coding-question", {
      language,
      difficulty: difficulty || "EASY",
      topics: topics || []
    });
    return response.data;
  },

  /**
   * Extract features/data from resume text
   * @param {string} resumeText - Text content of the resume
   * @returns {Promise<Object>} Extracted resume data
   */
  extractResume: async (resumeText) => {
    const response = await aiBackendClient.post("/extract-resume", {
      resumeText
    });
    return response.data;
  }
};

