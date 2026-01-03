import apiClient from "./apiService";
import { API_BASE_URL } from "../constants/api";

/**
 * File service - handles file upload and download operations
 */
export const fileService = {
  /**
   * Upload JD Document
   * @param {File} file - File to upload
   * @returns {Promise<{filePath: string, fileName: string, originalFileName: string}>}
   */
  uploadJdDocument: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/api/files/upload/jd-document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Upload file (generic)
   * @param {File} file - File to upload
   * @param {string} subfolder - Subfolder (e.g., "resumes")
   * @returns {Promise<{path: string, fileName: string}>}
   */
  uploadFile: async (file, subfolder = "resumes") => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(`/api/files/upload/${subfolder}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Download file
   * @param {string} subfolder - Subfolder (e.g., "jd-documents")
   * @param {string} filename - Filename
   * @returns {Promise<Blob>}
   */
  downloadFile: async (subfolder, filename) => {
    const response = await apiClient.get(`/api/files/download/${subfolder}/${filename}`, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Delete file
   * @param {string} subfolder - Subfolder (e.g., "jd-documents")
   * @param {string} filename - Filename
   * @returns {Promise<void>}
   */
  deleteFile: async (subfolder, filename) => {
    await apiClient.delete(`/api/files/delete/${subfolder}/${filename}`);
  },

  /**
   * Get file download URL
   * @param {string} subfolder - Subfolder (e.g., "jd-documents")
   * @param {string} filename - Filename
   * @returns {string} Download URL
   */
  getFileDownloadUrl: (subfolder, filename) => {
    return `${API_BASE_URL}/api/files/download/${subfolder}/${filename}`;
  },
};

