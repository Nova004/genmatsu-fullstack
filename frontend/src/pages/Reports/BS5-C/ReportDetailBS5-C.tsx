// frontend/src/pages/Reports/BS5-C/ReportDetailBS5_C.tsx

import React from 'react';
import BS5_CFormViewer from '../../../components/formGen/pages/GEN_B/BS5-C_Form/BS5-CFormViewer';

interface ReportDetailBS5_CProps {
  submission: any;
  blueprints: any;
}

const ReportDetailBS5_C: React.FC<ReportDetailBS5_CProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <BS5_CFormViewer 
      formData={submission.form_data_json}
      blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
      isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
    />
  );
};

export default ReportDetailBS5_C;