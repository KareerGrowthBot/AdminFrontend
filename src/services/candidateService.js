import apiClient from "./apiService";
import { API_ENDPOINTS } from "../constants/api";

/**
 * Candidate service - handles candidate management API calls
 */
export const candidateService = {
  /**
   * Get all candidates (with pagination, search, and filters)
   * @param {object} params - Search parameters
   * @param {string} params.organizationId - Optional organization ID to filter candidates
   * @param {number} params.page - Page number (0-indexed)
   * @param {number} params.size - Page size
   * @param {string} params.searchTerm - Search term for name, email, code, etc.
   * @param {string} params.createdFrom - Filter by creation date from (YYYY-MM-DD)
   * @param {string} params.createdTo - Filter by creation date to (YYYY-MM-DD)
   * @param {Array<string>} params.status - Filter by status array
   * @param {string} params.createdBy - Filter by creator user ID
   * @param {string} params.sortOrder - Sort order (NEWEST_TO_OLDEST, OLDEST_TO_NEWEST, etc.)
   * @returns {Promise<{content: Array, page: number, size: number, totalElements: number, totalPages: number, last: boolean}>}
   */
  getAllCandidates: async (params = {}) => {
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
    if (params.createdFrom) {
      queryParams.append('createdFrom', params.createdFrom);
    }
    if (params.createdTo) {
      queryParams.append('createdTo', params.createdTo);
    }
    if (params.status && Array.isArray(params.status)) {
      params.status.forEach(status => queryParams.append('status', status));
    }
    if (params.createdBy) {
      queryParams.append('createdBy', params.createdBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params.degree) {
      queryParams.append('degree', params.degree);
    }
    if (params.stream) {
      queryParams.append('stream', params.stream);
    }
    if (params.semester) {
      queryParams.append('semester', params.semester);
    }

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.GET_ALL_CANDIDATES}?${queryParams.toString()}`
      : API_ENDPOINTS.GET_ALL_CANDIDATES;

    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get candidates with test assignments (candidates who have been assigned to positions/tests)
   * @param {string} organizationId - Optional organization ID to filter candidates
   * @returns {Promise<Array>}
   */
  getCandidatesWithTestAssignments: async (organizationId = null) => {
    const url = organizationId
      ? `${API_ENDPOINTS.GET_CANDIDATES_WITH_TEST_ASSIGNMENTS}?organizationId=${encodeURIComponent(organizationId)}`
      : API_ENDPOINTS.GET_CANDIDATES_WITH_TEST_ASSIGNMENTS;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Create candidate invitation
   * @param {string} email - Candidate email
   * @returns {Promise<{message: string, candidate: object}>}
   */
  createCandidateInvitation: async (email) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_CANDIDATE_INVITATION, { email });
    return response.data;
  },

  /**
   * Search candidate by email in organization
   * Automatically filters by the current admin's organization (SUPERADMIN can search all organizations)
   * @param {string} email - Candidate email
   * @param {boolean} includeNullOrg - If true, searches for candidates with null organizationId (for AddCandidate page)
   * @returns {Promise<object>} Candidate object if found, throws 404 if not found
   */
  searchCandidateByEmail: async (email, includeNullOrg = false) => {
    const response = await apiClient.get(`${API_ENDPOINTS.SEARCH_CANDIDATE_BY_EMAIL}?email=${encodeURIComponent(email)}&includeNullOrg=${includeNullOrg}`, {
      _suppressLogging: true
    });
    return response.data;
  },

  /**
   * Get candidate by email
   * @param {string} email - Candidate email
   * @returns {Promise<object>}
   */
  getCandidateByEmail: async (email) => {
    const response = await apiClient.get(`${API_ENDPOINTS.GET_CANDIDATE_BY_EMAIL}/${email}`);
    return response.data;
  },

  /**
   * Get candidate by ID
   * @param {string} id - Candidate UUID
   * @returns {Promise<object>}
   */
  getCandidateById: async (id) => {
    const response = await apiClient.get(`${API_ENDPOINTS.GET_ALL_CANDIDATES}/details/${id}`);
    return response.data;
  },

  /**
   * Create candidate with full details and position link
   * @param {object} candidateData - Candidate data including email, name, phone, resume, position, question set, etc.
   * @returns {Promise<{message: string, candidate: object, candidatePosition: object}>}
   */
  createCandidate: async (candidateData) => {
    const response = await apiClient.post(API_ENDPOINTS.CREATE_CANDIDATE, candidateData);
    return response.data;
  },

  /**
   * Add new candidate with all details (auto-generates password and sends email)
   * @param {object} candidateData - Candidate data including email, name, phone, college, degree, stream, resume
   * @returns {Promise<{message: string, candidate: object}>}
   */
  addCandidate: async (candidateData) => {
    const response = await apiClient.post(API_ENDPOINTS.ADD_CANDIDATE, candidateData);
    return response.data;
  },

  /**
   * Get resume extraction history for a candidate
   * @param {string} id - Candidate UUID
   * @returns {Promise<Array>}
   */
  getResumeHistory: async (id) => {
    const response = await apiClient.get(`${API_ENDPOINTS.GET_RESUME_HISTORY}/${id}/resume-data`);
    return response.data;
  },

  /**
   * Upload a new resume for a candidate
   * @param {string} id - Candidate UUID
   * @param {File} file - Resume file
   * @returns {Promise<object>}
   */
  uploadResume: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`${API_ENDPOINTS.UPLOAD_RESUME}/${id}/resumes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Save extracted resume data
   * @param {string} id - Candidate UUID
   * @param {object} resumeData - Extracted resume data
   * @returns {Promise<object>}
   */
  saveResumeData: async (id, resumeData) => {
    const response = await apiClient.put(`${API_ENDPOINTS.GET_RESUME_HISTORY}/${id}/resume-data`, resumeData);
    return response.data;
  },

  /**
   * Send invitation email to candidate (updates status to INVITED)
   * @param {string} candidateId - Candidate UUID
   * @param {string} positionId - Position ID
   * @returns {Promise<{message: string}>}
   */
  sendInvite: async (candidateId, positionId) => {
    const response = await apiClient.post(API_ENDPOINTS.SEND_INVITE, { candidateId, positionId });
    return response.data;
  },

  /**
   * Send welcome email to candidate (requires temp password returned from creation)
   * @param {string} candidateId - Candidate UUID
   * @param {string} password - Temporary password to send
   * @returns {Promise<{message: string}>}
   */
  sendWelcomeEmail: async (candidateId, password) => {
    const response = await apiClient.post(API_ENDPOINTS.SEND_WELCOME, { candidateId, password });
    return response.data;
  },

  resendInvite: async (candidateId, testAssignmentId = null) => {
    const payload = { candidateId };
    if (testAssignmentId) payload.testAssignmentId = testAssignmentId;
    const response = await apiClient.post(API_ENDPOINTS.RESEND_INVITE, payload);
    return response.data;
  },

  /**
   * Generate public registration link for a position
   * @param {object} linkData - {positionId, questionSetId, linkExpiresInDays}
   * @returns {Promise<{publicLink: string}>}
   */
  generatePublicLink: async (linkData) => {
    const response = await apiClient.post(API_ENDPOINTS.GENERATE_PUBLIC_LINK, linkData);
    return response.data;
  },

  /**
   * Get existing public registration link for a position
   * @param {object} linkData - {positionId, questionSetId, linkExpiresInDays}
   * @returns {Promise<{publicLink: string, exists: boolean}>}
   */
  getExistingPublicLink: async (linkData) => {
    const queryParams = new URLSearchParams({
      positionId: linkData.positionId,
      questionSetId: linkData.questionSetId,
      linkExpiresInDays: linkData.linkExpiresInDays.toString()
    });
    const response = await apiClient.get(`${API_ENDPOINTS.GET_EXISTING_PUBLIC_LINK}?${queryParams}`);
    return response.data;
  },
  /**
   * Get candidate's test activity history
   * @param {string} id - Candidate UUID
   * @returns {Promise<Array>}
   */
  getCandidateActivity: async (id) => {
    const response = await apiClient.get(`${API_ENDPOINTS.GET_ALL_CANDIDATES}/${id}/activity`);
    return response.data;
  },
};
