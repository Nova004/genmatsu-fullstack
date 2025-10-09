// location: frontend/src/hooks/useTemplateLoader.ts

import { useState, useEffect } from 'react';
import { getLatestTemplateByName } from '../services/formService';
import { fireToast } from './fireToast';

interface TemplateItem {
    item_id: number;
    template_id: number;
    config_json: any;
    // เพิ่ม properties อื่นๆ ถ้ามี
}

// Props ที่ Hook จะรับเข้ามา
interface UseTemplateLoaderProps {
    templateName: string;
    onTemplateLoaded: (templateInfo: { template_id: number; template_name: string }) => void;
}

export const useTemplateLoader = ({ templateName, onTemplateLoaded }: UseTemplateLoaderProps) => {
    const [items, setItems] = useState<TemplateItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getLatestTemplateByName(templateName);
                console.log(`[useTemplateLoader] Data received for ${templateName}:`, data);

                if (data && data.template && data.items && data.items.length > 0) {
                    const parsedItems = data.items.map((item: any) => {
                        // ตรวจสอบก่อนว่า config_json เป็น string หรือไม่
                        const config = typeof item.config_json === 'string'
                            ? JSON.parse(item.config_json || '{}') // ถ้าใช่ ให้ parse
                            : item.config_json || {}; // ถ้าไม่ใช่ (เป็น object อยู่แล้ว) ให้ใช้ได้เลย

                        return {
                            ...item,
                            config_json: config, // ใช้ค่าที่แปลงแล้ว
                        };
                    });
                    setItems(parsedItems);

                    // ส่งข้อมูล template กลับขึ้นไปให้ฟอร์มหลัก
                    onTemplateLoaded({
                        template_id: data.template.template_id,
                        template_name: data.template.template_name,
                    });

                } else {
                    console.warn(`Template "${templateName}" loaded successfully but has no items.`);
                    throw new Error('ไม่พบข้อมูล Template');
                }
            } catch (err: any) {
                const errorMessage = `ไม่สามารถโหลด Template (${templateName}) ได้: ${err.message}`;
                setError(errorMessage);
                fireToast('error', errorMessage);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplate();
        // เราใส่ onTemplateLoaded ใน dependency array เพื่อให้แน่ใจว่ามันเป็นฟังก์ชันล่าสุดเสมอ
        // (ซึ่งเราได้ป้องกันด้วย useCallback ใน BZ_index.tsx อยู่แล้ว)
    }, [templateName, onTemplateLoaded]);

    // คืนค่าที่จำเป็นให้ Component นำไปใช้งาน
    return { items, isLoading, error };
};