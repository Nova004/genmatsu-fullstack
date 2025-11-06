// frontend/src/pages/Reports/AS/PrintableReportAX2-B.tsx

import React from 'react';
import AX2_BFormPrint from '../../../components/formGen/pages/GEN_A/AX2-B_Form/AX2-BFormPrint';

interface ReportDetailAX2_BProps {
  submission: any;
  blueprints: any;
}

const ReportDetailAX2_B: React.FC<ReportDetailAX2_BProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <div style={{ zoom: 1.7 }} className="print-compact">
      <AX2_BFormPrint
        formData={submission.form_data_json}
        blueprints={blueprints} // 👈 ส่งพิมพ์เขียวที่ถูกต้องไปให้ Viewer
        isReadOnly={true}       // 👈 บอก Viewer ให้อยู่ในโหมดอ่านอย่างเดียว
      />
    </div>
  );
};

export default ReportDetailAX2_B;