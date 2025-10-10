// src/pages/BS3_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../../hooks/useWeightCalculations';
import { useTemplateLoader } from '../../../../../hooks/useTemplateLoader';
import RawMaterialTableRows from '../../../components/forms/RawMaterialTableRows';

// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================


const useBS3Calculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- 1. ดักฟังค่า Input ทั้งหมดที่ผู้ใช้กรอก ---
  const rc417Total = watch('rc417Weighting.total');
  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const activatedCarbon = watch('rawMaterials.activatedcarbon');
  const GypsumPlaster = watch('rawMaterials.gypsumplaster');

  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const rc417WaterContent = watch('bs3Calculations.rc417WaterContent');
  const stdMeanMoisture = watch('bs3Calculations.stdMeanMoisture');
  const naclWater = watch('bs3Calculations.naclWater');
  const naclWaterSpecGrav = watch('bs3Calculations.naclWaterSpecGrav');

  // --- "ดักฟัง" ค่าที่ถูกคำนวณจากขั้นตอนก่อนหน้า ---
  const totalWeightOfMaterials = watch('bs3Calculations.totalWeightOfMaterials');


  useEffect(() => {
    // --- 2. เตรียมข้อมูล (แปลงค่า Input เป็นตัวเลข) ---
    const numRc417Total = Number(rc417Total) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numActivatedCarbon = Number(activatedCarbon) || 0;
    const numGypsumPlaster = Number(GypsumPlaster) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;


    // --- 3. เริ่มกระบวนการคำนวณตามลำดับ ---

    // ----- ขั้นตอน A: คำนวณ "Weight of RC-417 + Mg(OH)2 + Activated Carbon P-200U" -----
    const calculatedTotalMaterials = numRc417Total + numMagnesiumHydroxide + numActivatedCarbon + numGypsumPlaster;
    setValue('bs3Calculations.totalWeightOfMaterials', calculatedTotalMaterials > 0 ? calculatedTotalMaterials.toFixed(2) : null);

    // ----- ขั้นตอน B: คำนวณ "4% NaCl Water" (ค่าเริ่มต้น) -----
    let rawInitialNaclWater15: number | null = null;
    if (rc417WaterContent) {
      const Q21_decimal = (Number(rc417WaterContent) / 100) || 0;
      const Q20 = numRc417Total;
      const AD21 = calculatedTotalMaterials;
      const Q22_decimal = (Number(stdMeanMoisture) / 100) || 0;
      const O23_decimal = (Number(naclWater) / 100) || 0;

      const denominator = 1 - O23_decimal - Q22_decimal;
      if (denominator !== 0) {
        const numerator = (AD21 * Q22_decimal - Q20 * Q21_decimal);
        rawInitialNaclWater15 = (numerator / denominator) * O23_decimal;

      }
    }



    // ----- ขั้นตอน C: คำนวณค่ากลาง (Intermediate Value) -----
    let rawIntermediateWater: number | null = null;
    if (rawInitialNaclWater15 !== null) {
      const T24_raw = rawInitialNaclWater15;
      const O23_decimal_for_intermediate = (Number(naclWater) / 100) || 0;

      if (O23_decimal_for_intermediate !== 0) {
        rawIntermediateWater = (T24_raw / O23_decimal_for_intermediate) * (1 - O23_decimal_for_intermediate);
      }
    }

    // ----- ขั้นตอน D: คำนวณ "Total NaCl water" -----
    let totalNaclWaterResult: number | null = null;
    if (rc417WaterContent) {
      const T24_raw_final = rawInitialNaclWater15 || 0;
      const AD24_raw_final = rawIntermediateWater || 0;
      const rawResult = T24_raw_final + AD24_raw_final;
      totalNaclWaterResult = Number(rawResult.toFixed(2)); // ปัดเศษครั้งสุดท้ายที่นี่
    }
    setValue('bs3Calculations.totalNaclWater', totalNaclWaterResult);


    // ----- ขั้นตอน E: คำนวณค่าสุดท้ายของ "4% NaCl Water" และค่าที่เหลือ -----
    let finalNaclWater4Result: number | null = null;
    const W23 = Number(naclWaterSpecGrav) || 0;
    if (naclWaterSpecGrav && W23 !== 0) {
      const totalNaclForFinal = totalNaclWaterResult || 0; // ใช้ค่าที่เพิ่งคำนวณเสร็จ
      const rawResult = totalNaclForFinal / W23;
      finalNaclWater4Result = Number(rawResult.toFixed(0));
    }
    setValue('bs3Calculations.naclWater4', finalNaclWater4Result);
    setValue('rawMaterials.sodiumChloride', finalNaclWater4Result, { shouldValidate: true });
    // คำนวณ "(L/B)/20 min."
    const lminRate = (Number(finalNaclWater4Result) || 0) / 20;
    setValue('bs3Calculations.lminRate', lminRate > 0 ? lminRate.toFixed(0) : null);

    // คำนวณ "Total weight = NCR Genmatsu"
    let totalWeightWithNcrResult: number | null = null;
    if (totalNaclWaterResult !== null) {
      const AD21_final = calculatedTotalMaterials;
      const AD25_final = totalNaclWaterResult;
      const U14_final = numNcrGenmatsu;
      const rawResult = AD21_final + AD25_final + U14_final;
      totalWeightWithNcrResult = Number(rawResult.toFixed(2));
    }
    setValue('bs3Calculations.totalWeightWithNcr', totalWeightWithNcrResult);

  }, [
    rc417Total,
    magnesiumHydroxide,
    activatedCarbon,
    ncrGenmatsu,
    totalWeightOfMaterials,
    rc417WaterContent,
    stdMeanMoisture,
    naclWater,
    naclWaterSpecGrav,
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
  staticBlueprint?: any;
}

const bs3WeightingConfig: WeightingCalculationConfig = {
  rows: [
    { grossWeightPath: 'rc417Weighting.row1.weight', netWeightPath: 'rc417Weighting.row1.net', tare: 2 },
    { grossWeightPath: 'rc417Weighting.row2.weight', netWeightPath: 'rc417Weighting.row2.net', tare: 2 },
  ],
  totalPath: 'rc417Weighting.total',
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
    templateName: 'BS3_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });

  useWeightingCalculation(watch, setValue, bs3WeightingConfig);
  useBS3Calculations(watch, setValue);

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;



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
              {/* --- ส่วนที่ 1: การชั่งน้ำหนัก RC-417 --- */}
              <tr>
                <td className={tdLeftClass}>RC-417 : Weight</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('rc417Weighting.row1.weight', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('rc417Weighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Net Weight</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.row1.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>RC-417 : Weight</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('rc417Weighting.row2.weight', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('rc417Weighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>Net Weight</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.row2.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>RC-417 :Total Weight</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.total')} /></td>

                <td className={tdLeftClass}>Net Weight of Yield</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly value="800" /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>

              {/* --- ส่วนที่ 2: การคำนวณสำหรับ BS3 --- */}
              <tr>
                <td className={tdLeftClass}>RC-417: Water Content</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bs3Calculations.rc417WaterContent', { valueAsNumber: true })} value="2" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}> <span className="text-xs"> Weight of RC-417 + Mg(OH)<sub>2</sub> <br /> + Activated Carbon P-200U </span> </td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bs3Calculations.totalWeightOfMaterials')} /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Moisture Gen BS3 (STD mean.)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bs3Calculations.stdMeanMoisture', { valueAsNumber: true })} value="45.25" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl water =</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bs3Calculations.naclWater', { valueAsNumber: true })} value="4" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}>NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('bs3Calculations.naclWaterSpecGrav')} /></td>
                <td className={tdLeftClass}>Temperature</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('bs3Calculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>C°</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>4% NaCl Water</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} {...register('bs3Calculations.naclWater4', { valueAsNumber: true })} readOnly disabled /></td>
                <td className={tdLeftClass}>(L/B)/20 min. =</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bs3Calculations.lminRate')} /></td>
                <td className={tdLeftClass}>'L/min </td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total NaCl water=</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bs3Calculations.totalNaclWater', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg./B</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight = NCR Genmatsu =</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bs3Calculations.totalWeightWithNcr', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg. </td>
              </tr>

              {/* --- ส่วนที่ 3: หมายเหตุ --- */}
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