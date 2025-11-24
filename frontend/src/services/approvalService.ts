// frontend/src/services/approvalService.ts

import apiClient from './apiService';
import API_ENDPOINTS from '../constants/api';
import type {
  ApprovalFlowStep,
  ApprovalActionPayload,
  ApprovalActionResponse,
} from '../types/api';

/**
 * ดึงข้อมูล Flow การอนุมัติทั้งหมดสำหรับเอกสาร (Submission) ID ที่กำหนด
 */
export const getApprovalFlowBySubmissionId = async (
  submissionId: number
): Promise<ApprovalFlowStep[]> => {
  try {
    const response = await apiClient.get<ApprovalFlowStep[]>(
      `${API_ENDPOINTS.APPROVALS}/flow/${submissionId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching approval flow:", error);
    throw error;
  }
};

export const performApprovalAction = async (
  payload: ApprovalActionPayload
): Promise<ApprovalActionResponse> => {
  try {
    // ยิง API (POST /api/approvals/action) ที่เราเพิ่งสร้าง
    const response = await apiClient.post<ApprovalActionResponse>(
      `${API_ENDPOINTS.APPROVALS}/action`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error performing approval action:", error);
    throw error; // ส่ง Error ต่อให้ Component จัดการ
  }
};