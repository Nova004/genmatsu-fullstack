// src/pages/BZ_Form/FormStep4.tsx

import React from 'react';
import { FormStepProps } from './types';
import PalletTable from '../../components/forms/PalletTable'; // 1. Import Component ใหม่เข้ามา

const FormStep4: React.FC<FormStepProps> = ({ register }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} bg-gray-2 dark:bg-meta-4 cursor-default`;
  
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  return (
    <div>
      <div className="border-b-2 border-stroke py-4 text-center dark:border-strokedark">
        <h4 className="font-bold text-black dark:text-white">Packing Result / กระบวนการบรรจุ Genmatsu</h4>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        
        {/* --- ตาราง Packing Result --- */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full table-auto">
            <tbody>
              <tr>
                <td className={tdLeftClass} colSpan={2}>Ø 3*5 P on</td>
                <td className={tdCenterClass}><input type="number" className={inputClass} {...register('packingResults.diameter', { valueAsNumber: true })} /></td>
                <td className={tdCenterClass}>KG</td>
                <td className={tdCenterClass}></td>
                <td className={tdCenterClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass} colSpan={2}>Quantity of Product</td>
                <td className={tdCenterClass}><input type="number" className={inputClass} {...register('packingResults.quantityOfProduct.cans', { valueAsNumber: true })} /></td>
                <td className={tdCenterClass}>Cans x 12</td>
                <td className={tdCenterClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('packingResults.quantityOfProduct.calculated')} /></td>
                <td className={tdCenterClass}>(10)</td>
              </tr>
              <tr>
                <td className={tdLeftClass} colSpan={2}>40 mesh Pass</td>
                <td className={tdCenterClass}><input type="number" className={inputClass} {...register('packingResults.meshPass40', { valueAsNumber: true })} /></td>
                <td className={tdCenterClass}>KG</td>
                <td className={tdCenterClass}></td>
                <td className={tdCenterClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass} colSpan={2}>Remain</td>
                <td className={tdCenterClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('packingResults.remain')} /></td>
                <td className={tdCenterClass}>KG</td>
                <td className={tdCenterClass}></td>
                <td className={tdCenterClass}></td>
              </tr>
            </tbody>
          </table>
        </div>
        
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

        {/* --- 2. เรียกใช้งาน PalletTable Component --- */}
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