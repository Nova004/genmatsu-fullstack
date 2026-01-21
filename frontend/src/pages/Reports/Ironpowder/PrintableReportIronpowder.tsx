import React from 'react';
import IronpowderFormPrint from '../../../components/formGen/pages/Recycle/IronpowderFormPrint';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";

interface ReportDetailIronpowderProps {
  submission: any;
  blueprints: any;
}

const ReportDetailIronpowder: React.FC<ReportDetailIronpowderProps> = ({ submission, blueprints }) => {
  if (!submission || !submission.form_data_json) {
    return <div>ไม่พบข้อมูลฟอร์ม</div>;
  }

  return (
    <>
      <div className="print-compact">
        <IronpowderFormPrint
          formData={submission.form_data_json}
          blueprints={blueprints}
          isReadOnly={true}
          approvalFlowComponent={
            submission.submission_id ? (
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

export default ReportDetailIronpowder;