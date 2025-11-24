import apiClient from './apiService';
import API_ENDPOINTS from '../constants/api';

/**
 * ฟังก์ชันสำหรับส่งข้อมูลฟอร์มไปยัง Backend API
 * @param submissionData - ข้อมูลทั้งหมดที่จะบันทึก
 */
export const submitProductionForm = async (submissionData: any) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.SUBMISSIONS, submissionData);
    return response.data;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
  }
};


export const getAllSubmissions = async (category?: string) => {
  try {
    const url = category ? `${API_ENDPOINTS.SUBMISSIONS}?category=${category}` : API_ENDPOINTS.SUBMISSIONS;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    throw error;
  }
};


export const getSubmissionById = async (id: string) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SUBMISSION_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching submission with id ${id}:`, error);
    throw error;
  }
};


// ฟังก์ชันสำหรับลบ Submission ด้วย ID
export const deleteSubmission = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(API_ENDPOINTS.SUBMISSION_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting submission with id ${id}:`, error);
    throw error;
  }
};



/**
 * อัปเดตข้อมูล Submission ที่มีอยู่
 * @param id ID ของ submission ที่จะอัปเดต
 * @param data ข้อมูลที่ต้องการอัปเดต
 * @returns Promise<any>
 */
export const updateSubmission = async (id: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.SUBMISSION_BY_ID(id), data);
    return response.data;
  } catch (error) {
    console.error(`Error updating submission with id ${id}:`, error);
    throw error;
  }
};


export const generatePdfById = async (id: string): Promise<Blob> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SUBMISSION_PRINT(id), {
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error generating PDF for ID ${id}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || `Failed to generate PDF for submission ${id}`);
  }
};

export const resubmitSubmission = async (id: number, formDataJson: any) => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.SUBMISSION_RESUBMIT(id), { 
      formDataJson
    });
    return response.data;
  } catch (error) {
    console.error(`Error resubmitting submission ${id}:`, error);
    throw error;
  }
};
