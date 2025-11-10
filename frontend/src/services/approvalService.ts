// frontend/src/services/approvalService.ts

import apiClient from './apiService';
import { IApprovalFlowStep } from "../components/formGen/pages/types"; // (เราจะสร้าง Type นี้ในขั้นตอนถัดไป)

/**
 * ดึงข้อมูล Flow การอนุมัติทั้งหมดสำหรับเอกสาร (Submission) ID ที่กำหนด
 */
export const getApprovalFlowBySubmissionId = async (
  submissionId: number
): Promise<IApprovalFlowStep[]> => {
  try {
    const response = await apiClient.get(`/api/approvals/flow/${submissionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching approval flow:", error);
    throw error;
  }
};

interface ApprovalActionPayload {
  submissionId: number;
  action: 'Approved' | 'Rejected';
  comment: string;
  approverUserId: string; // 👈 [ใหม่] เราต้องส่ง ID ของผู้กดไปด้วย
}

export const performApprovalAction = async (payload: ApprovalActionPayload) => {
  try {
    // ยิง API (POST /api/approvals/action) ที่เราเพิ่งสร้าง
    const response = await apiClient.post("/api/approvals/action", payload);
    return response.data;
  } catch (error) {
    console.error("Error performing approval action:", error);
    throw error; // ส่ง Error ต่อให้ Component จัดการ
  }
};