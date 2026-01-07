// frontend/src/pages/Reports/BZ/ReportDetailBZ.tsx

import React from 'react';
import AS2_DFormViewer from '../../../components/formGen/pages/GEN_A/AS2-D_Form/AS2-DFormViewer';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailAS2_DProps {
  submission: any;
  blueprints: any;
}

const ReportDetailAS2_D: React.FC<ReportDetailAS2_DProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <AS2_DFormViewer
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

export default ReportDetailAS2_D;