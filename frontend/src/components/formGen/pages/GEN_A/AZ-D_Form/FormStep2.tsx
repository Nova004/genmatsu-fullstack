// path: frontend/src/components/formGen/pages/GEN_A/AZ-D_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors, set } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
import apiClient from '../../../../../services/apiService';
import { useTemplateLoader } from '../../../../../hooks/useTemplateLoader';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../../hooks/useWeightCalculations';
import RawMaterialTableRows from '../../../components/forms/RawMaterialTableRows';
import { formatNumberRound } from '../../../../../utils/utils';
// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================


/**
 * 🚀 HOOK 3: จัดการการคำนวณตามสูตร Excel ที่มีความต่อเนื่องกันทั้งหมด
 */
export const useExcelFormulaCalculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- 1. "ดักฟัง" ค่าทั้งหมด ---
  const [
    net,
    sodiumChloride,
    remainedGenmatsu,
    activatedcarbon,
    prlite,
    sulfur,
    ncrGenmatsu,
  ] = watch([
    'rawMaterials.diaEarth',
    'rawMaterials.sodiumChloride',
    'rawMaterials.remainedGenmatsu.actual',
    'rawMaterials.activated',
    'rawMaterials.perlite',
    'rawMaterials.sulfur',
    'rawMaterials.ncrGenmatsu.actual',
  ]);

  useEffect(() => {
    // --- 2. แปลงค่าทั้งหมดเป็นตัวเลขและคำนวณผลรวม ---
    const total =
      (Number(net) || 0) +
      (Number(sodiumChloride) || 0) +
      (Number(activatedcarbon) || 0) +
      (Number(prlite) || 0) +
      (Number(sulfur) || 0) +
      (Number(remainedGenmatsu) || 0) +
      (Number(ncrGenmatsu) || 0);

    // --- 3. อัปเดตค่าไปยัง finalTotalWeight ---
    // ✅ แก้ไขตรงนี้: ลบ Number() ออก เพื่อให้ส่งค่าเป็นข้อความ "xxx.00"
    // (ถ้า total เป็น 0 จะได้ "0.00" แต่ถ้าอยากให้เป็นค่าว่างเมื่อเป็น 0 ให้ใช้เงื่อนไข total > 0)
    setValue('calculations.finalTotalWeight', total > 0 ? formatNumberRound(total) : null);

  }, [
    net,
    sodiumChloride,
    activatedcarbon,
    remainedGenmatsu,
    ncrGenmatsu,
    setValue,
  ]);
};

// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     MAIN COMPONENT (ส่วนแสดงผล)                
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================
interface FormStep2Props {
  register: any;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  onTemplateLoaded: (templateInfo: any) => void;
  staticBlueprint?: any; // Prop สำหรับรับพิมพ์เขียวเวอร์ชันเก่าโดยตรง
}

const as2WeightingConfig: WeightingCalculationConfig = {
  rows: [
    { grossWeightPath: 'cg1cWeighting.row1.cg1c', netWeightPath: 'cg1cWeighting.row1.net', bagWeightPath: 'cg1cWeighting.row1.bagWeight' },
    { grossWeightPath: 'cg1cWeighting.row2.cg1c', netWeightPath: 'cg1cWeighting.row2.net', bagWeightPath: 'cg1cWeighting.row2.bagWeight' },
  ],
  totalPath: 'cg1cWeighting.total',
  destinationPath: 'rawMaterials.diaEarth',
};

const FormStep2: React.FC<FormStep2Props> = ({
  register,
  watch,
  setValue,
  errors,
  onTemplateLoaded,
  staticBlueprint
}) => {

  const { fields, isLoading, error } = useTemplateLoader({
    templateName: 'AZ-D_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });




  // --- Logic 2: เรียกใช้ Custom Hooks ที่เราสร้างไว้ ---
  useWeightingCalculation(watch, setValue, as2WeightingConfig);
  useExcelFormulaCalculations(watch, setValue);


  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;
  const textareaClass = "w-full h-[50px] rounded-r-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

  // --- ฟังก์ชันสำหรับสร้าง Input Field พร้อม Validation ---


  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h5 className="font-medium text-white text-lg">Quantity of used raw material</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <div className="mb-6 overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className={`${thClass}`} colSpan={2}>Raw Material Name</th>
                <th className={thClass}>STD</th>
                <th className={thClass}>Actual Weight</th>
                <th className={thClass}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (<tr><td colSpan={5} className="text-center p-4">Loading Master Form...</td></tr>)}
              {error && (<tr><td colSpan={5} className="text-center p-4 text-red-500">{error}</td></tr>)}

              {/* 👇 2. เรียกใช้ Component ใหม่แค่บรรทัดเดียว! */}
              {!isLoading && !error && <RawMaterialTableRows fields={fields} register={register} errors={errors} />}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <tbody>
              <tr>
                <td className={tdLeftClass}>Iron Powder HGS InSIP 100.22 :Weight</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="number" className={inputClass} {...register('cg1cWeighting.row1.cg1c', { valueAsNumber: true, required: 'กรุณากรอก  Iron Powder' })} /><span className="ml-2">KG</span></div>
                  {errors.cg1cWeighting?.row1?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row1.cg1c.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Bag Weight</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagWeight')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row1.net')} /><span className="ml-2">KG</span></div></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Iron Powder HGS InSIP 100.22 :Weight</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="number" className={inputClass} {...register('cg1cWeighting.row2.cg1c', { valueAsNumber: true, required: 'กรุณากรอก  Iron Powder' })} /><span className="ml-2">KG</span></div>
                  {errors.cg1cWeighting?.row2?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row2.cg1c.message}
                    </p>
                  }
                </td>

                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>Bag Weight</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row2.bagWeight')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row2.net')} /><span className="ml-2">KG</span></div></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight :</td>
                <td className={tdLeftClass}> <div className="flex items-center"><input type="text" className={disabledInputClass} readOnly disabled {...register('calculations.finalTotalWeight')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass} colSpan={4} style={{ fontSize: 'small' }}>Total weight (Kg.)=.Iron Powder HGN 82.29.04+Sodium  Chloride+ Carbon A3+ Remained Genmatsu + Genmatsu AZ-R+Genmatsu NCR</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Remark (หมายเหตุ) :</td>
                <td className={tdLeftClass} colSpan={5}><textarea className={`${textareaClass} h-25`} {...register('qouRemark')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormStep2;