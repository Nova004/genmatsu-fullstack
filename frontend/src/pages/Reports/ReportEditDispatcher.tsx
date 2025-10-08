// location: frontend/src/pages/Reports/ReportEditDispatcher.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import Loader from '../../common/Loader';
import ReportEditBZ from './BZ/ReportEditBZ';
import ReportEditBZ3 from './BZ3/ReportEditBZ3';
import ReportEditBS3 from './BS3/ReportEditBS3';

// Interface สำหรับข้อมูล Submission ที่คาดหวัง
interface SubmissionPayload {
    submission: any;
    templates: any;
}

const ReportEditDispatcher: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [submissionData, setSubmissionData] = useState<SubmissionPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!id) {
                setError('ไม่พบ ID ของรายงาน');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getSubmissionById(id);
                setSubmissionData(data);
            } catch (err) {
                setError('ไม่สามารถดึงข้อมูลรายงานได้');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmission();
    }, [id]);

    const renderEditForm = () => {
        if (!submissionData) {
            return <div>ไม่พบข้อมูล</div>;
        }

        const { submission, templates } = submissionData;
        const formType = submission.form_type;

        // ใช้ switch case เพื่อ "จ่ายงาน" ไปยัง Component ที่ถูกต้อง
        switch (formType) {
            case 'BZ':
                return <ReportEditBZ submission={submission} templates={templates} />;
            case 'BZ3':
                return <ReportEditBZ3 submission={submission} templates={templates} />;
            case 'BS3':
                return <ReportEditBS3 submission={submission} templates={templates} />;
            default:
                return <div>ไม่รองรับการแก้ไขฟอร์มประเภท: {formType}</div>;
        }
    };

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    return (
        <>
            <Breadcrumb pageName={`แก้ไขรายงาน Lot: ${submissionData?.submission?.lot_no || ''}`} />
            <div className="py-4">
                {renderEditForm()}
            </div>
        </>
    );
};

export default ReportEditDispatcher;