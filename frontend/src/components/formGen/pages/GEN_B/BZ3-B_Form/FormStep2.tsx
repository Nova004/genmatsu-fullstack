// src/pages/BZ3-B_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
import { useTemplateLoader } from '../../../../../hooks/useTemplateLoader';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../../hooks/useWeightCalculations';
import RawMaterialTableRows from '../../../components/forms/RawMaterialTableRows';

// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================


export const useBZ3_BCalculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- 1. ดักฟังค่า Input ทั้งหมดที่ผู้ใช้กรอก ---
  const rc417Total = watch('rc417Weighting.total');
  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const activatedCarbon = watch('rawMaterials.activatedcarbon');
  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const rc417WaterContent = watch('bz3Calculations.rc417WaterContent');
  const naclWaterSpecGrav = watch('bz3Calculations.naclWaterSpecGrav');

  // --- ค่าคงที่ ---
  const stdMeanMoisture = 39.50;
  const naclWater = 15;

  // --- "ดักฟัง" ค่าที่ถูกคำนวณจากขั้นตอนก่อนหน้า ---
  const totalWeightOfMaterials = watch('bz3Calculations.totalWeightOfMaterials');


  useEffect(() => {
    console.groupCollapsed('🧪 START: BZ3/B Calculations'); // เริ่ม Log Group

    // --- 2. เตรียมข้อมูล (แปลงค่า Input เป็นตัวเลข) ---
    const numRc417Total = Number(rc417Total) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numActivatedCarbon = Number(activatedCarbon) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;
    const numNaclWaterSpecGrav = Number(naclWaterSpecGrav) || 0;

    // --- 3. เริ่มกระบวนการคำนวณตามลำดับ ---

    // ----- ขั้นตอน A: คำนวณ "Weight of RC-417 + Mg(OH)2 + Activated Carbon P-200U" -----
    const calculatedTotalMaterials = numRc417Total + numMagnesiumHydroxide + numActivatedCarbon;

    console.log('--- A. Total Materials Weight ---');
    console.log(`Formula: ${numRc417Total} (RC-417 Total) + ${numMagnesiumHydroxide} (Mg(OH)2) + ${numActivatedCarbon} (Activated Carbon)`);
    console.log(`Raw Result (AD21): ${calculatedTotalMaterials}`);

    if (calculatedTotalMaterials === 0) {
      console.log('--- A. Total Materials Weight --- (Skip: Total Input is zero)');
      // ถ้าไม่มี Input, ให้ Set ทุกอย่างเป็น null แล้วหยุด
      setValue('bz3Calculations.totalWeightOfMaterials', null);
      setValue('bz3Calculations.totalNaclWater', null);
      setValue('bz3Calculations.naclWater15', null);
      setValue('rawMaterials.sodiumChloride', null, { shouldValidate: true });
      setValue('bz3Calculations.lminRate', null);
      setValue('bz3Calculations.totalWeightWithNcr', null);
      console.groupEnd();
      return; // 👈 หยุดการทำงานของ useEffect ทันที
    }

    setValue('bz3Calculations.totalWeightOfMaterials', calculatedTotalMaterials > 0 ? calculatedTotalMaterials.toFixed(2) : null);
    console.log(`✅ SET: bz3Calculations.totalWeightOfMaterials = ${calculatedTotalMaterials.toFixed(2)}`);


    // ----- ขั้นตอน B: คำนวณ "15% NaCl Water" (ค่าเริ่มต้น/T24) -----
    let rawInitialNaclWater15: number | null = null;
    let Q21_decimal = 0;
    let Q22_decimal = 0;
    let O23_decimal = 0;

    if (rc417WaterContent) {
      Q21_decimal = (Number(rc417WaterContent) / 100) || 0; // Water Content (Decimal)
      Q22_decimal = (Number(stdMeanMoisture) / 100) || 0; // Std Moisture (Decimal)
      O23_decimal = (Number(naclWater) / 100) || 0; // 15% NaCl (Decimal)

      const Q20 = numRc417Total; // RC-417 Total
      const AD21 = calculatedTotalMaterials; // Total Materials

      const denominator = 1 - O23_decimal - Q22_decimal;
      if (denominator !== 0) {
        // สูตร: ((AD21 * Q22_decimal - Q20 * Q21_decimal) / (1 - O23_decimal - Q22_decimal)) * O23_decimal
        const numerator = (AD21 * Q22_decimal - Q20 * Q21_decimal);
        rawInitialNaclWater15 = (numerator / denominator) * O23_decimal;
      }
    }

    console.log('--- B. Initial 15% NaCl Water (T24) ---');
    console.log(`Input Decimals: RC417 Moisture: ${Q21_decimal}, Std Moisture: ${Q22_decimal}, NaCl %: ${O23_decimal}`);
    console.log(`Denominator: 1 - ${O23_decimal} - ${Q22_decimal} = ${1 - O23_decimal - Q22_decimal}`);
    console.log(`Numerator: (${calculatedTotalMaterials} * ${Q22_decimal}) - (${numRc417Total} * ${Q21_decimal}) = ${(calculatedTotalMaterials * Q22_decimal - numRc417Total * Q21_decimal)}`);
    console.log(`Raw Result (T24): ${rawInitialNaclWater15}`);


    // ----- ขั้นตอน C: คำนวณค่ากลาง (Intermediate Water / AD24) -----
    let rawIntermediateWater: number | null = null;
    if (rawInitialNaclWater15 !== null) {
      const T24_raw = rawInitialNaclWater15;
      // 1 - O23_decimal คือ ส่วนที่ไม่ใช่ NaCl (คือ Water)
      const waterRatio = 1 - O23_decimal;

      if (O23_decimal !== 0) {
        // สูตร: (T24_raw / O23_decimal) * (1 - O23_decimal)
        rawIntermediateWater = (T24_raw / O23_decimal) * waterRatio;
      }

      console.log('--- C. Intermediate Water (AD24) ---');
      console.log(`Formula: (${T24_raw} / ${O23_decimal}) * ${waterRatio}`);
      console.log(`Raw Result (AD24): ${rawIntermediateWater}`);
    }

    // ----- ขั้นตอน D: คำนวณ "Total NaCl Water" (T24 + AD24) -----
    let totalNaclWaterResult: number | null = null;
    if (rawInitialNaclWater15 !== null && rawIntermediateWater !== null) {
      const T24_raw_final = rawInitialNaclWater15;
      const AD24_raw_final = rawIntermediateWater;
      const rawResult = T24_raw_final + AD24_raw_final; // ผลรวมของ NaCl + Water

      // 🔴 ใช้ค่าดิบ rawResult ในการคำนวณต่อเนื่อง (แม้ว่าที่นี่จะไม่มีต่อเนื่อง แต่เป็นหลักการที่ดี)
      totalNaclWaterResult = Number(rawResult.toFixed(2));

      console.log('--- D. Total NaCl Water (T24 + AD24) ---');
      console.log(`Formula: ${T24_raw_final} (T24 Raw) + ${AD24_raw_final} (AD24 Raw)`);
      console.log(`Raw Sum: ${rawResult}`);
      console.log(`✅ SET: bz3Calculations.totalNaclWater = ${totalNaclWaterResult}`);
      setValue('bz3Calculations.totalNaclWater', totalNaclWaterResult);

    } else {
      setValue('bz3Calculations.totalNaclWater', null);
    }

    // ----- ขั้นตอน E: คำนวณค่าสุดท้ายของ "15% NaCl Water" (V25) และค่าที่เหลือ -----
    let finalNaclWater15Result: number | null = null;
    if (totalNaclWaterResult !== null) {
      if (numNaclWaterSpecGrav && numNaclWaterSpecGrav !== 0) {
        const totalNaclForFinal = totalNaclWaterResult; // ใช้ค่าที่เพิ่งคำนวณเสร็จ (Total NaCl Water)
        // สูตร: (Total NaCl Water) / Specific Gravity
        const rawResult = totalNaclForFinal / numNaclWaterSpecGrav;
        finalNaclWater15Result = Number(rawResult.toFixed(1));
      } else if (numNaclWaterSpecGrav === 0) {
        // ถ้า Spec Grav เป็น 0 ให้ผลลัพธ์เป็น null
        finalNaclWater15Result = null;
      }

      console.log('--- E. Final 15% NaCl Water (V25) ---');
      console.log(`Formula: ${totalNaclWaterResult} (Total NaCl Water) / ${numNaclWaterSpecGrav} (Spec Grav)`);
      console.log(`Raw Result: ${totalNaclWaterResult / numNaclWaterSpecGrav}`);
      console.log(`✅ SET: bz3Calculations.naclWater15 = ${finalNaclWater15Result}`);

      // ตั้งค่า Sodium Chloride และ L/min Rate
      setValue('bz3Calculations.naclWater15', finalNaclWater15Result);
      setValue('rawMaterials.sodiumChloride', finalNaclWater15Result, { shouldValidate: true });

      // คำนวณ "(L/B)/20 min." (L/min Rate)
      const lminRate = (finalNaclWater15Result || 0) / 20;
      setValue('bz3Calculations.lminRate', lminRate > 0 ? lminRate.toFixed(0) : null);
      console.log(`✅ SET: bz3Calculations.lminRate = (${finalNaclWater15Result} / 20) -> ${lminRate > 0 ? lminRate.toFixed(0) : null}`);

    } else {
      setValue('bz3Calculations.naclWater15', null);
      setValue('rawMaterials.sodiumChloride', null, { shouldValidate: true });
      setValue('bz3Calculations.lminRate', null);
    }

    // ----- ขั้นตอน F: คำนวณ "Total weight = NCR Genmatsu" -----
    let totalWeightWithNcrResult: number | null = null;

    if (totalNaclWaterResult !== null) {
      const AD21_final = calculatedTotalMaterials;
      const AD25_final = totalNaclWaterResult;
      const U14_final = numNcrGenmatsu;
      // สูตร: AD21 + AD25 + U14
      const rawResult = AD21_final + AD25_final + U14_final;
      totalWeightWithNcrResult = Number(rawResult.toFixed(2));

      console.log('--- F. Total Weight with NCR ---');
      console.log(`Sum: ${AD21_final} (Total Materials) + ${AD25_final} (Total NaCl Water) + ${U14_final} (NCR Genmatsu)`);
      console.log(`Raw Result: ${rawResult}`);
      console.log(`✅ SET: bz3Calculations.totalWeightWithNcr = ${totalWeightWithNcrResult}`);

      setValue('bz3Calculations.totalWeightWithNcr', totalWeightWithNcrResult);

    } else {
      console.log('--- F. Total Weight with NCR --- (Skip: Total NaCl Water is null)');
      setValue('bz3Calculations.totalWeightWithNcr', null);
    }

    console.groupEnd(); // สิ้นสุด Log Group
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

const bz3WeightingConfig: WeightingCalculationConfig = {
  rows: [
    { grossWeightPath: 'rc417Weighting.row1.weight', netWeightPath: 'rc417Weighting.row1.net', tare: 3 },
    { grossWeightPath: 'rc417Weighting.row2.weight', netWeightPath: 'rc417Weighting.row2.net', tare: 3 },
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
    templateName: 'BZ3-B_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });

  useWeightingCalculation(watch, setValue, bz3WeightingConfig);
  useBZ3_BCalculations(watch, setValue);

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;




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
              {/* --- ส่วนที่ 1: การชั่งน้ำหนัก RC-417 --- */}
              <tr>
                <td className={tdLeftClass}>RC-417 : Weight</td>
                <td className={tdLeftClass}><input type="number" step="0.001" className={inputClass} {...register('rc417Weighting.row1.weight', { valueAsNumber: true, required: 'กรุณากรอก RC-417 : Weight' })} /></td>
                {errors.rc417Weighting?.row1?.weight &&
                  <p className="text-sm text-danger mt-1">
                    {errors.rc417Weighting.row1.weight.message}
                  </p>
                }
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('rc417Weighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Net Weight</td>
                <td className={tdLeftClass}><input type="number" step="0.001" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.row1.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>RC-417 : Weight</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('rc417Weighting.row2.weight', { valueAsNumber: true, required: 'กรุณากรอก RC-417 : Weight' })} />
                  {errors.rc417Weighting?.row2?.weight &&
                    <p className="text-sm text-danger mt-1">
                      {errors.rc417Weighting.row2.weight.message}
                    </p>
                  }
                </td>
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

              {/* --- ส่วนที่ 2: การคำนวณสำหรับ BZ3-B --- */}
              <tr>
                <td className={tdLeftClass}>RC-417: Water Content ( Moisture )</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" step="0.01" min="0" className={inputClass} {...register('bz3Calculations.rc417WaterContent', { valueAsNumber: true })} /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}> <span className="text-xs"> Weight of RC-417 + Mg(OH)<sub>2</sub> <br /> + Activated Carbon P-200U </span> </td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bz3Calculations.totalWeightOfMaterials')} /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Moisture Gen BZ3-B (STD mean.)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz3Calculations.stdMeanMoisture', { valueAsNumber: true })} value="39.5" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl water =</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz3Calculations.naclWater', { valueAsNumber: true })} value="15" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}>NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('bz3Calculations.naclWaterSpecGrav', { valueAsNumber: true, required: 'กรุณากรอก NaCl Water Specific gravity' })} />
                  {errors.bz3Calculations?.naclWaterSpecGrav &&
                    <p className="text-sm text-danger mt-1">
                      {errors.bz3Calculations.naclWaterSpecGrav.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Temperature</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('bz3Calculations.temperature', { valueAsNumber: true, required: 'กรุณากรอก Temperature' })} />
                  {errors.bz3Calculations?.temperature &&
                    <p className="text-sm text-danger mt-1">
                      {errors.bz3Calculations.temperature.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>C°</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NaCl Water</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} {...register('bz3Calculations.naclWater15', { valueAsNumber: true })} readOnly disabled /></td>
                <td className={tdLeftClass}>(L/B)/20 min. =</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bz3Calculations.lminRate')} /></td>
                <td className={tdLeftClass}>'L/min </td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total NaCl water=</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bz3Calculations.totalNaclWater', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg./B</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight = NCR Genmatsu =</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bz3Calculations.totalWeightWithNcr', { valueAsNumber: true })} /></td>
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