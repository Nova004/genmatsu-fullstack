// frontend/src/pages/Reports/AS/PrintableReportAX9-B.tsx

import React from 'react';
import AX9_BFormPrint from '../../../components/formGen/pages/GEN_A/AX9-B_Form/AX9-BFormPrint';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailAX9_BProps {
  submission: any;
  blueprints: any;
}

const ReportDetailAX9_B: React.FC<ReportDetailAX9_BProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <div style={{ zoom: 1.7 }} className="print-compact">
      <AX9_BFormPrint
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

export default ReportDetailAX9_B;