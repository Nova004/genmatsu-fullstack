// src/pages/BZ_Form/FormStep4.tsx

import React, { useEffect } from 'react';
import { FormStepProps, IManufacturingReportForm } from './types';
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
  const diameter = watch('packingResults.diameter');
  const meshPass40 = watch('packingResults.meshPass40');

  // --- คำนวณ Quantity of Product (10) ---
  useEffect(() => {
    const cans = Number(quantityOfProductCans) || 0;
    const calculated = cans * 12;
    setValue('packingResults.quantityOfProduct.calculated', calculated > 0 ? calculated : null);
  }, [quantityOfProductCans, setValue]);

  // --- คำนวณ Remain และ Yield % ---
  useEffect(() => {
    const numFinalWeight = Number(finalTotalWeight) || 0;
    const numDiameter = Number(diameter) || 0;
    const numMeshPass40 = Number(meshPass40) || 0;
    const calculatedProduct = watch('packingResults.quantityOfProduct.calculated');
    const numProduct = Number(calculatedProduct) || 0;

    const remain = numFinalWeight - numDiameter - numMeshPass40;
    setValue('packingResults.remain', remain > 0 ? Number(remain.toFixed(2)) : null);

    if (numProduct === 0 || numFinalWeight === 0) {
      setValue('packingResults.yieldPercent', null);
    } else {
      const yieldPercent = (numProduct / numFinalWeight) * 100;
      setValue('packingResults.yieldPercent', Number(yieldPercent.toFixed(2)));
    }
  }, [finalTotalWeight, diameter, meshPass40, watch, setValue]);
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
  const disabledInputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary bg-gray-2 dark:bg-meta-4 cursor-default";
  
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