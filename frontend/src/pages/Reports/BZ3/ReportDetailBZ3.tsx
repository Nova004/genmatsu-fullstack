// frontend/src/pages/Reports/BZ3/ReportDetailBZ3.tsx

import React from 'react';
import BZ3FormViewer from '../../../components/formGen/pages/GEN_B/BZ3_Form/BZ3FormViewer';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailBZ3Props {
  submission: any;
  blueprints: any;
}

const ReportDetailBZ3: React.FC<ReportDetailBZ3Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <BZ3FormViewer
        formData={submission.form_data_json}
        blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
        isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
      />

      <ApprovalFlowDisplay
        submissionId={submission.submission_id}
        submissionData={submission} // ‼️ คุณลืมเพิ่มบรรทัดนี้หรือเปล่าครับ? ‼️
      />
      
    </>
  );
};

export default ReportDetailBZ3;