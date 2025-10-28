// lo
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


export const getAllSubmissions = async (category?: string) => { // 👈 รับคำสั่ง category ได้
  try {
    // --- 👇 สร้าง URL พร้อมคำสั่งพิเศษ (ถ้ามี) 👇 ---
    const url = category ? `/api/submissions?category=${category}` : '/api/submissions';

    console.log(`Fetching submissions from: ${url}`); // เพิ่ม log เพื่อให้เห็นว่าเรากำลังเรียก URL ไหน

    const response = await apiClient.get(url);
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



// ✨ เพิ่มฟังก์ชันนี้เข้าไปในไฟล์ ✨
/**
 * อัปเดตข้อมูล Submission ที่มีอยู่
 * @param id ID ของ submission ที่จะอัปเดต
 * @param data ข้อมูลที่ต้องการอัปเดต
 * @returns Promise<any>
 */
export const updateSubmission = async (id: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.put(`/api/submissions/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating submission with id ${id}:`, error);
    throw error;
  }
};


// --- 👇 เพิ่มฟังก์ชันนี้เข้าไป ---
export const generatePdfById = async (id: string): Promise<Blob> => {
  try {
    console.log(`[submissionService] Requesting PDF generation for ID: ${id}`);
    const response = await apiClient.get(`/api/submissions/print/${id}`, {
      responseType: 'blob', // 👈 สำคัญมาก: บอกให้ axios คาดหวังข้อมูลแบบไฟล์ (Blob)
    });
    console.log(`[submissionService] PDF Blob received for ID: ${id}`);
    return response.data; // คืนค่า Blob ที่ได้กลับไป
  } catch (error: any) {
    console.error(`[submissionService] Error generating PDF for ID ${id}:`, error.response?.data || error.message);
    // โยน error กลับไปให้ Component จัดการ (เช่น แสดง Toast)
    throw new Error(error.response?.data?.message || `Failed to generate PDF for submission ${id}`);
  }
};
// --- สิ้นสุดฟังก์ชันที่เพิ่ม ---