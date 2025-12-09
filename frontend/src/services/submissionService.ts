import apiClient from './apiService';
import API_ENDPOINTS from '../constants/api';
import type {
  Submission,
  SubmissionWithDetails,
  CreateSubmissionPayload,
  CreateSubmissionResponse,
  UpdateSubmissionPayload,
  UpdateSubmissionResponse,
  DeleteSubmissionResponse,
} from '../types/api';

/**
 * ฟังก์ชันสำหรับส่งข้อมูลฟอร์มไปยัง Backend API
 * @param submissionData - ข้อมูลทั้งหมดที่จะบันทึก
 */
export const submitProductionForm = async (
  submissionData: CreateSubmissionPayload
): Promise<CreateSubmissionResponse> => {
  try {
    const response = await apiClient.post<CreateSubmissionResponse>(
      API_ENDPOINTS.SUBMISSIONS,
      submissionData
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
  }
};


export const getAllSubmissions = async (category?: string): Promise<Submission[]> => {
  try {
    const url = category ? `${API_ENDPOINTS.SUBMISSIONS}?category=${category}` : API_ENDPOINTS.SUBMISSIONS;
    const response = await apiClient.get<Submission[]>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    throw error;
  }
};


export const getSubmissionById = async (id: string): Promise<SubmissionWithDetails> => {
  try {
    const response = await apiClient.get<SubmissionWithDetails>(API_ENDPOINTS.SUBMISSION_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching submission with id ${id}:`, error);
    throw error;
  }
};


export const deleteSubmission = async (id: number): Promise<DeleteSubmissionResponse> => {
  try {
    const response = await apiClient.delete<DeleteSubmissionResponse>(
      API_ENDPOINTS.SUBMISSION_BY_ID(id)
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting submission with id ${id}:`, error);
    throw error;
  }
};

export const getMyPendingTasks = async (userLevel: number): Promise<any[]> => {
  try {
    // ใช้ API_ENDPOINTS.SUBMISSIONS (base url) แล้วต่อด้วย path /pending-tasks
    const response = await apiClient.get<any[]>(
      `${API_ENDPOINTS.SUBMISSIONS}/pending-tasks?level=${userLevel}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    // ส่งค่าว่างกลับไปเพื่อป้องกัน Frontend พัง
    return [];
  }
};

/**
 * อัปเดตข้อมูล Submission ที่มีอยู่
 * @param id ID ของ submission ที่จะอัปเดต
 * @param data ข้อมูลที่ต้องการอัปเดต
 */
export const updateSubmission = async (
  id: string,
  data: UpdateSubmissionPayload
): Promise<UpdateSubmissionResponse> => {
  try {
    const response = await apiClient.put<UpdateSubmissionResponse>(
      API_ENDPOINTS.SUBMISSION_BY_ID(id),
      data
    );
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


export const resubmitSubmission = async (
  id: number,
  formDataJson: Record<string, any>
): Promise<UpdateSubmissionResponse> => {
  try {
    const response = await apiClient.put<UpdateSubmissionResponse>(
      API_ENDPOINTS.SUBMISSION_RESUBMIT(id),
      { formDataJson }
    );
    return response.data;
  } catch (error) {
    console.error(`Error resubmitting submission ${id}:`, error);
    throw error;
  }
};

export const getMyMessages = async (userId: string) => {
  try {
    const response = await apiClient.get<any[]>(
      `${API_ENDPOINTS.SUBMISSIONS}/my-messages?userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};
