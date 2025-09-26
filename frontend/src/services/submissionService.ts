import apiClient from './apiService';

/**
 * ฟังก์ชันสำหรับส่งข้อมูลฟอร์มไปยัง Backend API
 * @param submissionData - ข้อมูลทั้งหมดที่จะบันทึก
 */
export const submitProductionForm = async (submissionData: any) => {
  try {
    // เราเรียกใช้แค่ /api/submissions เพราะ Proxy จะเติม http://localhost:4000 ให้เอง
    const response = await apiClient.post('/api/submissions', submissionData);
    return response.data;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
  }
};


export const getAllSubmissions = async () => {
  try {
    const response = await apiClient.get('/api/submissions');
    return response.data;
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    throw error;
  }
};


export const getSubmissionById = async (id: string) => {
  try {
    const response = await apiClient.get(`/api/submissions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching submission with id ${id}:`, error);
    throw error;
  }
};


// ฟังก์ชันสำหรับลบ Submission ด้วย ID
export const deleteSubmission = async (id: number): Promise<{ message: string }> => {
  try {
    // เรียกใช้ apiClient.delete ไปยัง Endpoint ที่ถูกต้อง
    const response = await apiClient.delete<{ message: string }>(`/api/submissions/${id}`);
    // ส่งข้อมูลที่ได้กลับไป
    return response.data;
  } catch (error) {
    // หากเกิด Error, โยน Error ออกไปเพื่อให้ Component ที่เรียกใช้จัดการต่อ
    console.error(`Error deleting submission with id ${id}:`, error);
    throw error;
  }
};