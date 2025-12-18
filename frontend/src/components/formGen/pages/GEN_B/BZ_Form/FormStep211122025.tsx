// src/pages/BZ_Form/FormStep2.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
import apiClient from '../../../../../services/apiService';
import { useTemplateLoader } from '../../../../../hooks/useTemplateLoader';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../../hooks/useWeightCalculations';
import RawMaterialTableRows from '../../../components/forms/RawMaterialTableRows';
import useNaclBrewingLookup from '../../../../../hooks/useNaclBrewingLookup';

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
  // --- "ดักฟัง" ค่าทั้งหมดที่ต้องใช้ในสูตร ---
  const naclBrewingTable = watch('calculations.naclBrewingTable');
  const totalWeight = watch('cg1cWeighting.total');
  const naclSpecGrav = watch('calculations.nacl15SpecGrav');
  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const stdYield = 800; // ค่าคงที่

  useEffect(() => {
    console.groupCollapsed('📊 START: Excel Formula Calculations (ใช้ค่าดิบ)'); // เริ่ม Log Group

    // --- แปลงค่าทั้งหมดเป็นตัวเลข ---
    const numNaclBrewingTable = Number(naclBrewingTable) || 0;
    const numTotalWeight = Number(totalWeight) || 0;
    const numNaclSpecGrav = Number(naclSpecGrav) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;

    // Log: ค่า Input ที่ใช้
    console.log('--- Input Values (ค่าที่ดึงมาจาก Form) ---');
    console.log(`[Y20] NaCl Table Value: ${numNaclBrewingTable}`);
    console.log(`[Q18] Total Weight: ${numTotalWeight}`);
    console.log(`[Q19] NaCl Spec Grav: ${numNaclSpecGrav}`);
    console.log(`[Y18] Std Yield (Fixed): ${stdYield}`);
    console.log(`Magnesium Hydroxide: ${numMagnesiumHydroxide}`);
    console.log(`NCR Genmatsu: ${numNcrGenmatsu}`);
    console.log('-------------------------------------------');

    // ตัวแปรสำหรับเก็บค่าดิบ (Unrounded Value)
    let _rawNaclWaterCalc: number | null = null;

    // =================================================================
    // === 1. คำนวณ Sodium Chloride ===
    // =================================================================
    let sodiumChlorideResult: number | null = null;
    if (numNaclBrewingTable > 0 && numTotalWeight > 0 && numNaclSpecGrav > 0) {
      // สูตร: (Q18 * Y20) / (Y18 * Q19)
      const numerator = numTotalWeight * numNaclBrewingTable;
      const denominator = stdYield * numNaclSpecGrav;
      const rawResult = numerator / denominator;
      sodiumChlorideResult = Number(rawResult.toFixed(2)); // ปัดเศษเฉพาะผลลัพธ์สุดท้าย

      console.log('--- 1. Sodium Chloride ---');
      console.log(`Formula: (${numTotalWeight} * ${numNaclBrewingTable}) / (${stdYield} * ${numNaclSpecGrav})`);
      console.log(`Raw Result: ${rawResult}`);
      console.log(`✅ SET: rawMaterials.sodiumChloride = ${sodiumChlorideResult}`);
      setValue('rawMaterials.sodiumChloride', sodiumChlorideResult, { shouldValidate: true });
    } else {
      console.log('--- 1. Sodium Chloride --- (Skip: Input values are zero/null)');
      setValue('rawMaterials.sodiumChloride', null, { shouldValidate: true });
    }


    // =================================================================
    // === 2. คำนวณ naclWaterCalc (ค่า NaCl + Water - W23) ===
    // =================================================================
    let naclWaterCalcResult: number | null = null;

    if (numNaclBrewingTable > 0 && numTotalWeight > 0) {
      // สูตร: (Q18 * Y20) / Y18
      const rawResult = (numTotalWeight * numNaclBrewingTable) / stdYield;
      _rawNaclWaterCalc = rawResult; // 🔴 เก็บค่าดิบ (Unrounded) ไว้ใช้ในขั้นตอน 3, 4, 5
      naclWaterCalcResult = Number(rawResult.toFixed(2)); // ปัดเศษเพื่อแสดงผลเท่านั้น
      setValue('calculations.naclWaterCalc', naclWaterCalcResult, { shouldValidate: true });
      console.log('--- 2. naclWaterCalc (W23) ---');
      console.log(`Formula: (${numTotalWeight} * ${numNaclBrewingTable}) / ${stdYield}`);
      console.log(`➡️ ค่าดิบที่ถูกส่งต่อไป: ${_rawNaclWaterCalc}`);
      console.log(`✅ SET: calculations.naclWaterCalc = ${naclWaterCalcResult}`);
    } else {
      console.log('--- 2. naclWaterCalc (W23) --- (Skip: Input values are zero/null)');
      setValue('calculations.naclWaterCalc', null);
    }

    // =================================================================
    // === 3. คำนวณ waterCalc (น้ำ) ===
    // =================================================================
    let waterCalcResult: number | null = null;
    // 🔴 ใช้ _rawNaclWaterCalc ในการคำนวณ
    if (_rawNaclWaterCalc !== null) {
      // สูตร: W23 (ค่าดิบ) * 0.85
      const rawResult = _rawNaclWaterCalc * 0.85;
      waterCalcResult = Number(rawResult.toFixed(2)); // ปัดเศษเฉพาะผลลัพธ์สุดท้าย
      setValue('calculations.waterCalc', waterCalcResult, { shouldValidate: true });
      console.log('--- 3. waterCalc (น้ำ) ---');
      console.log(`Formula: ${_rawNaclWaterCalc} (Raw) * 0.85`);
      console.log(`Raw Result: ${rawResult}`);
      console.log(`✅ SET: calculations.waterCalc = ${waterCalcResult}`);
    } else {
      setValue('calculations.waterCalc', null);
    }

    // =================================================================
    // === 4. คำนวณ saltCalc (เกลือบริสุทธิ์) ===
    // =================================================================
    let saltCalcResult: number | null = null;
    // 🔴 ใช้ _rawNaclWaterCalc ในการคำนวณ
    if (_rawNaclWaterCalc !== null) {
      // สูตร: W23 (ค่าดิบ) * 0.15
      const rawResult = _rawNaclWaterCalc * 0.15;
      saltCalcResult = Number(rawResult.toFixed(2)); // ปัดเศษเฉพาะผลลัพธ์สุดท้าย

      console.log('--- 4. saltCalc (เกลือ) ---');
      console.log(`Formula: ${_rawNaclWaterCalc} (Raw) * 0.15`);
      console.log(`Raw Result: ${rawResult}`);
      console.log(`✅ SET: calculations.saltCalc = ${saltCalcResult}`);
      setValue('calculations.saltCalc', saltCalcResult, { shouldValidate: true });
    } else {
      setValue('calculations.saltCalc', null);
    }

    // =================================================================
    // === 5. คำนวณ finalTotalWeight (น้ำหนักรวมสุดท้าย) ===
    // =================================================================
    let finalTotalWeight: number | null = null;
    // 🔴 ใช้ค่าดิบ (Unrounded) ในการรวมน้ำหนัก
    const naclWaterRaw = _rawNaclWaterCalc || 0;

    // รวบรวมน้ำหนักทั้งหมด
    const total = numTotalWeight + naclWaterRaw + numMagnesiumHydroxide + numNcrGenmatsu;

    if (total > 0) {
      finalTotalWeight = Number(total.toFixed(2)); // ปัดเศษเฉพาะผลลัพธ์สุดท้าย
      setValue('calculations.finalTotalWeight', finalTotalWeight); // ⬅️ ต้อง setValue ด้วย

      console.log('--- 5. finalTotalWeight (น้ำหนักรวมสุดท้าย) ---');
      console.log(`Sum: ${numTotalWeight} + ${naclWaterRaw} (NaCl+Water Raw) + ${numMagnesiumHydroxide} + ${numNcrGenmatsu}`);
      console.log(`Raw Total: ${total}`);
      console.log(`✅ SET: calculations.finalTotalWeight = ${finalTotalWeight}`);
    } else {
      console.log('--- 5. finalTotalWeight --- (Skip: Total sum is zero)');
      setValue('calculations.finalTotalWeight', null);
    }

    console.groupEnd(); // สิ้นสุด Log Group
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
    templateName: 'BZ_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });


  const rawNaclBrewingTableValue = watch('calculations.naclBrewingTable'); // ดักฟังค่า NaCl Brewing Table เพื่อแสดงผลแบบปัดเศษใน Input Field

  // --- Logic 2: เรียกใช้ Custom Hooks ที่เราสร้างไว้ ---
  useWeightingCalculation(watch, setValue, bzWeightingConfig);
  useNaclBrewingLookup(watch, setValue, '15%');
  useExcelFormulaCalculations(watch, setValue);


  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  const naclTableValueToDisplay = useMemo(() => {
    const num = Number(rawNaclBrewingTableValue);
    return rawNaclBrewingTableValue !== null && rawNaclBrewingTableValue !== undefined && !isNaN(num)
      ? num.toFixed(4)
      : '';
  }, [rawNaclBrewingTableValue]);


  // 🔴 2. ดึง Prop ที่จำเป็นสำหรับการ register ออกมา (เพื่อหลีกเลี่ยง conflict กับ value)
  const naclBrewingTableProps = register('calculations.naclBrewingTable');

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
                <td className={tdLeftClass}>CG-1C Weight (KG) :</td>
                <td className={tdLeftClass}>  <input type="number" className={inputClass} {...register('cg1cWeighting.row1.cg1c', { valueAsNumber: true, required: 'กรุณากรอก CG-1C Weight ROW 1' })} />
                  {errors.cg1cWeighting?.row1?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row1.cg1c.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Bag Weight</td>
                <td className={tdLeftClass}><input type="number" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagWeight')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row1.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG-1C Weight (KG) :</td>
                <td className={tdLeftClass}>  <input type="number" step="any" className={inputClass} {...register('cg1cWeighting.row2.cg1c', { valueAsNumber: true, required: 'กรุณากรอก CG-1C Weight ROW 2' })} />
                  {errors.cg1cWeighting?.row2?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row2.cg1c.message}
                    </p>
                  }
                </td>

                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>Bag Weight</td>
                <td className={tdLeftClass}><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row2.bagWeight')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row2.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total Weight :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.total')} /></td>
                <td className={tdLeftClass}>Net Weight of Yieid (STD) :</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly value="800" /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="number" step="0.001" className={inputClass} {...register('calculations.nacl15SpecGrav', { valueAsNumber: true, required: 'กรุณากรอก 15% NaCl Water Specific gravity' })} />
                  {errors.calculations?.nacl15SpecGrav &&
                    <p className="text-sm text-danger mt-1">
                      {errors.calculations.nacl15SpecGrav.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Temperature (˚C)</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('calculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG - 1C Water Content (Moisture)</td>
                <td className={tdLeftClass}><input type="number" step="0.01" className={inputClass} {...register('calculations.cg1cWaterContent', { valueAsNumber: true, required: 'กรุณากรอก 15% CG - 1C Water Content (Moisture)' })} />
                  {errors.calculations?.cg1cWaterContent &&
                    <p className="text-sm text-danger mt-1">
                      {errors.calculations.cg1cWaterContent.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>NaCl brewing table</td>
                <td className={tdLeftClass}> {/* 💡 ห่อ Input ด้วย td ที่ถูกต้อง */}
                  <input
                    type="text"
                    className={disabledInputClass}
                    readOnly
                    disabled
                    // ⬅️ Prop RHF
                    {...naclBrewingTableProps}
                    // ⬅️ Prop Value ที่ต้องการปัดเศษ (จะทับ Prop value ที่มาจาก RHF)
                    value={naclTableValueToDisplay}
                  />
                </td>
                <td className={tdLeftClass} colSpan={5}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NacCl Water Calculaion for finding water content </td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('rawMaterials.sodiumChloride')} /></td>
                <td className={tdLeftClass} colSpan={5}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NacCl Water Calculaion for finding water content</td>
                <td className={tdCenterClass}>⑦ X ⑤=</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclWaterCalc')} /></td>
                <td className={tdLeftClass} colSpan={7}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Water (8) * 0.85</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.waterCalc')} /></td>
                <td className={tdLeftClass} colSpan={7}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Salt (8) * 0.15</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.saltCalc')} /></td>
                <td className={tdLeftClass} colSpan={7}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.finalTotalWeight')} /></td>
                <td className={tdLeftClass} colSpan={7} style={{ fontSize: 'small' }}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Remark (หมายเหตุ) :</td>
                <td className={tdLeftClass} colSpan={7}><textarea className={`${inputClass} h-25`} {...register('qouRemark')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};

export default FormStep2;