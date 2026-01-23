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
  submissionData: CreateSubmissionPayload,
): Promise<CreateSubmissionResponse> => {
  try {
    const response = await apiClient.post<CreateSubmissionResponse>(
      API_ENDPOINTS.SUBMISSIONS,
      submissionData,
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const getAllSubmissions = async (
  category: string = 'GEN-A',
  params: {
    page: number;
    pageSize: number;
    search?: string;
    startDate?: string | null;
    endDate?: string | null;
    status?: string;
    formType?: string;
    user?: string; // ✅ Add User
  },
): Promise<PaginatedResponse<any>> => {
  try {
    const queryParams = new URLSearchParams({
      category,
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
    });

    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    if (params.formType) queryParams.append('formType', params.formType);
    if (params.user) queryParams.append('user', params.user); // ✅ Append User param

    const response = await apiClient.get<PaginatedResponse<any>>(
      `${API_ENDPOINTS.SUBMISSIONS}?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
};

export const getSubmissionById = async (
  id: string,
): Promise<SubmissionWithDetails> => {
  try {
    const response = await apiClient.get<SubmissionWithDetails>(
      API_ENDPOINTS.SUBMISSION_BY_ID(id),
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching submission with id ${id}:`, error);
    throw error;
  }
};

export const deleteSubmission = async (
  id: number,
): Promise<DeleteSubmissionResponse> => {
  try {
    const response = await apiClient.delete<DeleteSubmissionResponse>(
      API_ENDPOINTS.SUBMISSION_BY_ID(id),
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting submission with id ${id}:`, error);
    throw error;
  }
};

export const getMyPendingTasks = async (
  userLevel: number,
  userId?: string, // ✅ เพิ่ม optional param userId
): Promise<any[]> => {
  try {
    // ใช้ API_ENDPOINTS.SUBMISSIONS (base url) แล้วต่อด้วย path /pending-tasks
    let url = `${API_ENDPOINTS.SUBMISSIONS}/pending-tasks?level=${userLevel}`;

    // ✅ ถ้ามี userId ส่งมา ให้แนบไปกับ Query String
    if (userId) {
      url += `&userId=${userId}`;
    }

    const response = await apiClient.get<any[]>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
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
  data: UpdateSubmissionPayload,
): Promise<UpdateSubmissionResponse> => {
  try {
    const response = await apiClient.put<UpdateSubmissionResponse>(
      API_ENDPOINTS.SUBMISSION_BY_ID(id),
      data,
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
    console.error(
      `Error generating PDF for ID ${id}:`,
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message ||
        `Failed to generate PDF for submission ${id}`,
    );
  }
};

export const resubmitSubmission = async (
  id: number,
  formDataJson: Record<string, any>,
): Promise<UpdateSubmissionResponse> => {
  try {
    const response = await apiClient.put<UpdateSubmissionResponse>(
      API_ENDPOINTS.SUBMISSION_RESUBMIT(id),
      { formDataJson },
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
      `${API_ENDPOINTS.SUBMISSIONS}/my-messages?userId=${userId}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

/**
 * ดึงข้อมูลสรุปรายวัน (Daily Summary) รวมถึง Ironpowder Summary
 * @param date วันที่ที่ต้องการดูข้อมูล (YYYY-MM-DD)
 */
export const getDailyReportSummary = async (date: string) => {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.SUBMISSIONS}/reports/summary`, // Update endpoint path if needed
      { params: { date } },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    throw error;
  }
};

/**
 * บันทึกข้อมูลสรุปรายวัน (Daily Summary Remarks)
 * @param date วันที่ (YYYY-MM-DD)
 * @param summaryData ข้อมูลที่จะบันทึก (remarks)
 */
export const saveDailyReportSummary = async (
  date: string,
  summaryData: any,
) => {
  try {
    const response = await apiClient.post(
      `${API_ENDPOINTS.SUBMISSIONS}/reports/summary`,
      { date, summaryData },
    );
    return response.data;
  } catch (error) {
    console.error('Error saving daily summary:', error);
    throw error;
  }
};
