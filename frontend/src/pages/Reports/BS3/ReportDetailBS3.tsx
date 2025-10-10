// frontend/src/pages/Reports/BS3/ReportDetailBS3.tsx

import React from 'react';
import BS3FormViewer from '../../../components/formGen/pages/GEN_B/BS3_Form/BS3FormViewer';

interface ReportDetailBS3Props {
  submission: any;
  blueprints: any;
}

const ReportDetailBS3: React.FC<ReportDetailBS3Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <BS3FormViewer 
      formData={submission.form_data_json}
      blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
      isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
    />
  );
};

export default ReportDetailBS3;