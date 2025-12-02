import { useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, Path } from 'react-hook-form';
import { IManufacturingReportForm } from '../components/formGen/pages/types';

interface WeightingRowConfig {
  grossWeightPath: Path<IManufacturingReportForm>;
  netWeightPath: Path<IManufacturingReportForm>;
  tare?: number;
  bagWeightPath?: Path<IManufacturingReportForm>;
}

export interface WeightingCalculationConfig {
  rows: WeightingRowConfig[];
  totalPath: Path<IManufacturingReportForm>;
  destinationPath: Path<IManufacturingReportForm>;
}



export const useWeightingCalculation = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>,
  config: WeightingCalculationConfig
) => {
  const grossPaths = config.rows.map(r => r.grossWeightPath);
  const bagPaths = config.rows.map(r => r.bagWeightPath || r.grossWeightPath);

  const grossValues = watch(grossPaths);
  const bagValues = watch(bagPaths);

  useEffect(() => {
    let totalNet = 0;

    config.rows.forEach((row, index) => {
      const gross = Number(grossValues[index]) || 0;

      let tare = 0;
      if (row.bagWeightPath) {
        tare = Number(bagValues[index]) || 0;
      } else {
        tare = row.tare || 0;
      }

      // 1. คำนวณ Net ดิบๆ
      let rawNet = gross > 0 ? gross - tare : 0;

      // 2. เตรียมค่าที่เป็นตัวเลขเอาไว้บวก Total (ใช้ตัวเลขดิบ หรือจะปัดเศษก่อนบวกก็ได้ตาม business logic)
      const finalNetNum = rawNet > 0 ? rawNet : 0;

      // 3. Set ค่าเข้า Form เป็น String เพื่อให้มี .00
      // ตรงนี้คือจุดที่แก้ไข: ใช้ .toFixed(2) และส่งค่าเป็น String ไป
      setValue(row.netWeightPath, finalNetNum > 0 ? finalNetNum.toFixed(2) : null);

      // 4. บวกเข้า Total (ต้องใช้ตัวแปรที่เป็น Number นะครับ ห้ามเอา String มาบวก)
      totalNet += finalNetNum;
    });
    // 4. ปัดเศษ Total ก่อนส่ง
    const finalTotal = totalNet.toFixed(2);

    // 5. ส่งค่า Total ที่ปัดแล้ว
    setValue(config.totalPath, totalNet > 0 ? finalTotal : null);
    setValue(config.destinationPath, totalNet > 0 ? finalTotal : null, { shouldValidate: true });

  }, [
    grossValues.join(','),
    bagValues.join(','),
    config,
    setValue
  ]);
};