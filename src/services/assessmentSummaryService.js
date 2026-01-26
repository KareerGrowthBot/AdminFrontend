import axios from "axios";
import { CANDIDATE_BACKEND_URL } from "../constants/api";

/**
 * Axios instance configured for Candidate Backend API calls
 * Used for assessment summary operations
 */
const candidateBackendClient = axios.create({
  baseURL: CANDIDATE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000,
  withCredentials: true
});

/**
 * Assessment Summary Service - handles assessment summary API calls
 */
export const assessmentSummaryService = {
  /**
   * Create assessment summary
   * POST /assessment-summaries
   * @param {Object} payload - Assessment summary payload
   * @param {string} payload.positionId - Position ID
   * @param {string} payload.candidateId - Candidate ID
   * @param {string} payload.questionId - Question Set ID
   * @param {number} payload.totalRoundsAssigned - Total rounds assigned
   * @param {number} payload.totalRoundsCompleted - Total rounds completed
   * @param {boolean} payload.round1Assigned - Round 1 (general) assigned
   * @param {boolean} payload.round1Completed - Round 1 completed
   * @param {boolean} payload.round2Assigned - Round 2 (position) assigned
   * @param {boolean} payload.round2Completed - Round 2 completed
   * @param {boolean} payload.round3Assigned - Round 3 (aptitude) assigned
   * @param {boolean} payload.round3Completed - Round 3 completed
   * @param {boolean} payload.round4Assigned - Round 4 (coding) assigned
   * @param {boolean} payload.round4Completed - Round 4 completed
   * @param {boolean} payload.isAssessmentCompleted - Is assessment completed
   * @param {boolean} payload.isReportGenerated - Is report generated
   * @param {string|number} payload.totalInterviewTime - Total interview time
   * @returns {Promise} Assessment summary response
   */
  createAssessmentSummary: async (payload) => {
    try {
      console.log("📤 Creating assessment summary:", payload);
      console.log("📤 API URL:", `${CANDIDATE_BACKEND_URL}/assessment-summaries`);
      const response = await candidateBackendClient.post("/assessment-summaries", payload);
      console.log("✅ Assessment summary created:", response.data);
      console.log("✅ Response status:", response.status);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to create assessment summary:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error config:", error.config);
      throw error;
    }
  },

  /**
   * Get assessment summary by position and candidate
   * GET /assessment-summaries/position/{positionId}/candidate/{candidateId}
   * @param {string} positionId - Position ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise} Assessment summary data
   */
  getAssessmentSummary: async (positionId, candidateId) => {
    try {
      const response = await candidateBackendClient.get(
        `/assessment-summaries/position/${positionId}/candidate/${candidateId}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch assessment summary:", error);
      throw error;
    }
  }
};

export default assessmentSummaryService;
