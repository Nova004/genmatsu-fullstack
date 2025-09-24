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