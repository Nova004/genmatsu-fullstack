import React from 'react';
import AS2_DFormPrint from '../../../components/formGen/pages/GEN_A/AS2-D_Form/AS2-DFormPrint';
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
      <div style={{ zoom: 1.7 }} className="print-compact">
        <AS2_DFormPrint
          formData={submission.form_data_json}
          blueprints={blueprints}
          isReadOnly={true}

          // ‼️ 1. นี่คือ Prop เดิมที่ทำให้ฟอร์ม+อนุมัติ ไม่ทับกัน ‼️
          approvalFlowComponent={
            submission.submission_id ? (

              // ‼️ 2. ส่ง "submission" ทั้งก้อนเข้าไป ‼️
              <ApprovalFlowDisplay
                submissionId={submission.submission_id}
                submissionData={submission}
              />

            ) : null
          }
        />
      </div>
    </>
  );
};

export default ReportDetailAS2_D;