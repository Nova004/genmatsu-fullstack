// frontend/src/components/formGen/components/forms/SharedFormStep4.tsx

import React, { useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';
import PalletTable from './PalletTable';
import PackingResultTable from './PackingResultTable_GENB';

// 1. สร้าง Type สำหรับชื่อฟิลด์ที่เราจะรับเข้ามา
type TotalWeightFieldName =
  | 'calculations.finalTotalWeight'
  | 'bz3Calculations.totalWeightWithNcr'
  | 'bs3Calculations.totalWeightWithNcr'
  | 'bz5cCalculations.totalWeightWithNcr'
  | 'bs5cCalculations.totalWeightWithNcr';

// 2. แก้ไข Interface ให้รับ prop ใหม่
interface SharedFormStep4Props {
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  totalWeightFieldName: TotalWeightFieldName; // Prop สำหรับรับชื่อฟิลด์
}

// Custom Hook สำหรับคำนวณ (ปรับให้รับชื่อฟิลด์เข้ามา)
const useStep4Calculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>,
  totalWeightFieldName: TotalWeightFieldName // รับชื่อฟิลด์
) => {
  const quantityOfProductCans = watch('packingResults.quantityOfProduct.cans');
  // 3. ใช้ชื่อฟิลด์ที่รับมาจาก prop ในการ watch ค่า
  const finalTotalWeight = watch(totalWeightFieldName);
  const calculatedProduct = watch('packingResults.quantityOfProduct.calculated');

  // คำนวณ Quantity of Product (เหมือนเดิม)
  useEffect(() => {
    const cans = Number(quantityOfProductCans) || 0;
    const calculated = cans * 12;
    setValue('packingResults.quantityOfProduct.calculated', calculated > 0 ? calculated : null);
  }, [quantityOfProductCans, setValue]);

  // คำนวณ Yield % (เหมือนเดิม)
  useEffect(() => {
    const numFinalWeight = Number(finalTotalWeight) || 0;
    const numProduct = Number(calculatedProduct) || 0;

    if (numProduct === 0 || numFinalWeight === 0) {
      setValue('packingResults.yieldPercent', null);
    } else {
      const yieldPercent = (numProduct / numFinalWeight) * 100;
      setValue('packingResults.yieldPercent', Number(yieldPercent.toFixed(2)));
    }
  }, [finalTotalWeight, calculatedProduct, setValue]);
};

// 4. เปลี่ยนชื่อ Component และ props
const SharedFormStep4: React.FC<SharedFormStep4Props> = ({ register, watch, setValue, totalWeightFieldName }) => {

  // 5. ส่งชื่อฟิลด์เข้าไปใน Hook
  useStep4Calculations(watch, setValue, totalWeightFieldName);

  // 6. ใช้ชื่อฟิลด์ในการดึงค่ามาแสดงผล
  const calculatedProductForDisplay = watch('packingResults.quantityOfProduct.calculated');
  const finalTotalWeightForDisplay = watch(totalWeightFieldName);

  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";

  return (
    <div>
      <div className="border-b-2 border-stroke py-4 text-center dark:border-strokedark">
        <h4 className="font-bold text-black dark:text-white">Packing Result / กระบวนการบรรจุ Genmatsu</h4>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <PackingResultTable
          register={register}
          watch={watch}
          setValue={setValue}
          cansMultiplier={12}
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
        <PalletTable
          title="Pallet (พาเลท)"
          numberOfRows={6}
          register={register}
          fieldName="palletInfo"
        />
      </div>
    </div>
  );
};

export default SharedFormStep4;