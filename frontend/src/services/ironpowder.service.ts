import apiClient from "./apiService";
import api from '../constants/api';

interface IronpowderSubmissionData {
  lotNo: string;
  formData: any;
  submittedBy: number | string;
}

export const ironpowderService = {
  /**
   * Create a new Ironpowder submission
   * @param {Object} data - Form data containing lotNo, formData, submittedBy
   * @returns {Promise} Response with submissionId and approval flow info
   */
  createIronpowder: async (data: IronpowderSubmissionData) => {
    try {
      const response = await apiClient.post("/ironpowder", data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  

  /**
   * Get all Ironpowder submissions (paginated)
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   * @returns {Promise} List of submissions
   */
  getAllIronpowder: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await apiClient.get("/ironpowder", {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get a single Ironpowder submission by ID
   * @param {number} id - Ironpowder submission ID
   * @returns {Promise} Submission details with parsed form data
   */
  getIronpowderById: async (id: number | string) => {
    try {
      const response = await apiClient.get(`/ironpowder/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update an Ironpowder submission
   * @param {number} id - Ironpowder submission ID
   * @param {Object} data - Updated form data
   * @returns {Promise} Updated submission
   */
  updateIronpowder: async (id: number | string, data: any) => {
    try {
      const response = await apiClient.put(`/ironpowder/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete an Ironpowder submission
   * @param {number} id - Ironpowder submission ID
   * @returns {Promise} Success message
   */
  deleteIronpowder: async (id: number | string) => {
    try {
      const response = await apiClient.delete(`/ironpowder/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Resubmit an Ironpowder submission after rejection
   * @param {number} id - Ironpowder submission ID
   * @param {Object} data - Updated form data
   * @returns {Promise} Resubmitted data with new approval flow
   */
  resubmitIronpowder: async (id: number | string, data: any) => {
    try {
      const response = await apiClient.put(`/ironpowder/${id}/resubmit`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};
