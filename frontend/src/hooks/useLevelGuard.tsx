// src/hooks/useLevelGuard.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export const useLevelGuard = (minLevel: number) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // ถ้ายังไม่มี User (เช่น กำลังโหลด หรือ ไม่ได้ Login) ให้ข้ามไปก่อน
        if (!user) return;

        const userLevel = Number(user.LV_Approvals || 0);

        // เช็คสิทธิ์
        if (userLevel < minLevel) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: `สิทธิ์ของคุณไม่เพียงพอ (Level ${userLevel}) ต้องการ Level ${minLevel} ขึ้นไป`,

                confirmButtonText: 'กลับหน้าหลัก',
                allowOutsideClick: false,

                // --- ส่วนที่แก้ไขเพื่อแก้ปุ่มมองไม่เห็น ---
                buttonsStyling: false, // 1. ปิด Default Style ของ SweetAlert
                customClass: {
                    // 2. ใส่ Class Tailwind แต่งปุ่มเองเลย (สีแดง, ตัวหนังสือขาว, มีความโค้ง)
                    confirmButton: 'bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md'
                }
                // ------------------------------------

            }).then(() => {
                navigate('/');
            });
        }
    }, [user, navigate, minLevel]);
};