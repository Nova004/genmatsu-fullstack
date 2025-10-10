// location: frontend/src/pages/Reports/BZ/ReportEditBZ.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import BZFormEdit from '../../../components/formGen/pages/GEN_B/BZ_Form/BZFormEdit';
import { updateSubmission } from '../../../services/submissionService'; // สร้างฟังก์ชันนี้ในขั้นตอนต่อไป
import { fireToast } from '../../../hooks/fireToast';
import Swal from 'sweetalert2';

interface ReportEditBZProps {
    submission: any;
    templates: any;
}

const ReportEditBZ: React.FC<ReportEditBZProps> = ({ submission, templates }) => {
    const navigate = useNavigate();

    // แปลงข้อมูลที่ดึงมาให้อยู่ในรูปแบบที่ BZ_Form ต้องการ
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
                    lot_no: formData.lot_no,
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

    return (
        <BZFormEdit
            initialData={initialData}
            onSubmit={handleUpdate}
        />
    );
};

export default ReportEditBZ;