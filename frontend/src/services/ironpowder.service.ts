import apiClient from './apiService';

interface IronpowderSubmissionData {
  lotNo: string;
  formData: any;
  submittedBy: number | string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const ironpowderService = {
  /**
   * Create a new Ironpowder submission
   * @param {Object} data - Form data containing lotNo, formData, submittedBy
   * @returns {Promise} Response with submissionId and approval flow info
   */
  createIronpowder: async (data: IronpowderSubmissionData) => {
    try {
      const response = await apiClient.post('/ironpowder', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all Ironpowder submissions (paginated)
   * @param {Object} params - Pagination and filter params
   * @returns {Promise} List of submissions
   */
  getAllIronpowder: async (params: {
    page: number;
    limit: number;
    search?: string;
    startDate?: string | null;
    endDate?: string | null;
    status?: string;
    category?: string;
  }) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.limit.toString(), // Controller expects pageSize
      });

      if (params.search) queryParams.append('search', params.search);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);

      const response = await apiClient.get<PaginatedResponse<any>>(
        `/ironpowder?${queryParams.toString()}`,
      );
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
