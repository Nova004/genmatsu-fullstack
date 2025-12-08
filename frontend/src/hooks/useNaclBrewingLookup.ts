// C:\Projects\genmatsu-fullstack\frontend\src\hooks\useNaclBrewingLookup.ts

import { useEffect } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { IManufacturingReportForm } from '../components/formGen/pages/types.ts';
import apiClient from '../services/apiService';

/**
 * Custom Hook สำหรับค้นหาค่า NaCl_NaCl_Water จากตาราง
 * โดยใช้ cg1cWaterContent, ประเภทของ NaCl (naclType) และ Chemicals_Type
 *  @param watch - ฟังก์ชัน watch จาก react-hook-form
 * @param setValue - ฟังก์ชัน setValue จาก react-hook-form
 * @param naclType - ประเภทของ NaCl ที่เป็นค่าตายตัว (เช่น '4%', '15%')
 * @param chemicalsType - 🔽 ตัวแปรเสริม (Optional) สำหรับ Chemicals_Type ถ้าไม่ส่งมาจะเป็น null
 */
const useNaclBrewingLookup = (
    watch: UseFormWatch<IManufacturingReportForm>,
    setValue: UseFormSetValue<IManufacturingReportForm>,
    naclType: string,
    chemicalsType?: string | null // 🔽 เพิ่ม Argument ตัวที่ 4 เป็น Optional/Nullable
) => {
    const cg1cWaterContent = watch('calculations.cg1cWaterContent');

    useEffect(() => {
        // 1. ตรวจสอบเงื่อนไขหลักที่จำเป็นในการค้นหา
        if (
            cg1cWaterContent === null ||
            cg1cWaterContent === undefined ||
            isNaN(cg1cWaterContent) ||
            !naclType // ต้องมี naclType เสมอ
        ) {
            setValue('calculations.naclBrewingTable', null);
            return;
        }

        // 2. เข้ารหัสค่า URL Parameters
        const encodedWaterContent = cg1cWaterContent; // Water content มักเป็นตัวเลข ไม่จำเป็นต้อง encodeURIComponent
        const encodedNaclType = encodeURIComponent(naclType);

        // 🔽 3. จัดการตัวแปร chemicalsType (ถ้ามีค่า จะเข้ารหัสและใช้ใน URL)
        // ถ้าไม่มีค่า หรือเป็น null/undefined/ว่าง ให้ใช้ค่าว่างเพื่อให้ URL เป็นรูปแบบที่ถูกต้อง
        const chemicalsTypeParam = chemicalsType ? encodeURIComponent(chemicalsType) : 'null';

        const fetchBrewingValue = async () => {
            try {
                // 🔽 4. อัปเดต URL เพื่อรวม Chemicals_Type เข้าไปด้วย
                // ใช้ 'null' เป็น placeholder ใน URL เพื่อระบุว่าไม่ได้ส่งค่ามา
                const url = `/nacl/lookup/${encodedWaterContent}/${encodedNaclType}/${chemicalsTypeParam}`;

                const response = await apiClient.get(url);

                const naclValue = response.data?.NaCl_NaCl_Water;
                setValue('calculations.naclBrewingTable', naclValue !== undefined ? naclValue : null);
            } catch (error) {
                console.error("NaCl lookup failed:", error);
                setValue('calculations.naclBrewingTable', null);
            }
        };

        const delayDebounceFn = setTimeout(() => fetchBrewingValue(), 500);
        return () => clearTimeout(delayDebounceFn);

        // 🔽 5. ต้องเพิ่ม chemicalsType เข้าไปใน Dependency Array ด้วย
    }, [cg1cWaterContent, naclType, chemicalsType, setValue]);
};

export default useNaclBrewingLookup;