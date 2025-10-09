// src/pages/BZ_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../types';
import apiClient from '../../../../services/apiService';
import { useTemplateLoader } from '../../../../hooks/useTemplateLoader';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../hooks/useWeightCalculations';
import RawMaterialTableRows from '../../components/forms/RawMaterialTableRows';

// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================




/**
 * 🚀 HOOK 2: จัดการการค้นหาค่าจากตาราง NaCl Brewing แบบ Debounce
 */
const useNaclBrewingLookup = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  const cg1cWaterContent = watch('calculations.cg1cWaterContent');

  useEffect(() => {
    if (cg1cWaterContent === null || cg1cWaterContent === undefined || isNaN(cg1cWaterContent)) {
      setValue('calculations.naclBrewingTable', null);
      return;
    }

    const fetchBrewingValue = async () => {
      try {
        // ใช้ apiClient ที่วิ่งผ่าน Proxy
        const response = await apiClient.get(`/api/nacl/lookup/${cg1cWaterContent}`);
        const naclValue = response.data?.NaCl_NaCl_Water;
        setValue('calculations.naclBrewingTable', naclValue !== undefined ? naclValue : null);
      } catch (error) {
        console.error("NaCl lookup failed:", error);
        setValue('calculations.naclBrewingTable', null);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchBrewingValue(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [cg1cWaterContent, setValue]);
};


/**
 * 🚀 HOOK 3: จัดการการคำนวณตามสูตร Excel ที่มีความต่อเนื่องกันทั้งหมด
 */
export const useExcelFormulaCalculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- "ดักฟัง" ค่าทั้งหมดที่ต้องใช้ในสูตร ---
  const naclBrewingTable = watch('calculations.naclBrewingTable');
  const totalWeight = watch('cg1cWeighting.total');
  const naclSpecGrav = watch('calculations.nacl15SpecGrav');
  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const stdYield = 800;

  useEffect(() => {
    // --- แปลงค่าทั้งหมดเป็นตัวเลข ---
    const numNaclBrewingTable = Number(naclBrewingTable) || 0;
    const numTotalWeight = Number(totalWeight) || 0;
    const numNaclSpecGrav = Number(naclSpecGrav) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;


    // =================================================================
    // === 🔽 ส่วนที่แก้ไข: แยกการคำนวณตามที่คุณต้องการ 🔽 ===
    // =================================================================

    // --- คำนวณสูตรดั้งเดิมสำหรับ Sodium Chloride ---
    let sodiumChlorideResult: number | null = null;
    if (numNaclBrewingTable > 0 && stdYield > 0 && numNaclSpecGrav > 0) {
      // สูตร: (Q18 * Y20) / (Y18 * Q19)
      const rawResult = (numTotalWeight * numNaclBrewingTable) / (stdYield * numNaclSpecGrav);
      sodiumChlorideResult = Number(rawResult.toFixed(2));
    }
    // นำผลลัพธ์จากสูตรดั้งเดิมไปใส่ในช่อง Sodium Chloride
    setValue('rawMaterials.sodiumChloride', sodiumChlorideResult, { shouldValidate: true });


    // --- คำนวณสูตรที่ 1 & 2 (naclWaterCalc) ---
    // ส่วนนี้จะคำนวณค่า W23 เหมือนเดิม เพื่อใช้ในขั้นตอนถัดไป
    let naclWaterCalcResult: number | null = null;
    if (numNaclBrewingTable > 0 && stdYield > 0) {
      const rawResult = (numTotalWeight * numNaclBrewingTable) / stdYield;
      naclWaterCalcResult = Number(rawResult.toFixed(2));
    }
    setValue('calculations.naclWaterCalc', naclWaterCalcResult);

    // --- คำนวณสูตรที่ 3 (waterCalc) ---
    let waterCalcResult: number | null = null;
    if (naclWaterCalcResult !== null) {
      const rawResult = naclWaterCalcResult * 0.85;
      waterCalcResult = Number(rawResult.toFixed(2));
    }
    setValue('calculations.waterCalc', waterCalcResult);

    // --- คำนวณสูตรที่ 4 (saltCalc) ---
    let saltCalcResult: number | null = null;
    if (naclWaterCalcResult !== null) {
      const rawResult = naclWaterCalcResult * 0.15;
      saltCalcResult = Number(rawResult.toFixed(2));
    }
    setValue('calculations.saltCalc', saltCalcResult);

    // --- คำนวณสูตรที่ 5 (finalTotalWeight) ---
    let finalTotalWeight: number | null = null;
    if (totalWeight !== null && totalWeight !== undefined) {
      const total = numTotalWeight + (naclWaterCalcResult || 0) + numMagnesiumHydroxide + numNcrGenmatsu;
      finalTotalWeight = Number(total.toFixed(2));
    }
    setValue('calculations.finalTotalWeight', finalTotalWeight);

  }, [
    naclBrewingTable,
    totalWeight,
    naclSpecGrav,
    magnesiumHydroxide,
    ncrGenmatsu,
    setValue
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

const bzWeightingConfig: WeightingCalculationConfig = {
  rows: [
    { grossWeightPath: 'cg1cWeighting.row1.cg1c', netWeightPath: 'cg1cWeighting.row1.net', tare: 2 },
    { grossWeightPath: 'cg1cWeighting.row2.cg1c', netWeightPath: 'cg1cWeighting.row2.net', tare: 2 },
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
    templateName: 'BZ_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });




  // --- Logic 2: เรียกใช้ Custom Hooks ที่เราสร้างไว้ ---
  useWeightingCalculation(watch, setValue, bzWeightingConfig);
  useNaclBrewingLookup(watch, setValue);
  useExcelFormulaCalculations(watch, setValue);


  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  // --- ฟังก์ชันสำหรับสร้าง Input Field พร้อม Validation ---


  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Quantity of used raw material</h5>
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
                <td className={tdLeftClass}>CG-1C Weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('cg1cWeighting.row1.cg1c', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row1.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG-1C Weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('cg1cWeighting.row2.cg1c', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row2.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total Weight :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.total')} /></td>
                <td className={tdLeftClass}>Net Weight of Yieid (STD) :</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly value="800" /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="number" step="0.001" className={inputClass} {...register('calculations.nacl15SpecGrav', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG - 1C Water Content (Moisture)</td>
                <td className={tdLeftClass}><input type="number" step="0.01" className={inputClass} {...register('calculations.cg1cWaterContent', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Temperature (˚C)</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('calculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl brewing table</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclBrewingTable')} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NacCl Water Calculaion for finding water content</td>
                <td className={tdCenterClass}>(3*6)/4 =</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclWaterCalc')} /></td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Water (8) * 0.85</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.waterCalc')} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Salt (8) * 0.15</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.saltCalc')} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.finalTotalWeight')} /></td>
                <td className={tdLeftClass} colSpan={4} style={{ fontSize: 'small' }}>* Diatomaceous Earth (CG-1C) + (8) + Magnesium Hydroxide + Remained Genmatsu + NCR Genmatsu</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Remark (หมายเหตุ) :</td>
                <td className={tdLeftClass} colSpan={5}><textarea className={`${inputClass} h-25`} {...register('qouRemark')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormStep2;