// frontend/src/pages/Reports/AS/PrintableReportBS3-B1.tsx

import React from 'react';
import BS3_B1FormPrint from '../../../components/formGen/pages/GEN_B/BS3-B1_Form/BS3-B1FormPrint';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailBS3_B1Props {
  submission: any;
  blueprints: any;
}

const ReportDetailBS3_B1: React.FC<ReportDetailBS3_B1Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <div style={{ zoom: 1.55 }} className="print-compact">
      <BS3_B1FormPrint
        formData={submission.form_data_json}
        blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
        isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว

        approvalFlowComponent={
          submission.submission_id ? (
            <ApprovalFlowDisplay
              submissionId={submission.submission_id}
              submissionData={submission} // ‼️ คุณลืมเพิ่มบรรทัดนี้หรือเปล่าครับ? ‼️
            />
          ) : null
        }
      />
    </div>
  );
};

export default ReportDetailBS3_B1;