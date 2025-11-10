// frontend/src/pages/Reports/BZ5_C/ReportDetailBZ5_C.tsx

import React from 'react';
import BZ5_CFormViewer from '../../../components/formGen/pages/GEN_B/BZ5-C_Form/BZ5-CFormViewer';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailBZ5_CProps {
  submission: any;
  blueprints: any;
}

const ReportDetailBZ5_C: React.FC<ReportDetailBZ5_CProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <BZ5_CFormViewer
        formData={submission.form_data_json}
        blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
        isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
      />
      <ApprovalFlowDisplay submissionId={submission.submission_id} />
    </>
  );
};

export default ReportDetailBZ5_C;