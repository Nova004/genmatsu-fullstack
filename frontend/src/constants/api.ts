/**
 * API Endpoint Constants
 * Centralized location for all API endpoints
 */

const API_BASE = '/api';

export const API_ENDPOINTS = {
  // Submissions
  SUBMISSIONS: `${API_BASE}/submissions`,
  SUBMISSION_BY_ID: (id: string | number) => `${API_BASE}/submissions/${id}`,
  SUBMISSION_PRINT: (id: string | number) => `${API_BASE}/submissions/print/${id}`,
  SUBMISSION_RESUBMIT: (id: string | number) => `${API_BASE}/submissions/resubmit/${id}`,
  
  // Approvals
  APPROVALS: `${API_BASE}/approvals`,
  APPROVAL_BY_ID: (id: string | number) => `${API_BASE}/approvals/${id}`,
  APPROVAL_APPROVE: (id: string | number) => `${API_BASE}/approvals/${id}/approve`,
  APPROVAL_REJECT: (id: string | number) => `${API_BASE}/approvals/${id}/reject`,
  
  // Forms
  FORMS: `${API_BASE}/forms`,
  FORM_TEMPLATES: `${API_BASE}/forms/templates`,
  
  // Auth
  AUTH_LOGIN: `${API_BASE}/auth/login`,
  AUTH_LOGOUT: `${API_BASE}/auth/logout`,
  
  // Users
  USERS: `${API_BASE}/users`,
  USER_BY_ID: (id: string | number) => `${API_BASE}/users/${id}`,
  
  // NaCl
  NACL: `${API_BASE}/nacl`,
  NACL_BY_ID: (id: string | number) => `${API_BASE}/nacl/${id}`,
  
  // Master
  MASTER: `${API_BASE}/master`,
} as const;

export default API_ENDPOINTS;
