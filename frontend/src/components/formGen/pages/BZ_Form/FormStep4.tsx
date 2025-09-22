// src/pages/BZ_Form/FormStep4.tsx

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormStepProps, IManufacturingReportForm } from './types';
import PalletTable from '../../components/forms/PalletTable';
import PackingResultTable from '../../components/forms/PackingResultTable';


interface FormStep4Props extends FormStepProps {
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
}

const FormStep4: React.FC<FormStep4Props> = ({ register, watch, setValue }) => {
  // --- ส่วนจัดการ Class ของ UI (สามารถลบทิ้งได้ถ้าไม่ใช้ที่อื่นแล้ว) ---
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

        {/* --- 2. เรียกใช้งาน PackingResultTable Component --- */}
        <PackingResultTable
          register={register}
          watch={watch}
          setValue={setValue}
          cansMultiplier={12} // ส่งค่าตัวคูณเป็น 12
        />

        {/* --- ตาราง Yield --- */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full table-auto">
            <tbody>
              <tr>
                <td className={tdLeftClass}>Yield :</td>
                <td className={tdCenterClass}>(10) ÷ (9)</td>
                <td className={tdCenterClass}>x 100%</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('packingResults.yieldPercent')} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- เรียกใช้งาน PalletTable Component --- */}
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