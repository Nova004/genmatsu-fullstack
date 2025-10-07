// frontend/src/pages/Reports/BZ/ReportDetailBZ.tsx

import React from 'react';
import BZFormViewer from '../../../components/formGen/pages/BZ3_Form/BZ3FormViewer';

interface ReportDetailBZProps {
  submission: any;
  blueprints: any;
}

const ReportDetailBZ3: React.FC<ReportDetailBZProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <BZFormViewer 
      formData={submission.form_data_json}
      blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
      isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
    />
  );
};

export default ReportDetailBZ3;