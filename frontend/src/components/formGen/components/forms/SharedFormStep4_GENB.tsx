// frontend/src/components/formGen/components/forms/SharedFormStep4.tsx

import React, { useEffect, useMemo } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';
import PalletTable from './PalletTable';
import PackingResultTable from './PackingResultTable_GENB';
import { formatNumberPreserve } from '../../../../utils/utils';

// 1. สร้าง Type สำหรับชื่อฟิลด์ที่เราจะรับเข้ามา
type TotalWeightFieldName =
  | 'calculations.finalTotalWeight'
  | 'bz3Calculations.totalWeightWithNcr'
  | 'bs3Calculations.totalWeightWithNcr'
  | 'bz5cCalculations.totalWeightWithNcr'
  | 'bs5cCalculations.totalWeightWithNcr'
  | 'calculations.finalTotalWeightFixed';


// 2. แก้ไข Interface ให้รับ prop ใหม่
interface SharedFormStep4Props {
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  totalWeightFieldName: TotalWeightFieldName; // Prop สำหรับรับชื่อฟิลด์
  formType?: string;
}

/**
 * 💡 ฟังก์ชันกำหนด Cans Multiplier ตาม formType
 * @param type - formType (Optional string)
 * @param defaultMultiplier - ค่าเริ่มต้น
 * @returns ค่าตัวคูณที่ปรับแล้ว
 */
const determineCansMultiplier = (type: string | undefined, defaultMultiplier: number): number => {
  // 💡 ปรับ Logic การเปลี่ยนตัวคูณที่นี่ตาม Form Type
  if (type === 'BN') {
    return 15;
  }
  // ถ้าไม่มี formType หรือไม่ตรงกับเงื่อนไขใดๆ ให้ใช้ค่าเริ่มต้น
  return defaultMultiplier;
};

// Custom Hook สำหรับคำนวณ (ปรับให้รับชื่อฟิลด์เข้ามา)
const useStep4Calculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>,
  totalWeightFieldName: TotalWeightFieldName,
  formType: string | undefined
) => {
  const quantityOfProductCans = watch('packingResults.quantityOfProduct.cans');
  const finalTotalWeight = watch(totalWeightFieldName);
  const calculatedProduct = watch('packingResults.quantityOfProduct.calculated');

  const actualMultiplier = useMemo(() => {
    // ค่า Default 12 ถูกย้ายไปอยู่ในฟังก์ชัน determineCansMultiplier
    return determineCansMultiplier(formType, 12);
  }, [formType]); // คำนวณใหม่เมื่อ formType เปลี่ยน

  // คำนวณ Quantity of Product
  useEffect(() => {
    // 🔽 LOGGING: แสดงค่า input ก่อนคำนวณ
    console.log("--- 1. Quantity of Product Calculation ---");
    console.log("Input (Cans):", quantityOfProductCans);

    const cans = Number(quantityOfProductCans) || 0;
    // 4. ใช้ actualMultiplier แทนค่า 12 คงที่
    const calculated = cans * actualMultiplier;

    // 🔽 LOGGING: แสดงผลลัพธ์
    console.log(`Calculation: ${cans} * ${actualMultiplier} = ${calculated}`);
    console.log("Output (Calculated Product):", calculated > 0 ? calculated : null);

    setValue('packingResults.quantityOfProduct.calculated', calculated > 0 ? calculated : null);
  }, [quantityOfProductCans, setValue, actualMultiplier]); // 5. เพิ่ม actualMultiplier ใน dependencies

  useEffect(() => {
    // ... (Logic เดิม, ถูกต้อง) ...
    console.log("--- 2. Yield % Calculation ---");
    console.log("Inputs:");
    console.log(`  Calculated Product: ${calculatedProduct}`);
    console.log(` Final Total Weight (${totalWeightFieldName}): ${finalTotalWeight}`);

    const numFinalWeight = Number(finalTotalWeight) || 0;
    const numProduct = Number(calculatedProduct) || 0;

    if (numProduct === 0 || numFinalWeight === 0) {
      console.warn("Condition: Skip Yield % calculation because Product or Final Weight is 0 or invalid. Setting Yield % to null.");
      setValue('packingResults.yieldPercent', null);
    } else {
      const rawYield = (numProduct / numFinalWeight) * 100;

      console.log(`Calculation: (${numProduct} / ${numFinalWeight}) * 100 = ${rawYield}`);
      console.log(`Rounding: Applied toFixed(2) -> Result: ${rawYield.toFixed(2)}`);

      const yield2Decimal = Math.floor(rawYield * 100) / 100;

      //const formattedYield = formatNumberPreserve(yield2Decimal); ไม่ปัดเศษ
      const formattedYield = Number(yield2Decimal.toFixed(2));

      console.log(`Formatted Result: ${formattedYield}`);
      setValue('packingResults.yieldPercent', formattedYield as any);
    }
  }, [finalTotalWeight, calculatedProduct, setValue]);

  // 6. Return actualMultiplier เพื่อใช้ในการส่ง props
  return { actualMultiplier };
};

// 4. เปลี่ยนชื่อ Component และ props
const SharedFormStep4: React.FC<SharedFormStep4Props> = ({ register, watch, setValue, totalWeightFieldName, formType }) => {

  // 5. ส่งชื่อฟิลด์เข้าไปใน Hook
  const { actualMultiplier } = useStep4Calculations(watch, setValue, totalWeightFieldName, formType);

  // 6. ใช้ชื่อฟิลด์ในการดึงค่ามาแสดงผล
  const calculatedProductForDisplay = watch('packingResults.quantityOfProduct.calculated');
  const finalTotalWeightForDisplay = watch(totalWeightFieldName);

  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";

  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h4 className="font-medium text-white text-lg">Packing Result (กระบวนการบรรจุ Genmatsu)</h4>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <PackingResultTable
          register={register}
          watch={watch}
          setValue={setValue}
          cansMultiplier={actualMultiplier}
          formType={formType}
        />
        <div className="mb-6 overflow-x-auto">
          <table className="w-full table-auto">
            <tbody>
              <tr>
                <td className={tdLeftClass}>Yield :</td>
                <td className={tdCenterClass}>
                  ( <span className="font-medium text-primary">{calculatedProductForDisplay || '-'}</span> ÷
                  <span className="font-medium text-primary">{finalTotalWeightForDisplay || '-'}</span> )
                </td>
                <td className={tdCenterClass}>x 100%</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('packingResults.yieldPercent')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <PalletTable
        title="Pallet (พาเลท)"
        numberOfRows={6}
        register={register}
        fieldName="palletInfo"
      />
    </div>
  );
};

export default SharedFormStep4;