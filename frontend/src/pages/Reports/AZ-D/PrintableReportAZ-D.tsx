import React from 'react';
import AZ_DFormPrint from '../../../components/formGen/pages/GEN_A/AZ-D_Form/AZ-DFormPrint';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailAZ_DProps {
  submission: any;
  blueprints: any;
}

const ReportDetailAZ_D: React.FC<ReportDetailAZ_DProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <div style={{ zoom: 1.7 }} className="print-compact">
        <AZ_DFormPrint
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

export default ReportDetailAZ_D;