// location: frontend/src/pages/Reports/BS-B/ReportEditBS-B.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import BS_BFormEdit from '../../../components/formGen/pages/GEN_B/BS-B_Form/BS-BFormEdit';
import { updateSubmission, resubmitSubmission } from '../../../services/submissionService'; // สร้างฟังก์ชันนี้ในขั้นตอนต่อไป
import { fireToast } from '../../../hooks/fireToast';
import Swal from 'sweetalert2';

interface ReportEditBS_BProps {
    submission: any;
    templates: any;
}

const ReportEditBS_B: React.FC<ReportEditBS_BProps> = ({ submission, templates }) => {
    const navigate = useNavigate();

    // แปลงข้อมูลที่ดึงมาให้อยู่ในรูปแบบที่ BS-B_Form ต้องการ
    const initialData = {
        ...submission.form_data_json,
        lot_no: submission.lot_no,
        // หากมี field อื่นๆ ที่อยู่นอก form_data_json ก็ให้เพิ่มที่นี่
    };

    const handleUpdate = async (formData: any) => {
        // แสดง dialog ยืนยันก่อนอัปเดต
        const result = await Swal.fire({
            title: 'ยืนยันการแก้ไข',
            text: `คุณต้องการบันทึกการเปลี่ยนแปลงสำหรับ Lot No: "${submission.lot_no}" ใช่หรือไม่?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            customClass: { // ปรับแต่งสไตล์ของ SweetAlert2 ให้เข้ากับ Theme
                popup: 'dark:bg-boxdark dark:text-white',
                confirmButton: 'inline-flex items-center justify-center rounded-md bg-danger py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6',
                cancelButton: 'ml-3 inline-flex items-center justify-center rounded-md bg-primary py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6'
            },
        });

        if (result.isConfirmed) {
            try {
                // เรียก service เพื่ออัปเดตข้อมูล
                await updateSubmission(submission.submission_id, {
                    lot_no: formData.basicData.lotNo,
                    form_data: formData, // ส่งข้อมูลที่แก้ไขแล้วทั้งหมดไป
                });
                fireToast('success', 'บันทึกการเปลี่ยนแปลงสำเร็จ');
                navigate('/reports/history/gen-b', {
                    state: { highlightedId: submission.submission_id }
                });
            } catch (error) {
                console.error("Failed to update submission:", error);
                fireToast('error', 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้');
            }
        }
    };


    const onResubmit = async (data: any) => {

        // 2. เพิ่ม Dialog ยืนยัน
        const result = await Swal.fire({
            title: 'ยืนยันการส่งอนุมัติใหม่?',
            text: `เอกสาร Lot No: "${submission.lot_no}" จะถูกส่งอนุมัติใหม่`,
            icon: 'warning', // 👈 เปลี่ยน Icon เป็น 'warning'
            showCancelButton: true,
            confirmButtonText: 'ส่งอนุมัติใหม่', // 👈 เปลี่ยนข้อความปุ่ม
            cancelButtonText: 'ยกเลิก',
            customClass: {
                popup: 'dark:bg-boxdark dark:text-white',
                confirmButton: 'inline-flex items-center justify-center rounded-md bg-success py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6',
                cancelButton: 'ml-3 inline-flex items-center justify-center rounded-md bg-primary py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6'
            },
        });

        // 3. ย้าย Logic เดิมเข้ามาใน if(result.isConfirmed)
        if (result.isConfirmed) {
            try {
                await resubmitSubmission(submission.submission_id, data);
                fireToast("success", "ส่งเอกสารแก้ไข และเริ่มอนุมัติใหม่สำเร็จ!");
                navigate('/reports/history/gen-b', {
                    state: { highlightedId: submission.submission_id }
                });
            } catch (error) {
                console.error(error);
                fireToast("error", "Resubmit ไม่สำเร็จ");
            }
        }
    };

    return (
        <BS_BFormEdit
            initialData={initialData}
            onSubmit={handleUpdate}
            submissionId={submission.submission_id}
            status={submission.status}
            onResubmit={onResubmit}
        />
    );
};

export default ReportEditBS_B;