// frontend/src/hooks/useWeightCalculations.ts

import { useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, Path } from 'react-hook-form';
import { IManufacturingReportForm } from '../components/formGen/pages/types';

// 1. กำหนด Type สำหรับ Config ของแต่ละแถว
interface WeightingRowConfig {
  grossWeightPath: Path<IManufacturingReportForm>; // Path ไปยังน้ำหนักตั้งต้น
  netWeightPath: Path<IManufacturingReportForm>;   // Path ที่จะเก็บค่าน้ำหนัก Net
  tare: number;                                     // น้ำหนักภาชนะที่จะลบ
}

// 2. กำหนด Type สำหรับ Config หลัก
export interface WeightingCalculationConfig {
  rows: WeightingRowConfig[];
  totalPath: Path<IManufacturingReportForm>;
  destinationPath: Path<IManufacturingReportForm>;
}

/**
 * 🚀 HOOK กลาง: สำหรับการคำนวณน้ำหนัก (Net & Total) ตาม Config ที่ส่งเข้ามา
 */
export const useWeightingCalculation = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>,
  config: WeightingCalculationConfig // 3. รับ Config เข้ามา
) => {
  // 4. สร้าง Array ของ dependencies จาก Path ทั้งหมดใน config
  const watchedPaths = config.rows.map(row => row.grossWeightPath);
  const watchedValues = watch(watchedPaths);

  useEffect(() => {
    let totalNet = 0;

    // 5. วนลูปคำนวณแต่ละแถวตาม config
    config.rows.forEach((row, index) => {
      const grossWeight = Number(watchedValues[index]) || 0;
      const netWeight = grossWeight > 0 ? grossWeight - row.tare : 0;

      setValue(row.netWeightPath, netWeight > 0 ? netWeight : null);
      totalNet += netWeight;
    });

    // 6. ตั้งค่าผลรวม และส่งไปยังปลายทาง
    setValue(config.totalPath, totalNet > 0 ? totalNet : null);
    setValue(config.destinationPath, totalNet > 0 ? totalNet : null, { shouldValidate: true });

  }, [...watchedValues, setValue, config]); // ให้ re-run เมื่อค่าใดๆ ที่ watch อยู่เปลี่ยนไป
};