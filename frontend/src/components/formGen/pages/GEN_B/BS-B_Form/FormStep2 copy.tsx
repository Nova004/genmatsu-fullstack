// src/pages/BS-B_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
import { useTemplateLoader } from '../../../../../hooks/useTemplateLoader';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../../hooks/useWeightCalculations';
import RawMaterialTableRows from '../../../components/forms/RawMaterialTableRows';
import useNaclBrewingLookup from '../../../../../hooks/useNaclBrewingLookup';
import { formatNumberRound } from '../../../../../utils/utils';
// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================




/**
 * 🚀 HOOK 2: จัดการการค้นหาค่าจากตาราง NaCl Brewing แบบ Debounce
 */


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
  const activatedcarbon = watch('rawMaterials.activatedcarbon');
  const gypsumplaster = watch('rawMaterials.gypsumplaster');


  const stdYield = 800; // ค่าคงที่

  useEffect(() => {
    // --- แปลงค่าทั้งหมดเป็นตัวเลข ---
    const numNaclBrewingTable = Number(naclBrewingTable) || 0;
    const numTotalWeight = Number(totalWeight) || 0;
    const numNaclSpecGrav = Number(naclSpecGrav) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;
    const numActivatedCarbon = Number(activatedcarbon) || 0;
    const numGypsumPlaster = Number(gypsumplaster) || 0;

    // ตัวแปรสำหรับเก็บผลลัพธ์ดิบ (Raw Result) ที่ไม่ปัดเศษ เพื่อใช้ในสูตรถัดไป
    let _rawNaclWaterCalcResult: number | null = null;

    // =================================================================
    // === 1. คำนวณ Sodium Chloride ===
    // =================================================================
    let sodiumChlorideResult: number | null = null;
    if (numNaclBrewingTable > 0 && stdYield > 0 && numNaclSpecGrav > 0) {
      // สูตร: (Q18 * Y20) / (Y18 * Q19)
      const rawResult = (numTotalWeight * numNaclBrewingTable) / (stdYield * numNaclSpecGrav);
      // ✅ ปัดเศษเฉพาะผลลัพธ์สุดท้ายนี้เพื่อแสดงผล
      sodiumChlorideResult = rawResult;
    }
    setValue('rawMaterials.sodiumChloride', formatNumberRound(sodiumChlorideResult) as any, { shouldValidate: true });


    // =================================================================
    // === 2. คำนวณ naclWaterCalc (W23) ===
    // =================================================================
    let naclWaterCalcResult: number | null = null;
    if (numNaclBrewingTable > 0 && stdYield > 0) {
      const rawResult = (numTotalWeight * numNaclBrewingTable) / stdYield;

      // ➡️ เก็บค่าดิบ (ไม่ปัดเศษ) ไว้ในตัวแปร _raw... สำหรับการคำนวณถัดไป
      _rawNaclWaterCalcResult = rawResult;

      // ✅ ปัดเศษเฉพาะผลลัพธ์ที่จะ setVaule (สำหรับการแสดงผล)
      naclWaterCalcResult = rawResult;
    }
    setValue('calculations.naclWaterCalc', formatNumberRound(naclWaterCalcResult)as any);


    // =================================================================
    // === 3. คำนวณ waterCalc (น้ำ) ===
    // =================================================================
    let waterCalcResult: number | null = null;
    // ➡️ ใช้ค่าดิบ (_rawNaclWaterCalcResult) ในการคำนวณ
    if (_rawNaclWaterCalcResult !== null) {
      const rawResult = _rawNaclWaterCalcResult * 0.85;
      // ✅ ปัดเศษเฉพาะผลลัพธ์สุดท้ายนี้เพื่อแสดงผล
      waterCalcResult = rawResult;
    }
    setValue('calculations.waterCalc', formatNumberRound(waterCalcResult) as any);


    // =================================================================
    // === 4. คำนวณ saltCalc (เกลือ) ===
    // =================================================================
    let saltCalcResult: number | null = null;
    // ➡️ ใช้ค่าดิบ (_rawNaclWaterCalcResult) ในการคำนวณ
    if (_rawNaclWaterCalcResult !== null) {
      const rawResult = _rawNaclWaterCalcResult * 0.15;
      // ✅ ปัดเศษเฉพาะผลลัพธ์สุดท้ายนี้เพื่อแสดงผล
      saltCalcResult = rawResult;
    }
    setValue('calculations.saltCalc', formatNumberRound(saltCalcResult) as any);


    // =================================================================
    // === 5. คำนวณ finalTotalWeight ===
    // =================================================================
    let finalTotalWeight: number | null = null;
    if (totalWeight !== null && totalWeight !== undefined) {
      // ➡️ ใช้ค่าดิบ (_rawNaclWaterCalcResult) ในการคำนวณ
      const naclWater = _rawNaclWaterCalcResult || 0;
      const total = numTotalWeight + naclWater + numMagnesiumHydroxide + numNcrGenmatsu + numActivatedCarbon + numGypsumPlaster;
      // ✅ ปัดเศษเฉพาะผลลัพธ์สุดท้ายนี้เพื่อแสดงผล
      finalTotalWeight = total;
    }
    setValue('calculations.finalTotalWeight', formatNumberRound(finalTotalWeight) as any);

  }, [
    naclBrewingTable,
    totalWeight,
    naclSpecGrav,
    magnesiumHydroxide,
    activatedcarbon,
    gypsumplaster,
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
    templateName: 'BS-B_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });




  // --- Logic 2: เรียกใช้ Custom Hooks ที่เราสร้างไว้ ---
  useWeightingCalculation(watch, setValue, bzWeightingConfig);
  useNaclBrewingLookup(watch, setValue, '4%');
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
                <td className={tdLeftClass}>CG-1C Weight</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={inputClass} {...register('cg1cWeighting.row1.cg1c', { valueAsNumber: true, required: 'กรุณากรอก CG-1C Weight ROW 1' })} /><span className="ml-2">KG</span></div>
                  {errors.cg1cWeighting?.row1?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row1.cg1c.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>BagWeight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagWeight')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass}>Net weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row1.net')} /><span className="ml-2">KG</span></div></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG-1C Weight</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" step="any" className={inputClass} {...register('cg1cWeighting.row2.cg1c', { valueAsNumber: true, required: 'กรุณากรอก CG-1C Weight ROW 2' })} /><span className="ml-2">KG</span></div>
                  {errors.cg1cWeighting?.row2?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row2.cg1c.message}
                    </p>
                  }
                </td>

                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>BagWeight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row2.bagWeight')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass}>Net weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row2.net')} /><span className="ml-2">KG</span></div></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total Weight :</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.total')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass}>Net Weight of Yieid (STD) :</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly value="800" /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>4% NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" step="0.001" className={inputClass} {...register('calculations.nacl15SpecGrav', { valueAsNumber: true, required: 'กรุณากรอก 4% NaCl Water Specific gravity' })} /><span className="ml-2">KG</span></div>
                  {errors.calculations?.nacl15SpecGrav &&
                    <p className="text-sm text-danger mt-1">
                      {errors.calculations.nacl15SpecGrav.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG - 1C Water Content (Moisture)</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" step="0.01" className={inputClass} {...register('calculations.cg1cWaterContent', { valueAsNumber: true, required: 'กรุณากรอก 15% CG - 1C Water Content (Moisture)' })} /><span className="ml-2">%</span></div>
                  {errors.calculations?.cg1cWaterContent &&
                    <p className="text-sm text-danger mt-1">
                      {errors.calculations.cg1cWaterContent.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Temperature</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" step="0.1" className={inputClass} {...register('calculations.temperature', { valueAsNumber: true })} /><span className="ml-2">(˚C)</span></div></td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl brewing table</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclBrewingTable')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NacCl Water Calculaion for finding water content</td>
                <td className={tdCenterClass}>(3*6)/4 =</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclWaterCalc')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Water (8) * 0.85</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.waterCalc')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Salt (8) * 0.15</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.saltCalc')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight :</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.finalTotalWeight')} /><span className="ml-2">KG</span></div></td>
                <td className={tdLeftClass} colSpan={4} style={{ fontSize: 'small' }}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Remark (หมายเหตุ) :</td>
                <td className={tdLeftClass} colSpan={5}><textarea className={`${inputClass} h-25`} {...register('qouRemark')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};

export default FormStep2;