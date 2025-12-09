// src/hooks/useConditionGuard.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface GuardOptions {
  title?: string;       // หัวข้อแจ้งเตือน
  text: string;         // เนื้อหาแจ้งเตือน (บังคับใส่)
  redirectTo?: string;  // จะให้เด้งไปไหน (Default: หน้าแรก '/')
  confirmBtnText?: string;
}

export const useConditionGuard = (
  isValid: boolean,       // เงื่อนไขที่ "ถูกต้อง" (ถ้าเป็น false จะโดนดีด)
  isLoading: boolean,     // กำลังโหลดข้อมูลอยู่ไหม? (ถ้าโหลดอยู่ จะข้ามการเช็คไปก่อน)
  options: GuardOptions   // ข้อความแจ้งเตือน
) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. ถ้ากำลังโหลดข้อมูลอยู่ อย่าเพิ่งเช็ค (เดี๋ยวเด้งมั่ว)
    if (isLoading) return;

    // 2. ถ้าเงื่อนไข "ไม่ถูกต้อง" (isValid เป็น false)
    if (!isValid) {
      Swal.fire({
        icon: 'warning', // ใช้ warning สีเหลือง หรือ error สีแดงก็ได้
        title: options.title || 'Access Denied',
        text: options.text,
        confirmButtonText: options.confirmBtnText || 'ตกลง',
        allowOutsideClick: false,
        
        // สไตล์ปุ่มแบบ Tailwind ที่คุณชอบ
        buttonsStyling: false,
        customClass: {
          confirmButton: 'bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md'
        }
      }).then(() => {
        // 3. ดีดไปหน้าที่กำหนด
        navigate(options.redirectTo || '/');
      });
    }
  }, [isValid, isLoading, navigate, options]);
};