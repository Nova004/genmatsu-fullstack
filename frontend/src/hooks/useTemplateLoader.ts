// frontend/src/hooks/useTemplateLoader.ts

import { useState, useEffect } from 'react';
import { getLatestTemplateByName } from '../services/formService';

interface UseTemplateLoaderProps {
  templateName: string;
  onTemplateLoaded: (templateInfo: any) => void;
  staticBlueprint?: any;
}

// Hook นี้จะคืนค่า state ที่จำเป็นสำหรับการแสดงผล
export const useTemplateLoader = ({ templateName, onTemplateLoaded, staticBlueprint }: UseTemplateLoaderProps) => {
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

  return { fields, isLoading, error };
};