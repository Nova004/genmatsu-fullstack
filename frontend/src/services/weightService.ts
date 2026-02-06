import apiClient from './apiService';

export interface RawMaterialWeightData {
  Material_Weight_Detail_Id: number;
  Order_No: string;
  Invoice_No: string;
  Material_Lot: string;
  Weight: number;
  Updated_Date: string;
  Updated_Time: string;
  Staff_Name: string;
  Lot: string;
  Batch: string;
  Job_Status_Id: number;
  Line_Name: string;
  Gen_Name: string;
  Material_Id: string;
  Material_Name: string;
}

export const getRawMaterialWeights = async (
  lot: string,
  line: string,
  batch: string,
): Promise<RawMaterialWeightData[]> => {
  try {
    const response = await apiClient.get<RawMaterialWeightData[]>(
      '/weights/raw-material',
      {
        params: { lot, line, batch },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching raw material weights:', error);
    throw error;
  }
};
