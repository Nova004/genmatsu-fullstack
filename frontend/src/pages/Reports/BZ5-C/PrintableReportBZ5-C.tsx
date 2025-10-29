// frontend/src/pages/Reports/AS/PrintableReportBZ5-C.tsx

import React from 'react';
import BZ5_CFormPrint from '../../../components/formGen/pages/GEN_B/BZ5-C_Form/BZ5-CFormPrint';

interface ReportDetailBZ5_CProps {
  submission: any;
  blueprints: any;
}

const ReportDetailBZ5_C: React.FC<ReportDetailBZ5_CProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <div style={{ zoom: 1.7 }} className="print-compact">
      <BZ5_CFormPrint
        formData={submission.form_data_json}
        blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
        isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
      />
    </div>
  );
};

export default ReportDetailBZ5_C;