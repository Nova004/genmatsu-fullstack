// frontend/src/pages/Reports/AS/PrintableReportAS2.tsx

import React from 'react';
import AS2FormPrint from '../../../components/formGen/pages/GEN_A/AS2_Form/AS2FormPrint';

interface ReportDetailAS2Props {
  submission: any;
  blueprints: any;
}

const ReportDetailAS2: React.FC<ReportDetailAS2Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <div style={{ zoom: 1.7 }} className="print-compact">
      <AS2FormPrint
        formData={submission.form_data_json}
        blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
        isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
      />
    </div>
  );
};

export default ReportDetailAS2;