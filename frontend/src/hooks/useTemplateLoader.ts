// frontend/src/hooks/useTemplateLoader.ts

import { useState, useEffect } from 'react';
import { getLatestTemplateByName } from '../services/formService';
import { socket } from '../services/socket';
import Swal from 'sweetalert2';

interface UseTemplateLoaderProps {
  templateName: string;
  onTemplateLoaded: (templateInfo: any) => void;
  staticBlueprint?: any;
}

// Hook นี้จะคืนค่า state ที่จำเป็นสำหรับการแสดงผล
export const useTemplateLoader = ({
  templateName,
  onTemplateLoaded,
  staticBlueprint,
}: UseTemplateLoaderProps) => {
  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processBlueprint = (data: any) => {
      if (data && data.items) {
        setFields(data.items);
        if (onTemplateLoaded) {
          onTemplateLoaded(data.template);
        }
      } else {
        setError(`โครงสร้าง Master ของ ${templateName} ไม่ถูกต้อง`);
      }
      setIsLoading(false);
    };

    const fetchLatestBlueprint = async () => {
      try {
        const data = await getLatestTemplateByName(templateName);
        processBlueprint(data);
      } catch (err) {
        setError(`ไม่สามารถโหลดข้อมูล Master (${templateName}) ได้`);
        setIsLoading(false);
      }
    };

    if (staticBlueprint) {
      processBlueprint(staticBlueprint);
    } else {
      fetchLatestBlueprint();
    }
  }, [templateName, onTemplateLoaded, staticBlueprint]);

  // 🚀 Real-time Update Listener
  useEffect(() => {
    if (staticBlueprint) return; // ไม่ต้องฟังถ้าใช้ Static

    const handleUpdate = (data: any) => {
      // 1. เช็คว่าเป็น Template เดียวกันไหม
      if (data.templateName !== templateName) return;

      const effectiveTime = new Date(data.effectiveDate).getTime();
      const now = new Date().getTime();
      const delay = effectiveTime - now;

      const showUpdateAlert = () => {
        Swal.fire({
          title: '✨ New Version Available!',
          text: `A new version of "${templateName}" is now active. The page will refresh to update the form.`,
          icon: 'info',
          confirmButtonText: 'Update Now',
          allowOutsideClick: false,
          customClass: {
            confirmButton:
              'bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all font-medium',
          },
        }).then(() => {
          window.location.reload();
        });
      };

      if (delay <= 0) {
        // 🚀 ถึงเวลาแล้ว -> แจ้งเตือนทันที
        showUpdateAlert();
      } else {
        // ⏳ ยังไม่ถึงเวลา -> ตั้งเวลาแจ้งเตือน
        console.log(`[Socket] Update scheduled in ${delay}ms`);
        const timer = setTimeout(() => {
          showUpdateAlert();
        }, delay);
        return () => clearTimeout(timer); // Clear timeout ถ้า component unmount
      }
    };

    socket.on('template_updated', handleUpdate);

    return () => {
      socket.off('template_updated', handleUpdate);
    };
  }, [templateName, staticBlueprint]);

  return { fields, isLoading, error };
};
