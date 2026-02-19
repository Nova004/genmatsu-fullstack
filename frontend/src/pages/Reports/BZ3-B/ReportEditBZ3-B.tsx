// location: frontend/src/pages/Reports/BZ3-B/ReportEditBZ3-B.tsx

import React from 'react';
import BZ3_BFormEdit from '../../../components/formGen/pages/GEN_B/BZ3-B_Form/BZ3-BFormEdit';
import ApprovalFlowDisplay from "../../../components/formGen/components/forms/ApprovalFlowDisplay";
import { useConditionGuard } from '../../../hooks/useConditionGuard';
import { useAuth } from "../../../context/AuthContext";
import { useResubmit } from '../../../hooks/useResubmit';
import { useUpdateSubmission } from '../../../hooks/useUpdateSubmission'; // 👈 Import ตัวใหม่

interface ReportEditBZ3_BProps {
    submission: any;
    templates: any;
}

const ReportEditBZ3_B: React.FC<ReportEditBZ3_BProps> = ({ submission, templates }) => {
    const { user } = useAuth();
    // แปลงข้อมูลที่ดึงมาให้อยู่ในรูปแบบที่ BZ3-B_Form ต้องการ
    const initialData = {
        ...submission.form_data_json,
        lot_no: submission.lot_no,
        // หากมี field อื่นๆ ที่อยู่นอก form_data_json ก็ให้เพิ่มที่นี่
    };

    const { handleUpdate } = useUpdateSubmission({
        submission,
        redirectPath: '/reports/history/gen-b'
    });

    const { handleResubmit } = useResubmit({
        submission,
        redirectPath: '/reports/history/gen-b' // ถ้าเป็น Gen A ก็แก้เป็น gen-a ได้เลย
    });

    const isEditable = (submission.status !== 'Approved' && String(submission.submitted_by) === String(user?.id)) || user?.LV_Approvals === 3;
    console.log(`id ${submission.submitted_by} = id ${user?.id}`);

    useConditionGuard(
        isEditable,      // เงื่อนไขความถูกต้อง
        false,      // สถานะโหลด (ถ้ายังโหลดไม่เสร็จ อย่าเพิ่งดีด)
        {
            title: 'ไม่สามารถแก้ไขได้',
            text: 'ไม่มีสิทธิ์เเก้ไขรายการนี้',
            redirectTo: '/reports/view/' + submission.submission_id // ดีดกลับไปหน้าดูเฉยๆ
        }
    );

    return (
        <>
            <BZ3_BFormEdit
                initialData={initialData}
                onSubmit={handleUpdate}
                submissionId={submission.submission_id}
                status={submission.status}
                onResubmit={handleResubmit}
                templates={templates} // 👈 Pass templates
            />

            <ApprovalFlowDisplay
                submissionId={submission.submission_id}
                submissionData={submission} // ‼️ คุณลืมเพิ่มบรรทัดนี้หรือเปล่าครับ? ‼️
            />
        </>
    );
};

export default ReportEditBZ3_B;