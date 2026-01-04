import apiClient from "./apiService";

/**
 * Dashboard service - handles dashboard statistics API calls
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  getDashboardStats: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/stats`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Get candidate trends
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  getCandidateTrends: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/candidates/trend`);
    return response.data;
  },

  /**
   * Get candidate distribution
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  getCandidateDistribution: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/candidates/distribution`);
    return response.data;
  },

  /**
   * Get position statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  getPositionStats: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/positions/stats`);
    return response.data;
  },

  /**
   * Get user activity
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  getUserActivity: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/users/activity`);
    return response.data;
  },

  /**
   * Get recent activities
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  getRecentActivities: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/recent-activities`);
    return response.data;
  },

  /**
   * Get all dashboard data in a single call
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Contains stats, candidateTrends, candidateDistribution, positionStats, userActivity, recentActivities
   */
  getAllDashboardData: async (organizationId) => {
    const response = await apiClient.get(`/api/dashboard/organization/${organizationId}/all`);
    return response.data;
  },

  // --- Methods from Reference Dashboard ---

  getCredits: async () => {
    console.log('Dashboard API: Fetching credits information by organization ID');
    try {
      const organizationId = localStorage.getItem('organizationId');
      if (!organizationId) {
        throw new Error('Organization ID not found to fetch credits.');
      }
      const response = await apiClient.get(`/api/credits/organizations/${organizationId}`);
      if (response.data && (response.data.success || response.data.status === 'success') && response.data.data !== undefined) {
        return response.data.data;
      } else {
        throw new Error('Unexpected API response structure for credits');
      }
    } catch (error) {
      console.error('Dashboard API: Error fetching credits information', error);
      throw error;
    }
  },

  getJobRoles: async (organizationId = null) => {
    console.log('Dashboard API: Fetching job roles from /api/positions/dropdown');
    try {
      const url = organizationId
        ? `/api/positions/dropdown?organizationId=${encodeURIComponent(organizationId)}`
        : '/api/positions/dropdown';
      const response = await apiClient.get(url);
      if (response.data) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Dashboard API: Error fetching job roles', error);
      throw error;
    }
  },


  getCompanyById: async () => {
    console.log('Profile API: Fetching company by ID');
    try {
      const organizationId = localStorage.getItem('organizationId');
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }
      const response = await apiClient.get(`/auth/companies/by-org/${organizationId}`);

      // Store companyName in localStorage after successful API call
      if (response.data && response.data.success && response.data.data && response.data.data.companyName) {
        localStorage.setItem('companyName', response.data.data.companyName);
      }

      return response.data;
    } catch (error) {
      console.error('Profile API: Error fetching company', error);
      throw error;
    }
  },

  getSubscription: async () => {
    console.log('Dashboard API: Fetching active subscription');
    try {
      const organizationId = localStorage.getItem('organizationId');
      if (!organizationId) throw new Error('Organization ID not found');
      const response = await apiClient.get(`/api/subscriptions/organization/${organizationId}/active`);
      if (response.data && response.data.success) {
        return response.data.subscription;
      }
      return null;
    } catch (error) {
      console.error('Dashboard API: Error fetching subscription', error);
      return null;
    }
  }
};

