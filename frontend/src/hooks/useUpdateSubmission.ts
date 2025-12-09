import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { updateSubmission } from '../services/submissionService'; // ปรับ path ให้ตรงโปรเจค
import { fireToast } from './fireToast'; // ปรับ path ให้ตรงโปรเจค

interface UseUpdateSubmissionProps {
  submission: any;          // ข้อมูล Submission (ต้องมี submission_id, lot_no)
  redirectPath: string;     // URL ที่จะให้เด้งไปเมื่อบันทึกเสร็จ (เช่น '/reports/history/gen-b')
}

export const useUpdateSubmission = ({ submission, redirectPath }: UseUpdateSubmissionProps) => {
  const navigate = useNavigate();

  const handleUpdate = async (formData: any) => {
    // 1. แสดง Dialog ยืนยัน
    const result = await Swal.fire({
      title: 'ยืนยันการแก้ไข',
      text: `คุณต้องการบันทึกการเปลี่ยนแปลงสำหรับ Lot No: "${submission.lot_no}" ใช่หรือไม่?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white',
        confirmButton: 'inline-flex items-center justify-center rounded-md bg-danger py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6',
        cancelButton: 'ml-3 inline-flex items-center justify-center rounded-md bg-primary py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6'
      },
    });

    // 2. ถ้ากดยืนยัน ให้เรียก API
    if (result.isConfirmed) {
      try {
        await updateSubmission(submission.submission_id, {
          lot_no: formData.basicData?.lotNo || submission.lot_no,
          form_data: formData,
        });

        fireToast('success', 'บันทึกการเปลี่ยนแปลงสำเร็จ');
        window.dispatchEvent(new Event('REFRESH_NOTIFICATIONS'));
        // 3. เด้งกลับไปหน้า History พร้อม Highlight
        navigate(redirectPath, {
          state: { highlightedId: submission.submission_id }
        });

      } catch (error) {
        console.error("Failed to update submission:", error);
        fireToast('error', 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้');
      }
    }
  };

  return { handleUpdate };
};