import apiClient from "./apiService";
import { fileService } from "./fileService";

/**
 * Ticket service - handles support ticket operations
 */
export const ticketService = {
  /**
   * Submit a new support ticket
   * @param {Object} ticketData - Ticket data
   * @param {string} ticketData.subject - Ticket subject
   * @param {string} ticketData.type - Ticket type (feedback, doubt, issue, other)
   * @param {string} ticketData.message - Ticket message
   * @param {File} ticketData.file - Optional file attachment
   * @param {string} ticketData.userType - User type (ADMIN, CANDIDATE, VISITOR)
   * @param {string} ticketData.name - User name
   * @param {string} ticketData.email - User email
   * @returns {Promise<Object>} Created ticket
   */
  submitTicket: async (ticketData) => {
    let filePath = null;
    let fileName = null;

    // Upload file if provided
    if (ticketData.file) {
      try {
        const uploadResult = await fileService.uploadFile(ticketData.file, "tickets");
        filePath = uploadResult.path || uploadResult.filePath;
        fileName = uploadResult.fileName || ticketData.file.name;
      } catch (error) {
        console.error("Error uploading file:", error);
        // Continue without file if upload fails
      }
    }

    // Map frontend type to backend type
    const typeMapping = {
      feedback: "FEEDBACK",
      doubt: "DOUBT",
      issue: "ISSUE",
      other: "OTHER"
    };

    const payload = {
      userType: ticketData.userType || "ADMIN",
      name: ticketData.name || "",
      email: ticketData.email,
      subject: ticketData.subject,
      message: ticketData.message,
      type: typeMapping[ticketData.type] || "OTHER",
      ...(filePath && { filePath, fileName })
    };

    const response = await apiClient.post("/api/support/tickets", payload);
    return response.data;
  },

  /**
   * Get all tickets
   * @returns {Promise<Array>} List of tickets
   */
  getAllTickets: async () => {
    const response = await apiClient.get("/api/support/tickets");
    return response.data;
  },

  /**
   * Reply to a ticket
   * @param {string} ticketId - Ticket ID
   * @param {string} replyMessage - Reply message
   * @returns {Promise<Object>} Updated ticket
   */
  replyToTicket: async (ticketId, replyMessage) => {
    const response = await apiClient.post(`/api/support/tickets/${ticketId}/reply`, {
      reply: replyMessage
    });
    return response.data;
  }
};
