import React from 'react';
import AS2FormPrint from '../../../components/formGen/pages/GEN_A/AS2_Form/AS2FormPrint';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailAS2Props {
  submission: any;
  blueprints: any;
}

const ReportDetailAS2: React.FC<ReportDetailAS2Props> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <div style={{ zoom: 1.7 }} className="print-compact">
        <AS2FormPrint
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

export default ReportDetailAS2;