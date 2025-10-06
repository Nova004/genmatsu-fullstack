// src/pages/BZ3_Form/FormStep4.tsx

import React, { useEffect } from 'react';
import { FormStepProps, IManufacturingReportForm } from '../types';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import PalletTable from '../../components/forms/PalletTable';
import PackingResultTable from '../../components/forms/PackingResultTable';

// =================================================================
// 🚀 CUSTOM HOOK: สำหรับจัดการการคำนวณใน Step 4
// =================================================================
const useStep4Calculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- "ดักฟัง" ค่าที่ต้องใช้ ---
  const quantityOfProductCans = watch('packingResults.quantityOfProduct.cans');
  const finalTotalWeight = watch('calculations.finalTotalWeight'); // (9) จาก Step 2
  const calculatedProduct = watch('packingResults.quantityOfProduct.calculated');

  // --- คำนวณ Quantity of Product (10) ---
  useEffect(() => {
    const cans = Number(quantityOfProductCans) || 0;
    const calculated = cans * 12;
    setValue('packingResults.quantityOfProduct.calculated', calculated > 0 ? calculated : null);
  }, [quantityOfProductCans, setValue]);

  // --- คำนวณ Remain และ Yield % ---
  useEffect(() => {
    const numFinalWeight = Number(finalTotalWeight) || 0;
    const numProduct = Number(calculatedProduct) || 0;

    if (numProduct === 0 || numFinalWeight === 0) {
      setValue('packingResults.yieldPercent', null);
    } else {
      const yieldPercent = (numProduct / numFinalWeight) * 100;
      setValue('packingResults.yieldPercent', Number(yieldPercent.toFixed(2)));
    }
  }, [finalTotalWeight, calculatedProduct, watch, setValue]);
};


// =================================================================
// ✨ COMPONENT หลัก
// =================================================================
interface FormStep4Props extends FormStepProps {
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
}

const FormStep4: React.FC<FormStep4Props> = ({ register, watch, setValue }) => {

  useStep4Calculations(watch, setValue);

  const calculatedProductForDisplay = watch('packingResults.quantityOfProduct.calculated'); // (10)
  const finalTotalWeightForDisplay = watch('calculations.finalTotalWeight');      // (9)


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
          cansMultiplier={12} // ส่งค่าตัวคูณเป็น 12
        />

        {/* --- ตาราง Yield (ฉบับปรับปรุง) --- */}
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

export default FormStep4;