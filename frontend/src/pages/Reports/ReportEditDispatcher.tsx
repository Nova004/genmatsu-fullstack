// location: frontend/src/pages/Reports/ReportEditDispatcher.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';
import { ironpowderService } from '../../services/ironpowder.service';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import Loader from '../../common/Loader';
import { formatNumberRound, isNumeric } from '../../utils/utils';
import { EXCLUDED_DECIMAL_FIELDS } from './EXCLUDED_DECIMAL_FIELDS';

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
import ReportEditAJ4 from './AJ4/ReportEditAJ4';
import ReportEditAS4 from './AS4/ReportEditAS4';
import ReportEditAS2_D from './AS2-D/ReportEditAS2-D';
import ReportEditAZ_D from './AZ-D/ReportEditAZ-D';
import ReportEditAZ1 from './AZ1/ReportEditAZ1';
import ReportEditAX9_B from './AX9-B/ReportEditAX9-B';
import ReportEditAX2_B from './AX2-B/ReportEditAX2-B';
import ReportEditAZ from './AZ/ReportEditAZ';
import ReportEditIronpowder from './Ironpowder/ReportEditIronpowder';


// Interface สำหรับข้อมูล Submission ที่คาดหวัง
interface SubmissionPayload {
    submission: any;
    templates: any;
}


const processTemplateData = (data: any, parentKey: string = ''): any => {
    if (Array.isArray(data)) {
        return data.map(item => processTemplateData(item, parentKey));
    }
    if (data !== null && typeof data === 'object') {
        return Object.fromEntries(
            Object.entries(data).map(([key, val]) => {
                const currentPath = parentKey ? `${parentKey}.${key}` : key;

                if (isNumeric(val)) {
                    // 1. เช็คว่าเป็น Field ที่ต้องยกเว้นหรือไม่
                    const isExcluded = EXCLUDED_DECIMAL_FIELDS.some(excluded => {
                        return currentPath === excluded ||
                            currentPath.endsWith(`.${excluded}`) ||
                            key === excluded;
                    });

                    // 🚩 2. แก้ไขตรงนี้: ลบ typeof val === 'string' ออก
                    // "ถ้าอยู่ในลิสต์ยกเว้น ให้คืนค่าเดิมทันที (ไม่ว่าจะเป็น int, float หรือ string)"
                    if (isExcluded) {
                        return [key, val];
                    }

                    // ถ้าไม่ใช่ตัวยกเว้น ค่อยจับปัดเศษ
                    return [key, formatNumberRound(val)];
                }

                return [key, processTemplateData(val, currentPath)];
            })
        );
    }
    return data;
};


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
                // 1. ลองดึงข้อมูลแบบปกติก่อน (SubmitSubmission)
                const data = await getSubmissionById(id);

                const formattedSubmission = {
                    ...data.submission,
                    form_data_json: processTemplateData(data.submission.form_data_json)
                };

                setSubmissionData({
                    submission: formattedSubmission,
                    templates: data.blueprints
                });

            } catch (err) {
                console.warn("Standard submission not found, trying Ironpowder...", err);

                // 2. ถ้าไม่เจอ (Error) ให้ลองดึงแบบ Ironpowder
                try {
                    const ironData = await ironpowderService.getIronpowderById(id);

                    // Map ข้อมูลให้เข้ากับโครงสร้างที่ ReportEditDispatcher คาดหวัง
                    const formattedSubmission = {
                        ...ironData,
                        form_type: 'Ironpowder', // บังคับระบุ Type
                        form_data_json: processTemplateData(ironData.form_data_json || ironData.formData), // Map formData or form_data_json
                        lot_no: ironData.lotNo || ironData.lot_no, // Map lotNo -> lot_no (เผื่อ Component ลูกใช้)

                        // Map keys to snake_case for compatibility with ReportEditIronpowder
                        submission_id: ironData.submissionId || ironData.submission_id,
                        submitted_by: ironData.submittedBy || ironData.submitted_by,
                    };

                    setSubmissionData({
                        submission: formattedSubmission,
                        templates: [] // Ironpowder อาจจะไม่ได้ใช้ blueprint/templates แบบเดิม
                    });

                } catch (ironErr) {
                    // ถ้ายังไม่เจออีก ก็ยอมแพ้
                    setError('ไม่สามารถดึงข้อมูลรายงานได้ (Submission Not Found)');
                    console.error("Failed to fetch Ironpowder submission:", ironErr);
                }
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
            case 'AJ4':
                return <ReportEditAJ4 submission={submission} templates={templates} />;
            case 'AS4':
                return <ReportEditAS4 submission={submission} templates={templates} />;
            case 'AS2-D':
                return <ReportEditAS2_D submission={submission} templates={templates} />;
            case 'AZ-D':
                return <ReportEditAZ_D submission={submission} templates={templates} />;
            case 'AZ1':
                return <ReportEditAZ1 submission={submission} templates={templates} />;
            case 'AX9-B':
                return <ReportEditAX9_B submission={submission} templates={templates} />;
            case 'AX2-B':
                return <ReportEditAX2_B submission={submission} templates={templates} />;
            case 'AZ':
                return <ReportEditAZ submission={submission} templates={templates} />;
            case 'Ironpowder':
                return <ReportEditIronpowder submission={submission}  />;
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