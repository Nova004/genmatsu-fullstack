// frontend/src/pages/Reports/BZ/ReportDetailBZ.tsx

import React from 'react';
import AS4FormViewer from '../../../components/formGen/pages/GEN_A/AS4_Form/AS4FormViewer';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailAS4Props {
  submission: any;
  blueprints: any;
}

const ReportDetailAS4: React.FC<ReportDetailAS4Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <AS4FormViewer
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

export default ReportDetailAS4;