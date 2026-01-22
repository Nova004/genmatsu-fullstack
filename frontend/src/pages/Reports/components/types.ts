export interface SubmissionData {
  submission_id: number;
  lot_no: string;
  submitted_at: string;
  status: string;
  form_type: string;
  pending_level?: number;
  submitted_by_name: string;
  category: string;
  production_date?: string; // Optional because logic checks for it
}
