// src/pages/BS5-C_Form/FormStep2.tsx

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


// ✨ [EDIT 1/4] เปลี่ยนชื่อ Hook เป็น BS5-C
export const useBS5_CCalculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- 1. ดักฟังค่า Input ทั้งหมดที่ผู้ใช้กรอก ---
  const rc417Total = watch('rc417Weighting.total'); // (S19 / P20)

  // (AD20)
  const rc417WaterContentMoisture = watch('bs5cCalculations.rc417WaterContentMoisture');
  // (S24)
  const netweightofwaterper = 649.814400000;

  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const activatedCarbon = watch('rawMaterials.activatedcarbon');
  const GypsumPlaster = watch('rawMaterials.gypsumplaster');

  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const rc417WaterContent = watch('bs5cCalculations.rc417WaterContentMoisture'); // (P21)
  const stdMeanMoisture = watch('bs5cCalculations.stdMeanMoisture');
  const naclWater = 4;
  const naclWaterSpecGrav = watch('bs5cCalculations.naclWaterSpecGrav');

  // --- "ดักฟัง" ค่าที่ถูกคำนวณจากขั้นตอนก่อนหน้า (ไม่จำเป็นแล้ว เพราะคำนวณใน hook นี้) ---
  // const totalWeightOfMaterials = watch('bs5cCalculations.totalWeightOfMaterials');

  useEffect(() => {
    // ==========================================================
    // ส่วนที่ 1: เตรียมข้อมูล (แปลงค่า Input เป็นตัวเลข)
    // ==========================================================
    console.log('[BS5-C DEBUG] --- 1. PARSING INPUTS ---');
    const numRc417Total = Number(rc417Total) || 0; // (S19 / P20)
    console.log(`[BS5-C DEBUG] Parsed numRc417Total (S19/P20): ${numRc417Total}`);

    // ✨ [EDIT 2/4] เพิ่มการ Parse ตัวแปรใหม่สำหรับสูตร BS5-C (แก้ไข Type Error)
    // (AD20)
    // ตรวจสอบว่าค่าที่ได้มาเป็น 'number' จริงๆ และไม่ใช่ NaN


    // (S24)
    const numS24 = Number(netweightofwaterper) || 0;
    console.log(`[BS5-C DEBUG] Parsed numS24: ${numS24}`);


    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numActivatedCarbon = Number(activatedCarbon) || 0;
    const numGypsumPlaster = Number(GypsumPlaster) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;
    console.log(`[BS5-C DEBUG] Parsed Others: Mg(OH)2=${numMagnesiumHydroxide}, Carbon=${numActivatedCarbon}, Gypsum=${numGypsumPlaster}, NCR=${numNcrGenmatsu}`);
    console.log('[BS5-C DEBUG] --- END PARSING ---');


    // ==========================================================
    // ส่วนที่ 2: เริ่มกระบวนการคำนวณตามลำดับ (ใช้ค่าดิบทั้งหมด)
    // ==========================================================

    // ----- [NEW ✨] คำนวณ "CDZ-1:WaterContant(weight)" (P22) -----
    // (บล็อกนี้ยังคงไว้เพื่อคำนวณค่าแสดงผล P22 แม้ว่าสูตร [B] ใหม่จะไม่ต้องการ P22 แล้ว)
    // (ผลลัพธ์: calculatedWaterContentWeight_RAW)
    // ----------------------------------------------------------
    console.log('[BS5-C DEBUG] --- Block [P22] Start ---');
    let calculatedWaterContentWeight_RAW: number | null = null;

    if (rc417WaterContent) {
      const P20 = numRc417Total;
      const P21_decimal = (Number(rc417WaterContent) / 100) || 0;
      console.log(`[BS5-C DEBUG] [P22] Inputs: P20=${P20}, P21_decimal=${P21_decimal}`);
      const rawResult = P20 * P21_decimal;
      console.log(`[BS5-C DEBUG] [P22] Output (True RAW): ${rawResult}`); // 👈 Log ค่าดิบจริงๆ
      calculatedWaterContentWeight_RAW = rawResult; // ✨ ROUNDED
    }
    console.log(`[BS5-C DEBUG] [P22] Output (Rounded): ${calculatedWaterContentWeight_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bs5cCalculations.rc417WaterContentweight',
      calculatedWaterContentWeight_RAW !== null ? formatNumberRound(calculatedWaterContentWeight_RAW) as any : null
    );
    // ----------------------------------------------------------


    // ----- [A] คำนวณ "Weight of CDZ-1 + Mg(OH)2 + Activated Carbon P-200U" -----
    // (ผลลัพธ์: calculatedTotalMaterials_RAW)
    // ----------------------------------------------------------
    console.log('[BS5-C DEBUG] --- Block [A] Start ---');
    console.log(`[BS5-C DEBUG] [A] Inputs: numRc417Total=${numRc417Total}, numMagnesiumHydroxide=${numMagnesiumHydroxide}, numActivatedCarbon=${numActivatedCarbon}, numGypsumPlaster=${numGypsumPlaster}`);
    const rawResult_A = numRc417Total + numMagnesiumHydroxide + numActivatedCarbon + numGypsumPlaster; // ค่าดิบ
    console.log(`[BS5-C DEBUG] [A] Output (True RAW): ${rawResult_A}`); // 👈 Log ค่าดิบจริงๆ
    const calculatedTotalMaterials_RAW = rawResult_A || 0; // ✨ ROUNDED
    console.log(`[BS5-C DEBUG] [A] Output (Rounded): ${calculatedTotalMaterials_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bs5cCalculations.totalWeightOfMaterials',
      calculatedTotalMaterials_RAW > 0 ? formatNumberRound(calculatedTotalMaterials_RAW) : null
    );
    // ----------------------------------------------------------


    // ✨✨✨ [EDIT 4/4] บล็อก [B] ที่ถูกแทนที่ด้วยสูตรใหม่ของ BS5-C ✨✨✨
    // ----- [B] คำนวณ Salt =(S19-AD20)*(S24/AD19)*(O23/(1-O23)) --- (BS5-C NEW) ---
    // (ผลลัพธ์: rawInitialNaclWater15_RAW)
    // --------------------------------------------------------------------------
    console.log('[BS5-C DEBUG] --- Block [B] Start (NEW FORMULA) ---');
    let rawInitialNaclWater15_RAW: number | null = null;

    // S19 = rc417Weighting.total (P20 เดิม)
    const S19 = numRc417Total;

    // AD20 = bs5cCalculations.rc417WaterContentMoisture (Parsed)
    // (ใช้ numAD20 จากส่วนที่ 1)

    // S24 = bs5cCalculations.Netweightofwaterper (Parsed)
    // (ใช้ numS24 จากส่วนที่ 1)



    // IF(AD20="",""...) ตรวจสอบว่า AD20 ไม่ใช่ null




    // AD19 = 1000
    const AD19 = 1000;
    const numAD20 = calculatedWaterContentWeight_RAW || 0;
    console.log(`[BS5-C DEBUG] [B] Inputs: S19=${S19}, numAD20=${numAD20}, numS24=${numS24}`);
    // O23 = 4%
    const O23_percent = 4.0;
    const O23_decimal = O23_percent / 100;
    console.log(`[BS5-C DEBUG] [B] Constants: AD19=${AD19}, O23_decimal=${O23_decimal}`);

    // (S19-AD20)
    const part1 = (S19 - numAD20);
    console.log(`[BS5-C DEBUG] [B] part1 (S19 - AD20): ${part1}`);
    // (S24/AD19)
    const part2 = (numS24 / AD19);
    console.log(`[BS5-C DEBUG] [B] part2 (S24 / AD19): ${part2}`);
    // (O23/(1-O23))
    const part3 = (O23_decimal / (1 - O23_decimal));
    console.log(`[BS5-C DEBUG] [B] part3 (O23_decimal / (1 - O23_decimal)): ${part3}`);

    const rawResult_B = part1 * part2 * part3;
    console.log(`[BS5-C DEBUG] [B] rawResult_B (True RAW): ${rawResult_B}`); // 👈 Log ค่าดิบจริงๆ
    rawInitialNaclWater15_RAW = rawResult_B; // ✨ ROUNDED

    console.log(`[BS5-C DEBUG] [B] Output (Rounded): ${rawInitialNaclWater15_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ----------------------------------------------------------
    // ✨✨✨ สิ้นสุดบล็อก [B] ที่แก้ไข ✨✨✨


    // ----- [C] คำนวณค่ากลาง (Intermediate Value) -----
    // (ผลลัพธ์: rawIntermediateWater_RAW)
    // (Logic ส่วนนี้ยังคงเดิม โดยใช้ผลลัพธ์ดิบจาก [B] ใหม่)
    // ----------------------------------------------------------
    console.log('[BS5-C DEBUG] --- Block [C] Start ---');
    let rawIntermediateWater_RAW: number | null = null;
    if (rawInitialNaclWater15_RAW !== null) { // ใช้ค่าดิบที่ปัดแล้วจาก [B]
      const T24_raw = rawInitialNaclWater15_RAW;
      const O23_decimal_for_intermediate = (Number(naclWater) / 100) || 0;
      console.log(`[BS5-C DEBUG] [C] Inputs: T24_raw (from B rounded)=${T24_raw}, O23_decimal (from naclWater)=${O23_decimal_for_intermediate}`);

      if (O23_decimal_for_intermediate !== 0) {
        const rawResult_C = (T24_raw / O23_decimal_for_intermediate) * (1 - O23_decimal_for_intermediate); // เก็บค่าดิบ
        console.log(`[BS5-C DEBUG] [C] Output (True RAW): ${rawResult_C}`); // 👈 Log ค่าดิบจริงๆ
        rawIntermediateWater_RAW = rawResult_C; // ✨ ROUNDED
      } else {
        console.log('[BS5-C DEBUG] [C] Skipped (O23_decimal_for_intermediate is 0).');
      }
    } else {
      console.log('[BS5-C DEBUG] [C] Skipped (rawInitialNaclWater15_RAW is null).');
    }
    console.log(`[BS5-C DEBUG] [C] Output (Rounded): ${rawIntermediateWater_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ----------------------------------------------------------


    // ----- [D] คำนวณ "Total NaCl water" -----
    // (ผลลัพธ์: totalNaclWaterResult_RAW)
    // (Logic ส่วนนี้ยังคงเดิม โดยใช้ผลลัพธ์ดิบจาก [B] และ [C] ใหม่)
    // ----------------------------------------------------------
    console.log('[BS5-C DEBUG] --- Block [D] Start ---');
    let totalNaclWaterResult_RAW: number | null = null;
    if (rc417WaterContent) { // (ยังคงใช้ P21 เป็นตัวเช็คการทำงาน)
      const T24_raw_final = rawInitialNaclWater15_RAW || 0; // ใช้ค่าดิบที่ปัดแล้วจาก [B]
      const AD24_raw_final = rawIntermediateWater_RAW || 0; // ใช้ค่าดิบที่ปัดแล้วจาก [C]
      console.log(`[BS5-C DEBUG] [D] Inputs: T24_raw_final (from B rounded)=${T24_raw_final}, AD24_raw_final (from C rounded)=${AD24_raw_final}`);
      const rawResult_D = T24_raw_final + AD24_raw_final;
      console.log(`[BS5-C DEBUG] [D] Output (True RAW): ${rawResult_D}`); // 👈 Log ค่าดิบจริงๆ
      totalNaclWaterResult_RAW = rawResult_D; // ✨ ROUNDED
    } else {
      console.log('[BS5-C DEBUG] [D] Skipped (rc417WaterContent is falsy).');
    }
    console.log(`[BS5-C DEBUG] [D] Output (Rounded): ${totalNaclWaterResult_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bs5cCalculations.totalNaclWater',
      totalNaclWaterResult_RAW !== null ? formatNumberRound(totalNaclWaterResult_RAW) as any : null
    );
    // ----------------------------------------------------------


    // ----- [E] คำนวณค่าสุดท้าย (Final Results) -----
    console.log('[BS5-C DEBUG] --- Block [E] Start ---');

    // [E-1] คำนวณ "15% NaCl Water" (L) และ (L/B)/20 min.
    let finalNaclWater4Result_RAW: number | null = null;
    const W23 = Number(naclWaterSpecGrav) || 0;
    console.log(`[BS5-C DEBUG] [E-1] Input: W23 (naclWaterSpecGrav)=${W23}`);
    if (naclWaterSpecGrav && W23 !== 0) {
      const totalNaclForFinal = totalNaclWaterResult_RAW || 0; // ใช้ค่าดิบที่ปัดแล้วจาก [D]
      console.log(`[BS5-C DEBUG] [E-1] Input: totalNaclForFinal (from D rounded)=${totalNaclForFinal}`);
      const rawResult_E1 = totalNaclForFinal / W23;
      console.log(`[BS5-C DEBUG] [E-1] Output (True RAW L): ${rawResult_E1}`); // 👈 Log ค่าดิบจริงๆ
      finalNaclWater4Result_RAW = rawResult_E1; // ✨ ROUNDED
    } else {
      console.log('[BS5-C DEBUG] [E-1] Skipped (W23 is 0 or missing).');
    }
    console.log(`[BS5-C DEBUG] [E-1] Output (Rounded L): ${finalNaclWater4Result_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ปัดเศษเฉพาะตอนแสดงผล (L)
    setValue(
      'bs5cCalculations.naclWater4',
      finalNaclWater4Result_RAW !== null ? Number(finalNaclWater4Result_RAW.toFixed(0)) : null
    );
    // ปัดเศษเฉพาะตอนแสดงผล (สำหรับ sodiumChloride)
    setValue(
      'rawMaterials.sodiumChloride',
      finalNaclWater4Result_RAW !== null ? Number(finalNaclWater4Result_RAW.toFixed(0)) : null,
      { shouldValidate: true }
    );

    // คำนวณ "(L/B)/20 min."
    const rawResult_LMin = (finalNaclWater4Result_RAW || 0) / 20; // ใช้ค่าดิบที่ปัดแล้วจาก [E-1]
    console.log(`[BS5-C DEBUG] [E-1] Output (L/min True RAW): ${rawResult_LMin}`); // 👈 Log ค่าดิบจริงๆ
    const lminRate_RAW = rawResult_LMin || 0; // ✨ ROUNDED
    console.log(`[BS5-C DEBUG] [E-1] Output (L/min Rounded): ${lminRate_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ปัดเศษเฉพาะตอนแสดงผล (ใช้ Math.round() แก้ Type Error)
    setValue(
      'bs5cCalculations.lminRate',
      lminRate_RAW > 0 ? String(Math.round(lminRate_RAW)) : '',
    );

    // [E-2] คำนวณ "Total weight = NCR Genmatsu"
    let totalWeightWithNcrResult_RAW: number | null = null;
    if (totalNaclWaterResult_RAW !== null) { // ใช้ค่าดิบที่ปัดแล้วจาก [D]
      const AD21_final = calculatedTotalMaterials_RAW || 0; // ใช้ค่าดิบที่ปัดแล้วจาก [A]
      const AD25_final = totalNaclWaterResult_RAW || 0; // ใช้ค่าดิบที่ปัดแล้วจาก [D]
      const U14_final = numNcrGenmatsu;
      console.log(`[BS5-C DEBUG] [E-2] Inputs: AD21 (from A rounded)=${AD21_final}, AD25 (from D rounded)=${AD25_final}, U14 (NCR)=${U14_final}`);
      const rawResult_E2 = AD21_final + AD25_final + U14_final;
      console.log(`[BS5-C DEBUG] [E-2] Output (True RAW): ${rawResult_E2}`); // 👈 Log ค่าดิบจริงๆ
      totalWeightWithNcrResult_RAW = rawResult_E2; // ✨ ROUNDED
    } else {
      console.log('[BS5-C DEBUG] [E-2] Skipped (totalNaclWaterResult_RAW is null).');
    }
    console.log(`[BS5-C DEBUG] [E-2] Output (Rounded): ${totalWeightWithNcrResult_RAW}`); // 👈 Log ค่าที่ปัดแล้ว
    // ปัดเศษเฉพาะตอนแสดงผล
    setValue(
      'bs5cCalculations.totalWeightWithNcr',
      totalWeightWithNcrResult_RAW !== null ? formatNumberRound(totalWeightWithNcrResult_RAW) as any : null
    );
    console.log('[BS5-C DEBUG] --- ALL CALCULATIONS FINISHED ---');

  }, [
    // --- Dependencies ---
    rc417Total,
    rc417WaterContentMoisture, // (AD20)
    netweightofwaterper, // (S24)
    magnesiumHydroxide,
    activatedCarbon,
    GypsumPlaster,
    ncrGenmatsu,
    rc417WaterContent, // (P21)
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

// 📌 หมายเหตุ: bs5cWeightingConfig นี้ดูเหมือนจะคัดลอกมาจาก BS3
// เราอาจจะต้องอัปเดต config นี้ให้ตรงกับ BZ5-C ต่อไปนะครับ
const bs5cWeightingConfig: WeightingCalculationConfig = {
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
    templateName: 'BS5-C_Step2_RawMaterials', // (ชื่อนี้ถูกต้องแล้ว)
    onTemplateLoaded,
    staticBlueprint,
  });

  // 📌 Hook 2 ตัวนี้ทำงานตามสถาปัตยกรรมที่เราวางไว้
  useWeightingCalculation(watch, setValue, bs5cWeightingConfig);

  // ✨ [EDIT 5/5] เรียกใช้ Hook ที่เปลี่ยนชื่อแล้ว
  useBS5_CCalculations(watch, setValue);

  // --- (CSS Classes) ---
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400"; // แก้ 1.Spx เป็น 1.5px
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;
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
                <td className={tdLeftClass}><div className="flex items-center"><input type="number" className={inputClass} {...register('rc417Weighting.row1.weight', { valueAsNumber: true, required: 'กรุณากรอก  CDZ-1 : Weight' })} /><span className="ml-2">Kg.</span></div>
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
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={disabledInputClass} readOnly disabled {...register('rc417Weighting.total')} /><span className="ml-2">Kg.</span></div></td>
                <td className={tdLeftClass}>Net Weight of Yield</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={disabledInputClass} readOnly value="1000" /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass}>CDZ-1 of AD</td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={inputClass} {...register('rc417Weighting.cdz1ofad', { valueAsNumber: true, required: 'กรุณากรอก CDZ-1 of AD' })} /><span className="ml-2">g/mL</span></div>
                  {errors.rc417Weighting?.row2?.weight &&
                    <p className="text-sm text-danger mt-1">
                      {errors.rc417Weighting.row2.weight.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass} colSpan={2}></td>
              </tr>

              {/* --- ส่วนที่ 2: การคำนวณสำหรับ BZ5-C --- */}
              <tr>
                <td className={tdLeftClass}>CDZ-1: Water Content (Moisture)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" step="0.01" min="0" className={inputClass} {...register('bs5cCalculations.rc417WaterContentMoisture', { valueAsNumber: true })} /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}> <span className="text-xs">Weight of CDZ-1 + Carbon + Gypsum + Mg(OH)2 </span> </td>
                <td className={tdLeftClass}><div className="flex items-center"><input type="text" className={disabledInputClass} readOnly {...register('bs5cCalculations.totalWeightOfMaterials')} /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CDZ-1: Water Contant (weight)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} readOnly  {...register('bs5cCalculations.rc417WaterContentweight', { valueAsNumber: true })} /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass} colSpan={6}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>% Moisture Gen B (STD mean.)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bs5cCalculations.stdMeanMoisture', { valueAsNumber: true })} value="37" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass} colSpan={6}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl water =</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bs5cCalculations.naclWater', { valueAsNumber: true })} value="4" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}>NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('bs5cCalculations.naclWaterSpecGrav', { valueAsNumber: true, required: 'กรุณากรอก  NaCl Water Specific gravity' })} />
                  {errors.bs5cCalculations?.naclWaterSpecGrav &&
                    <p className="text-sm text-danger mt-1">
                      {errors.bs5cCalculations.naclWaterSpecGrav.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Temperature</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('bs5cCalculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>C°</td>
                <td className={tdLeftClass} colSpan={2}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Net weight of water per <br></br>1000 Kg of CDZ-1 =</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bs5cCalculations.Netweightofwaterper', { valueAsNumber: true })} value="649.80" readOnly disabled /><span className="ml-2">Kg.</span></div> </td>
                <td className={tdLeftClass}> <span className="text-xs">(Calculated by 4% NaCl 654L, Specific gravity = 1.035) </span> </td>
                <td className={tdLeftClass} colSpan={5}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total NaCl water=</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={disabledInputClass} readOnly {...register('bs5cCalculations.totalNaclWater', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg./B</td>
                <td className={tdLeftClass} colSpan={5}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Feeding Volume</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} {...register('bs5cCalculations.naclWater4', { valueAsNumber: true })} readOnly disabled /></td>
                <td className={tdLeftClass}>(L/B)/20 min. =</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bs5cCalculations.lminRate')} /></td>
                <td className={tdLeftClass}>'L/min </td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight = NCR Genmatsu =</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bs5cCalculations.totalWeightWithNcr', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Kg. </td>
                <td className={tdLeftClass} colSpan={6}></td>
              </tr>
              <tr>
                <td className={tdLeftClass} colSpan={10}>* ปริมาณการเติมของโซเดียมคลอไรด์คำนวณจาก % ความชื้นของ  Diatomaceous   Earth  (CDZ-1) และค่าความถ่วงจำเพาะของ โซเดียมคลอไรด์ที่วัดค่าได้จริงและ % ความชื้น <br></br>เป้าหมายของ Genmatsu  อ้างอิงสูตรคำนวณในใบรายงานการผลิต  Genmatsu</td>
              </tr>

              {/* --- ส่วนที่ 3: หมายเหตุ --- */}
              <tr>
                <td className={tdLeftClass}>Remark (หมายเหตุ) :</td>
                <td className={tdLeftClass} colSpan={7}><textarea className={`${inputClass} h-15`} {...register('qouRemark')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormStep2;