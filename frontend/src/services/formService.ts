import apiClient from './apiService';

/**
 * ฟังก์ชันสำหรับดึงข้อมูลพิมพ์เขียว (Template) เวอร์ชันล่าสุดตามชื่อ
 * @param templateName - ชื่อของ Template (เช่น 'BZ_Step2_RawMaterials')
 */
export const getLatestTemplateByName = async (templateName: string) => {
  try {
    const response = await apiClient.get(`/api/master/template/${templateName}/latest`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch template ${templateName}`, error);
    throw error;
  }
};