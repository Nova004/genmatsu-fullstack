import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { resubmitSubmission } from '../services/submissionService'; // ปรับ path ให้ตรงกับโปรเจคจริง
import { fireToast } from './fireToast'; // ปรับ path ให้ตรงกับโปรเจคจริง

interface UseResubmitProps {
  submission: any; // ข้อมูล Submission (ต้องมี status, lot_no, submission_id)
  redirectPath: string; // URL ที่จะให้เด้งไปเมื่อทำรายการสำเร็จ (เช่น '/reports/history/gen-b')
  resubmitFn?: (id: number | string, data: any) => Promise<any>; // 👈 เพิ่ม Optional Prop สำหรับระบุฟังก์ชัน resubmit เอง
}

export const useResubmit = ({
  submission,
  redirectPath,
  resubmitFn,
}: UseResubmitProps) => {
  const navigate = useNavigate();

  const handleResubmit = async (data: any) => {
    if (!submission) return;

    // 1. เช็คสถานะก่อน เพื่อเลือกข้อความให้ถูก
    const isRejected = submission.status === 'Rejected';

    // กำหนดข้อความตามสถานะ
    const titleText = isRejected
      ? 'ยืนยันการส่งอนุมัติใหม่?'
      : 'ยืนยันการส่งอนุมัติ?';
    const bodyText = isRejected
      ? `เอกสาร Lot No: "${submission.lot_no}" จะถูกส่งอนุมัติใหม่`
      : `เอกสาร Lot No: "${submission.lot_no}" จะถูกเปลี่ยนสถานะเป็น "รออนุมัติ"`;
    const confirmBtnText = isRejected ? 'ส่งอนุมัติใหม่' : 'ส่งอนุมัติ';

    // 2. Dialog ยืนยัน
    const result = await Swal.fire({
      title: titleText,
      text: bodyText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmBtnText,
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white',
        confirmButton:
          'inline-flex items-center justify-center rounded-md bg-success py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6',
        cancelButton:
          'ml-3 inline-flex items-center justify-center rounded-md bg-primary py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6',
      },
    });

    // 3. Logic การส่งข้อมูล
    if (result.isConfirmed) {
      try {
        if (resubmitFn) {
          // กรณีระบุฟังก์ชัน resubmit เอง (เช่น Ironpowder)
          // Ironpowder requires explicit { formData: ... } wrapper for resubmit as well
          const specificPayload = { formData: data };
          await resubmitFn(submission.submission_id, specificPayload);
        } else {
          // กรณีปกติ (GEN_A, GEN_B)
          await resubmitSubmission(submission.submission_id, data);
        }

        fireToast(
          'success',
          isRejected ? 'ส่งอนุมัติใหม่สำเร็จ!' : 'ส่งอนุมัติสำเร็จ!',
        );
        window.dispatchEvent(new Event('REFRESH_NOTIFICATIONS'));
        // เด้งไปหน้า History พร้อม Highlight ID
        navigate(redirectPath, {
          state: { highlightedId: submission.submission_id },
        });
      } catch (error) {
        console.error('Resubmit Error:', error);
        fireToast('error', 'ทำรายการไม่สำเร็จ');
        // คุณอาจจะ throw error ต่อเพื่อให้ Component รับรู้ได้ถ้าต้องการ
        throw error;
      }
    }
  };

  return { handleResubmit };
};
