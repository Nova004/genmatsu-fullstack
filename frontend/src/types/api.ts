/**
 * API Type Definitions
 * Centralized TypeScript types for all API requests and responses
 */

// ============================================
// Submission Types
// ============================================

export interface Submission {
  submission_id: number;
  form_type: string;
  lot_no: string;
  submitted_at: string;
  status: 'Drafted' | 'Pending' | 'Approved' | 'Rejected';
  submitted_by: string;
  category: 'GEN_A' | 'GEN_B';
  version_set_id: number;
  form_data_json: Record<string, any>; // Complex nested structure
}

export interface SubmissionWithDetails extends Submission {
  blueprints: Record<string, TemplateBlueprint>;
}

export interface TemplateBlueprint {
  template: Template;
  items: TemplateItem[];
}

export interface Template {
  template_id: number;
  template_name: string;
  template_category: string;
  version: number;
}

export interface TemplateItem {
  item_id: number;
  display_order: number;
  config_json: Record<string, any>;
}

export interface CreateSubmissionPayload {
  formType: string;
  lotNo: string;
  templateIds: number[];
  formData: Record<string, any>;
  submittedBy: string;
}

export interface CreateSubmissionResponse {
  message: string;
  submissionId: number;
}

export interface UpdateSubmissionPayload {
  lot_no: string;
  form_data: Record<string, any>;
}

export interface UpdateSubmissionResponse {
  message: string;
}

export interface DeleteSubmissionResponse {
  message: string;
}

// ============================================
// Approval Types
// ============================================

export interface ApprovalFlowStep {
  flow_id: number;
  submission_id: number;
  sequence: number;
  required_level: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by: string | null;
  approved_at: string | null;
  comment: string | null;
}

export interface ApprovalActionPayload {
  submissionId: number;
  action: 'Approved' | 'Rejected';
  comment: string;
  approverUserId: string;
}

export interface ApprovalActionResponse {
  message: string;
}

// ============================================
// Form/Template Types
// ============================================

export interface LatestTemplateResponse {
  template_id: number;
  template_name: string;
  template_category: string;
  version: number;
  items: TemplateItem[];
}

// ============================================
// User Types
// ============================================

export interface User {
  username: string;
  nameEN: string;
  id: string;
  LV_Approvals: number;
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  message: string;
  error?: string;
}

// ============================================
// Common Response Types
// ============================================

export interface MessageResponse {
  message: string;
}
