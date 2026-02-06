import apiClient from './apiService';
import API_ENDPOINTS from '../constants/api';
import type { LatestTemplateResponse } from '../types/api';

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพิมพ์เขียว (Template) เวอร์ชันล่าสุดตามชื่อ
 * @param templateName - ชื่อของ Template (เช่น 'BZ_Step2_RawMaterials')
 */

export const getLatestTemplateByName = async (
  templateName: string,
): Promise<LatestTemplateResponse> => {
  try {
    const response = await apiClient.get<LatestTemplateResponse>(
      `${API_ENDPOINTS.MASTER}/template/${templateName}/latest`,
      { params: { active: true } }, // 🚀 Request active version
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch template ${templateName}`, error);
    throw error;
  }
};
