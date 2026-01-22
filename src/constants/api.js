// All URLs must be set in .env file
if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set in .env file");
}
if (!import.meta.env.VITE_AI_BACKEND_URL) {
  throw new Error("VITE_AI_BACKEND_URL is not set in .env file");
}
if (!import.meta.env.VITE_AI_BACKEND_WS_URL) {
  throw new Error("VITE_AI_BACKEND_WS_URL is not set in .env file");
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL;
export const AI_BACKEND_WS_URL = import.meta.env.VITE_AI_BACKEND_WS_URL;

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REFRESH_TOKEN: "/auth/refresh-token",
  GET_CURRENT_ADMIN: "/auth/me",

  // Admin endpoints
  GET_ALL_ADMINS: "/api/admins",
  CREATE_ADMIN: "/api/admins",
  UPDATE_ADMIN: "/api/admins",
  DELETE_ADMIN: "/api/admins",

  // Candidate endpoints
  GET_ALL_CANDIDATES: "/api/candidates",
  GET_CANDIDATES_WITH_TEST_ASSIGNMENTS: "/api/candidates/test-assignments",
  CREATE_CANDIDATE_INVITATION: "/api/candidates/invite",
  CREATE_CANDIDATE: "/api/candidates/create",
  ADD_CANDIDATE: "/api/candidates/add",
  SEARCH_CANDIDATE_BY_EMAIL: "/api/candidates/search",
  GET_CANDIDATE_BY_EMAIL: "/api/candidates",
  SEND_INVITE: "/api/candidates/send-invite",
  SEND_WELCOME: "/api/candidates/send-welcome",
  RESEND_INVITE: "/api/candidates/resend-invite",
  GENERATE_PUBLIC_LINK: "/api/candidates/generate-public-link",
  GET_EXISTING_PUBLIC_LINK: "/api/candidates/get-public-link",

  // Role endpoints
  GET_ALL_ROLES: "/api/roles",
  CREATE_ROLE: "/api/roles",
  UPDATE_ROLE: "/api/roles",
  GET_ROLE_BY_ID: "/api/roles",
  GET_ROLES_BY_ORGANIZATION: "/api/roles/organization",

  // Organization-specific endpoints
  GET_USERS_BY_ORGANIZATION: "/api/admins/organization",
  GET_RESUME_HISTORY: "/api/candidates", // Base path, will append /{id}/resume-data
  UPLOAD_RESUME: "/api/candidates",    // Base path, will append /{id}/resumes
};

