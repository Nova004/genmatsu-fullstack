// frontend/src/pages/Reports/BS3-C/ReportDetailBS3-C.tsx

import React from 'react';
import BS3_CFormViewer from '../../../components/formGen/pages/GEN_B/BS3-C_Form/BS3-CFormViewer';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailBS3_CProps {
  submission: any;
  blueprints: any;
}

const ReportDetailBS3_C: React.FC<ReportDetailBS3_CProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <BS3_CFormViewer
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

export default ReportDetailBS3_C;