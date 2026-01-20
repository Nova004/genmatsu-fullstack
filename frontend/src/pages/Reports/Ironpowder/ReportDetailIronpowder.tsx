//src/pages/Reports/Ironpowder/ReportDetailIronpowder.tsx

import React from 'react';
import IronpowderFormViewer from '../../../components/formGen/pages/Recycle/IronpowderFormViewer';
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
            <IronpowderFormViewer
                formData={submission.form_data_json}
                blueprints={blueprints}
                isReadOnly={true}
            />
            <ApprovalFlowDisplay
                submissionId={submission.submission_id}
                submissionData={submission}
            />
        </>
    );
};

export default ReportDetailIronpowder;
