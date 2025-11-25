// location: frontend/src/pages/Reports/ReportEditDispatcher.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import Loader from '../../common/Loader';

import ReportEditBZ from './BZ/ReportEditBZ';
import ReportEditBS_B from './BS-B/ReportEditBS-B';
import ReportEditBS from './BS/ReportEditBS';
import ReportEditBN from './BN/ReportEditBN';
import ReportEditBZ3 from './BZ3/ReportEditBZ3';
import ReportEditBZ3_B from './BZ3-B/ReportEditBZ3-B';
import ReportEditBS3 from './BS3/ReportEditBS3';
import ReportEditBS3_B from './BS3-B/ReportEditBS3-B';
import ReportEditBS3_B1 from './BS3-B1/ReportEditBS3-B1';
import ReportEditBZ5_C from './BZ5-C/ReportEditBZ5-C';
import ReportEditBS5_C from './BS5-C/ReportEditBS5-C';
import ReportEditBS3_C from './BS3-C/ReportEditBS3-C';


import ReportEditAS2 from './AS2/ReportEditAS2';
import ReportEditAX9_B from './AX9-B/ReportEditAX9-B';
import ReportEditAX2_B from './AX2-B/ReportEditAX2-B';

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
                setSubmissionData({
                    submission: data.submission,
                    templates: data.blueprints
                });
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
            case 'BS-B':
                return <ReportEditBS_B submission={submission} templates={templates} />;
            case 'BS':
                return <ReportEditBS submission={submission} templates={templates} />;
            case 'BN':
                return <ReportEditBN submission={submission} templates={templates} />;
            case 'BZ3':
                return <ReportEditBZ3 submission={submission} templates={templates} />;
            case 'BZ3-B':
                return <ReportEditBZ3_B submission={submission} templates={templates} />;
            case 'BS3-B1':
                return <ReportEditBS3_B1 submission={submission} templates={templates} />;
            case 'BS3':
                return <ReportEditBS3 submission={submission} templates={templates} />;
            case 'BS3-C':
                return <ReportEditBS3_C submission={submission} templates={templates} />;
            case 'BS3-B':
                return <ReportEditBS3_B submission={submission} templates={templates} />;
            case 'BZ5-C':
                return <ReportEditBZ5_C submission={submission} templates={templates} />;
            case 'BS5-C':
                return <ReportEditBS5_C submission={submission} templates={templates} />;
            case 'AS2':
                return <ReportEditAS2 submission={submission} templates={templates} />;
            case 'AX9-B':
                return <ReportEditAX9_B submission={submission} templates={templates} />;
            case 'AX2-B':
                return <ReportEditAX2_B submission={submission} templates={templates} />;
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