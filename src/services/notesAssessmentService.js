import apiClient from "./apiService";

export const notesAssessmentService = {
    addAssessment: async (assessmentData) => {
        const formData = new FormData();
        // Removed candidateEmails as per simple class-notes implementation
        formData.append("content", assessmentData.content || "");
        formData.append("degree", assessmentData.degree || "");
        formData.append("stream", assessmentData.stream || "");
        formData.append("semester", assessmentData.semester || "");
        formData.append("subject", assessmentData.subject || "");
        formData.append("topic", assessmentData.topic || "");
        if (assessmentData.file) {
            formData.append("file", assessmentData.file);
        }

        const response = await apiClient.post(`/api/assessments`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
        return response.data;
    },

    getAssessments: async (page = 0, size = 10) => {
        const response = await apiClient.get(`/api/assessments`, {
            params: { page, size }
        });
        return response.data;
    }
};
