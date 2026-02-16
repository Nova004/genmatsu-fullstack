import apiService from './apiService';

const API_URL = '/logs';

export interface ActivityLog {
  log_id: number;
  user_id: string;
  action_type: string;
  target_module: string;
  target_id: string;
  details: string;
  timestamp: string;
}

export const getAllLogs = async (): Promise<ActivityLog[]> => {
  const response = await apiService.get<ActivityLog[]>(API_URL);
  return response.data;
};
