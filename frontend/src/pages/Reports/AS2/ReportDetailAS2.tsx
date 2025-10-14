// frontend/src/pages/Reports/BZ/ReportDetailBZ.tsx

import React from 'react';
import AS2FormViewer from '../../../components/formGen/pages/GEN_A/AS2_Form/AS2FormViewer';

interface ReportDetailAS2Props {
  submission: any;
  blueprints: any;
}

const ReportDetailAS2: React.FC<ReportDetailAS2Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <AS2FormViewer 
      formData={submission.form_data_json}
      blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
      isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
    />
  );
};

export default ReportDetailAS2;