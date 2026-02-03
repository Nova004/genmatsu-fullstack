// src/pages/BZ5-C_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
import { useWeightingCalculation, WeightingCalculationConfig } from '../../../../../hooks/useWeightCalculations';
import { useTemplateLoader } from '../../../../../hooks/useTemplateLoader';
import RawMaterialTableRows from '../../../components/forms/RawMaterialTableRows';
import { formatNumberRound } from '../../../../../utils/utils';

// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================


export const useBZ5_CCalculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- 1. ดักฟังค่า Input ทั้งหมดที่ผู้ใช้กรอก ---
  const rc417Total = watch('rc417Weighting.total'); // (P20)
  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const activatedCarbon = watch('rawMaterials.activatedcarbon');
  const GypsumPlaster = watch('rawMaterials.gypsumplaster');

  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const rc417WaterContent = watch('bz5cCalculations.rc417WaterContentMoisture'); // (P21)
  const stdMeanMoisture = watch('bz5cCalculations.stdMeanMoisture');
  const naclWater = 15;
  const naclWaterSpecGrav = watch('bz5cCalculations.naclWaterSpecGrav');

  // --- "ดักฟัง" ค่าที่ถูกคำนวณจากขั้นตอนก่อนหน้า (ไม่จำเป็นแล้ว เพราะคำนวณใน hook นี้) ---
  // const totalWeightOfMaterials = watch('bz5cCalculations.totalWeightOfMaterials');


  useEffect(() => {
    // ==========================================================
    // ส่วนที่ 1: เตรียมข้อมูล (แปลงค่า Input เป็นตัวเลข)
    // ==========================================================
    const numRc417Total = Number(rc417Total) || 0; // (P20)
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numActivatedCarbon = Number(activatedCarbon) || 0;
    const numGypsumPlaster = Number(GypsumPlaster) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;



    // ==========================================================
    // ส่วนที่ 2: เริ่มกระบวนการคำนวณตามลำดับ (ใช้ค่าดิบทั้งหมด)
    // ==========================================================

    // ----- [NEW ✨] คำนวณ "CDZ-1:WaterContant(weight)" (P22) -----
    // (ผลลัพธ์: calculatedWaterContentWeight_RAW)
    // ----------------------------------------------------------
    let calculatedWaterContentWeight_RAW: number | null = null;

    if (rc417WaterContent) {
      const P20 = numRc417Total;
      const P21_decimal = (Number(rc417WaterContent) / 100) || 0;
      const rawResult = P20 * P21_decimal;
      const multiplier = Math.pow(10, 6);

      calculatedWaterContentWeight_RAW = (rawResult * multiplier) / multiplier;
    }
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bz5cCalculations.rc417WaterContentweight',
      calculatedWaterContentWeight_RAW !== null ? formatNumberRound(calculatedWaterContentWeight_RAW) as any : null
    );
    // ----------------------------------------------------------
    // console.log(`BZ5-C calc [B]: Using RAW P22_B = ${rc417WaterContent}`); // Log ค่า P22 ดิบ

    // ----- [A] คำนวณ "Weight of CDZ-1 + Mg(OH)2 + Activated Carbon P-200U" -----
    // (ผลลัพธ์: calculatedTotalMaterials_RAW)
    // ----------------------------------------------------------
    const calculatedTotalMaterials_RAW = numRc417Total + numMagnesiumHydroxide + numActivatedCarbon + numGypsumPlaster; // ค่าดิบ
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bz5cCalculations.totalWeightOfMaterials',
      calculatedTotalMaterials_RAW > 0 ? formatNumberRound(calculatedTotalMaterials_RAW) : null
    );
    // ----------------------------------------------------------


    // ----- [B] คำนวณ Salt =(P20-P22)*(AV27/AV23)*(N24/(1-N24)) -----
    // (ผลลัพธ์: rawInitialNaclWater15_RAW)
    // ----------------------------------------------------------
    // ----- [B] คำนวณ Salt =(P20-P22)*(AV27/AV23)*(N24/(1-N24)) -----
    // (ผลลัพธ์: rawInitialNaclWater15_RAW)
    // ----------------------------------------------------------
    console.log('[BZ5-C DEBUG B] --- Block [B] Start (OLD FORMULA) ---');
    let rawInitialNaclWater15_RAW: number | null = null;

    const P20_B = numRc417Total;
    const P22_B = calculatedWaterContentWeight_RAW; // ใช้ค่า P22 ดิบจาก [NEW ✨]

    // Log ค่า Input ที่ได้รับมา
    console.log(`[BZ5-C DEBUG B] Input P20_B (numRc417Total) = ${P20_B}`);
    console.log(`[BZ5-C DEBUG B] Input P22_B (calculatedWaterContentWeight_RAW) = ${P22_B}`);

    // (Log เดิมของคุณ)
    // console.log(`BZ5-C calc [B]: Using RAW P22_B = ${P22_B}`); // Log ค่า P22 ดิบ

    if (P22_B !== null) {
      console.log('[BZ5-C DEBUG B] Condition met: P22_B is not null. Starting calculation.');

      // 1. ตั้งค่าคงที่
      const AV27 = 580.25250000;
      const AV23 = 1000;
      const N24_percent = 15;
      const N24_decimal = N24_percent / 100;
      console.log(`[BZ5-C DEBUG B] Constants: AV27=${AV27}, AV23=${AV23}, N24_decimal=${N24_decimal}`);

      // 2. คำนวณ Part 1
      const part1 = (P20_B - P22_B);
      console.log(`[BZ5-C DEBUG B] part1 (P20_B - P22_B) = (${P20_B} - ${P22_B}) = ${part1}`);

      // 3. คำนวณ Part 2
      const part2 = (AV27 / AV23);
      console.log(`[BZ5-C DEBUG B] part2 (AV27 / AV23) = (${AV27} / ${AV23}) = ${part2}`);

      // 4. คำนวณ Part 3
      const part3 = (N24_decimal / (1 - N24_decimal));
      console.log(`[BZ5-C DEBUG B] part3 (N24_decimal / (1 - N24_decimal)) = (${N24_decimal} / (1 - ${N24_decimal})) = ${part3}`);

      // 5. คำนวณผลลัพธ์รวม
      const rawResult_B = part1 * part2 * part3;
      console.log(`[BZ5-C DEBUG B] rawResult_B (part1 * part2 * part3) = (${part1} * ${part2} * ${part3}) = ${rawResult_B}`);

      rawInitialNaclWater15_RAW = rawResult_B; // เก็บค่าดิบ

    } else {
      console.log('[BZ5-C DEBUG B] Condition skipped: P22_B is null.');
    }
    // (ค่านี้ไม่ได้ถูก setValue จึงส่งต่อค่าดิบไป [C] และ [D])
    // ----------------------------------------------------------

    // (Log เดิมของคุณ)
    console.log('BZ5-C calc [B Result]: rawInitialNaclWater15 (RAW) =', rawInitialNaclWater15_RAW);
    console.log('[BZ5-C DEBUG B] --- Block [B] End ---');

    // ----------------------------------------------------------

    // ----- [C] คำนวณค่ากลาง (Intermediate Value) -----
    // (ผลลัพธ์: rawIntermediateWater_RAW)
    // ----------------------------------------------------------
    let rawIntermediateWater_RAW: number | null = null;
    if (rawInitialNaclWater15_RAW !== null) { // ใช้ค่าดิบจาก [B]
      const T24_raw = rawInitialNaclWater15_RAW;
      const O23_decimal_for_intermediate = (Number(naclWater) / 100) || 0;

      if (O23_decimal_for_intermediate !== 0) {
        rawIntermediateWater_RAW = (T24_raw / O23_decimal_for_intermediate) * (1 - O23_decimal_for_intermediate); // เก็บค่าดิบ
      }
    }
    // (ค่านี้ไม่ได้ถูก setValue จึงส่งต่อค่าดิบไป [D])
    // ----------------------------------------------------------

    //console.log('BZ5-C calc [C Result]: rawIntermediateWater (RAW) =', rawIntermediateWater_RAW);

    // ----------------------------------------------------------

    // ----- [D] คำนวณ "Total NaCl water" -----
    // (ผลลัพธ์: totalNaclWaterResult_RAW)
    // ----------------------------------------------------------
    let totalNaclWaterResult_RAW: number | null = null;
    if (rc417WaterContent) {
      const T24_raw_final = rawInitialNaclWater15_RAW || 0; // ใช้ค่าดิบจาก [B]
      const AD24_raw_final = rawIntermediateWater_RAW || 0; // ใช้ค่าดิบจาก [C]
      const rawResult = T24_raw_final + AD24_raw_final;
      totalNaclWaterResult_RAW = rawResult; // เก็บค่าดิบ
    }
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bz5cCalculations.totalNaclWater',
      totalNaclWaterResult_RAW !== null ? formatNumberRound(totalNaclWaterResult_RAW) as any : null
    );
    // ----------------------------------------------------------


    // ----- [E] คำนวณค่าสุดท้าย (Final Results) -----

    // [E-1] คำนวณ "15% NaCl Water" (L) และ (L/B)/20 min.
    let finalNaclWater4Result_RAW: number | null = null;
    const W23 = Number(naclWaterSpecGrav) || 0;
    if (naclWaterSpecGrav && W23 !== 0) {
      const totalNaclForFinal = totalNaclWaterResult_RAW || 0; // ใช้ค่าดิบจาก [D]
      const rawResult = totalNaclForFinal / W23;
      finalNaclWater4Result_RAW = rawResult; // เก็บค่าดิบ
    }
    // ปัดเศษเฉพาะตอนแสดงผล (L)
    setValue(
      'bz5cCalculations.naclWater4',
      finalNaclWater4Result_RAW !== null ? Number(finalNaclWater4Result_RAW.toFixed(0)) : null
    );
    // ปัดเศษเฉพาะตอนแสดงผล (สำหรับ sodiumChloride)
    setValue(
      'rawMaterials.sodiumChloride',
      finalNaclWater4Result_RAW !== null ? Number(finalNaclWater4Result_RAW.toFixed(0)) : null,
      { shouldValidate: true }
    );

    // คำนวณ "(L/B)/20 min."
    const lminRate_RAW = (finalNaclWater4Result_RAW || 0) / 20; // ใช้ค่าดิบจาก [E-1]
    // ปัดเศษเฉพาะตอนแสดงผล (ใช้ Math.round() แก้ Type Error)
    setValue(
      'bz5cCalculations.lminRate',
      lminRate_RAW > 0 ? String(Math.round(lminRate_RAW)) : '',
    );

    // [E-2] คำนวณ "Total weight = NCR Genmatsu"
    let totalWeightWithNcrResult_RAW: number | null = null;
    if (totalNaclWaterResult_RAW !== null) { // ใช้ค่าดิบจาก [D]
      const AD21_final = calculatedTotalMaterials_RAW; // ใช้ค่าดิบจาก [A]
      const AD25_final = totalNaclWaterResult_RAW; // ใช้ค่าดิบจาก [D]
      const U14_final = numNcrGenmatsu;
      const rawResult = AD21_final + AD25_final + U14_final;
      totalWeightWithNcrResult_RAW = rawResult; // เก็บค่าดิบ
    }
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bz5cCalculations.totalWeightWithNcr',
      totalWeightWithNcrResult_RAW !== null ? formatNumberRound(totalWeightWithNcrResult_RAW) as any : null
    );

  }, [
    // --- Dependencies ---
    rc417Total,
    magnesiumHydroxide,
    activatedCarbon,
    GypsumPlaster, // เพิ่ม GypsumPlaster ที่ขาดไปในไฟล์ล่าสุดของคุณ
    ncrGenmatsu,
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

// 📌 หมายเหตุ: bz5cWeightingConfig นี้ดูเหมือนจะคัดลอกมาจาก BS3
// เราอาจจะต้องอัปเดต config นี้ให้ตรงกับ BZ5-C ต่อไปนะครับ
const bz5cWeightingConfig: WeightingCalculationConfig = {
  rows: [
    { grossWeightPath: 'rc417Weighting.row1.weight', netWeightPath: 'rc417Weighting.row1.net', bagWeightPath: 'cg1cWeighting.row1.bagWeight' },
    { grossWeightPath: 'rc417Weighting.row2.weight', netWeightPath: 'rc417Weighting.row2.net', bagWeightPath: 'cg1cWeighting.row2.bagWeight' },
  ],
  totalPath: 'rc417Weighting.total',
  destinationPath: 'rawMaterials.diaEarth', // 👈 (อันนี้อาจจะต้องเปลี่ยนเป็น rawMaterials.rc417Total หรือฟิลด์อื่นของ BZ5-C)
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
    templateName: 'BZ5-C_Step2_RawMaterials',
    onTemplateLoaded,
    staticBlueprint,
  });

  // 📌 Hook 2 ตัวนี้ทำงานตามสถาปัตยกรรมที่เราวางไว้
  useWeightingCalculation(watch, setValue, bz5cWeightingConfig);
  useBZ5_CCalculations(watch, setValue);

  // --- (CSS Classes) ---
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400"; // แก้ 1.Spx เป็น 1.5px
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  //const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;
  const textareaClass = "w-full h-[50px] rounded-r-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

  // --- (End CSS Classes) ---


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

              {/* 👇 เรียกใช้ Component แสดงแถวตาราง */}
              {!isLoading && !error && <RawMaterialTableRows fields={fields} register={register} errors={errors} />}

            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <tbody>
              {/* --- ส่วนที่ 1: การชั่งน้ำหนัก CDZ-1 --- */}
              <tr>
                <td className={tdLeftClass}>CDZ-1 : Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={inputClass} {...register('rc417Weighting.row1.weight', { valueAsNumber: true, required: 'กรุณากรอก  CDZ-1 : Weight' })} /> <span className="ml-2">Kg.</span></div>
                  {errors.rc417Weighting?.row1?.weight &&
                    <p className="text-sm text-danger mt-1">
                      {errors.rc417Weighting.row1.weight.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('rc417Weighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Bag Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagWeight')} /><span className="ml-2">Kg.</span></div></td>
                <td className={tdLeftClass}>Net Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.row1.net')} /><span className="ml-2">Kg.</span></div></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CDZ-1 : Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={inputClass} {...register('rc417Weighting.row2.weight', { valueAsNumber: true, required: 'กรุณากรอก CDZ-1 : Weight' })} /><span className="ml-2">Kg.</span></div>
                  {errors.rc417Weighting?.row2?.weight &&
                    <p className="text-sm text-danger mt-1">
                      {errors.rc417Weighting.row2.weight.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('rc417Weighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>Bag Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row2.bagWeight')} /><span className="ml-2">Kg.</span></div></td>
                <td className={tdLeftClass}>Net Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.row2.net')} /><span className="ml-2">Kg.</span></div></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CDZ-1 :Total Weight</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.total')} /><span className="ml-2">Kg.</span></div></td>

                <td className={tdLeftClass}>Net Weight of Yield</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={disabledInputClass} readOnly value="1000" /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass}>CDZ-1 of AD</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={inputClass} {...register('rc417Weighting.cdz1ofad', { valueAsNumber: true, required: 'กรุณากรอก CDZ-1 of AD' })} /><span className="ml-2">g/mL</span></div>
                  {errors.rc417Weighting?.cdz1ofad &&
                    <p className="text-sm text-danger mt-1">
                      {errors.rc417Weighting.cdz1ofad.message}
                    </p>
                  }
                </td>
              </tr>

              {/* --- ส่วนที่ 2: การคำนวณสำหรับ BZ5-C --- */}
              <tr>
                <td className={tdLeftClass}>CDZ-1: Water Content (Moisture)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" step="0.01" min="0" className={inputClass} {...register('bz5cCalculations.rc417WaterContentMoisture', { valueAsNumber: true })} /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}> <span className="text-xs"> Weight of CDZ-1 + Mg(OH)<sub>2</sub> <br /> + Carbon </span> </td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={disabledInputClass} readOnly {...register('bz5cCalculations.totalWeightOfMaterials')} /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass}></td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CDZ-1: Water Contant (weight)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} readOnly  {...register('bz5cCalculations.rc417WaterContentweight', { valueAsNumber: true })} /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass}>Moisture Gen BZ5-C (STD mean.)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz5cCalculations.stdMeanMoisture', { valueAsNumber: true })} value="33.94" readOnly disabled /><span className="ml-2">%</span></div> </td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl water =</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz5cCalculations.naclWater', { valueAsNumber: true })} value="15" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}>NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('bz5cCalculations.naclWaterSpecGrav', { valueAsNumber: true, required: 'กรุณากรอก  NaCl Water Specific gravity' })} />
                  {errors.bz5cCalculations?.naclWaterSpecGrav &&
                    <p className="text-sm text-danger mt-1">
                      {errors.bz5cCalculations.naclWaterSpecGrav.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Temperature</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('bz5cCalculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>C°</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total NaCl water=</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bz5cCalculations.totalNaclWater', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg./B</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NaCl Water</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} {...register('bz5cCalculations.naclWater4', { valueAsNumber: true })} readOnly disabled /></td>
                <td className={tdLeftClass}>(L/B)/20 min. =</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bz5cCalculations.lminRate')} /></td>
                <td className={tdLeftClass}>'L/min </td>
              </tr>

              <tr>
                <td className={tdLeftClass}>Total weight = NCR Genmatsu =</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bz5cCalculations.totalWeightWithNcr', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg. </td>
              </tr>

              {/* --- ส่วนที่ 3: หมายเหตุ --- */}
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