import React from 'react';
import AJ4FormPrint from '../../../components/formGen/pages/GEN_A/AJ4_Form/AJ4FormPrint';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailAJ4Props {
  submission: any;
  blueprints: any;
}

const ReportDetailAJ4: React.FC<ReportDetailAJ4Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <div style={{ zoom: 1.7 }} className="print-compact">
        <AJ4FormPrint
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

export default ReportDetailAJ4;