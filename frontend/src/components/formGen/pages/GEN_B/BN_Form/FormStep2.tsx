// src/pages/BN_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../types';
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
  const actual = watch('rawMaterials.remainedGenmatsu.actual');
  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  const activatedcarbon = watch('rawMaterials.activatedcarbon');
  const gypsumplaster = watch('rawMaterials.gypsumplaster');

  const cg1cWeighting = watch('cg1cWeighting.row1.cg1c');
  const cg2cWeighting = watch('cg1cWeighting.row2.cg1c');

  const stdYield = 1200; // ค่าคงที่

  useEffect(() => {
    console.groupCollapsed('📊 Excel Formula Calculations (Start)'); // เริ่ม group log

    // --- แปลงค่าทั้งหมดเป็นตัวเลข (กำหนด default เป็น 0) ---
    const numNaclBrewingTable = Number(naclBrewingTable) || 0;
    const numTotalWeight = Number(totalWeight) || 0;
    const numNaclSpecGrav = Number(naclSpecGrav) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;
    const numActivatedCarbon = Number(activatedcarbon) || 0;
    const numGypsumPlaster = Number(gypsumplaster) || 0;
    const numCg1cWeighting = Number(cg1cWeighting) || 0;
    const numCg2cWeighting = Number(cg2cWeighting) || 0;
    const numctual = Number(actual) || 0;

    // Log: Input Values
    console.log('--- Input Values (num prefixed) ---');
    console.log(`naclBrewingTable (Y20): ${numNaclBrewingTable}`);
    console.log(`totalWeight (Q18): ${numTotalWeight}`);
    console.log(`naclSpecGrav (Q19): ${numNaclSpecGrav}`);
    console.log(`stdYield (Y18 - Fixed): ${stdYield}`);
    console.log(`Mg Hydroxide: ${numMagnesiumHydroxide}`);
    console.log(`NCR Genmatsu: ${numNcrGenmatsu}`);
    console.log(`Activated Carbon: ${numActivatedCarbon}`);
    console.log(`Gypsum Plaster: ${numGypsumPlaster}`);
    console.log('------------------------------------');



    // --- ตั้งค่า Zeolite (Logic เดิม ถูกต้อง) ---

    const zeoliteJikuliteValue = numCg1cWeighting - 2;
    const zeoliteNattoValue = numCg2cWeighting - 2;

    setValue(
      'rawMaterials.ZeoliteJikulite',
      zeoliteJikuliteValue > 0 ? zeoliteJikuliteValue : null,
      { shouldValidate: true }
    );

    setValue(
      'rawMaterials.ZeoliteNatto',
      zeoliteNattoValue > 0 ? zeoliteNattoValue : null,
      { shouldValidate: true }
    );

    // Log: Zeolite Assignment
    console.log(`📝 Setting ZeoliteJikulite (CG1C): ${numCg1cWeighting > 0 ? numCg1cWeighting : 'null'}`);
    console.log(`📝 Setting ZeoliteNatto (CG2C): ${numCg2cWeighting > 0 ? numCg2cWeighting : 'null'}`);

    let _rawNaclWaterCalcResult: number | null = null;

    // =================================================================
    // === 1. คำนวณ Sodium Chloride ===
    // =================================================================
    let sodiumChlorideResult: number | null = null;
    if (numNaclBrewingTable > 0 && numTotalWeight > 0 && numNaclSpecGrav > 0) {
      // สูตร: (Q18 * Y20) / (Y18 * Q19)
      const rawResult = (numTotalWeight * numNaclBrewingTable) / (stdYield * numNaclSpecGrav);
      sodiumChlorideResult = Number(rawResult.toFixed(2));

      console.log('--- 1. Sodium Chloride ---');
      console.log(`Raw: (${numTotalWeight} * ${numNaclBrewingTable}) / (${stdYield} * ${numNaclSpecGrav}) = ${rawResult}`);
      console.log(`✅ Result (Rounded to 2): ${sodiumChlorideResult}`);
      console.log('--------------------------');
    } else {
      console.log('--- 1. Sodium Chloride --- (Skip: Input is zero)');
    }
    setValue('rawMaterials.sodiumChloride', sodiumChlorideResult, { shouldValidate: true });


    // =================================================================
    // === 2. คำนวณ naclWaterCalc (W23) ===
    // =================================================================
    let naclWaterCalcResult: number | null = null;
    if (numNaclBrewingTable > 0 && numTotalWeight > 0) {
      // สูตร: (Q18 * Y20) / Y18
      const rawResult = (numTotalWeight * numNaclBrewingTable) / stdYield;

      _rawNaclWaterCalcResult = rawResult;
      naclWaterCalcResult = Number(rawResult.toFixed(2));

      console.log('--- 2. naclWaterCalc (W23) ---');
      console.log(`Raw: (${numTotalWeight} * ${numNaclBrewingTable}) / ${stdYield} = ${rawResult}`);
      console.log(`➡️ Raw Value Stored for next steps: ${_rawNaclWaterCalcResult}`);
      console.log(`✅ Result (Rounded to 2): ${naclWaterCalcResult}`);
      console.log('--------------------------------');
    } else {
      _rawNaclWaterCalcResult = null;
      console.log('--- 2. naclWaterCalc (W23) --- (Skip: Input is zero)');
    }
    setValue('calculations.naclWaterCalc', naclWaterCalcResult);


    // =================================================================
    // === 3. & 4. คำนวณ waterCalc (น้ำ) และ saltCalc (เกลือ) ===
    // =================================================================
    let waterCalcResult: number | null = null;
    let saltCalcResult: number | null = null;

    console.log('--- 3. & 4. Water/Salt Calculation ---');
    if (_rawNaclWaterCalcResult !== null) {
      // น้ำ (0.85)
      const rawWaterResult = _rawNaclWaterCalcResult * 0.85;
      waterCalcResult = Number(rawWaterResult.toFixed(2));
      console.log(`💧 Water Calc (Raw * 0.85): ${_rawNaclWaterCalcResult} * 0.85 = ${rawWaterResult} -> ${waterCalcResult}`);

      // เกลือ (0.15)
      const rawSaltResult = _rawNaclWaterCalcResult * 0.15;
      saltCalcResult = Number(rawSaltResult.toFixed(2));
      console.log(`🧂 Salt Calc (Raw * 0.15): ${_rawNaclWaterCalcResult} * 0.15 = ${rawSaltResult} -> ${saltCalcResult}`);
    } else {
      console.log(`(Skip: naclWaterCalc Raw is null)`);
    }
    setValue('calculations.waterCalc', waterCalcResult);
    setValue('calculations.saltCalc', saltCalcResult);
    console.log('------------------------------------------');


    // =================================================================
    // === 5. คำนวณ finalTotalWeight ===
    // =================================================================
    const naclWater = _rawNaclWaterCalcResult || 0;

    const total = numTotalWeight
      + naclWater
      + numMagnesiumHydroxide
      + numNcrGenmatsu
      + numActivatedCarbon
      + numctual
      + numGypsumPlaster;

    const finalTotalWeight = total > 0 ? Number(total.toFixed(3)) : null;

    console.log('--- 5. Final Total Weight ---');
    console.log(`Sum: ${numTotalWeight} + ${naclWater} (Raw NaclWater) + ${numMagnesiumHydroxide} + ${numNcrGenmatsu} + ${numActivatedCarbon} + ${numGypsumPlaster}`);
    console.log(`Raw Total: ${total}`);
    console.log(`✅ Final Result (Rounded to 3): ${finalTotalWeight}`);
    console.log('-------------------------------');

    setValue('calculations.finalTotalWeight', finalTotalWeight);

    console.groupEnd(); // สิ้นสุด group log
  }, [
    naclBrewingTable,
    totalWeight,
    naclSpecGrav,
    magnesiumHydroxide,
    activatedcarbon,
    gypsumplaster,
    ncrGenmatsu,
    cg1cWeighting,
    cg2cWeighting,
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
  destinationPath: 'rawMaterials.diaEarth', //ไม่มีการ validate ที่ diaEarth โดยตรง
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
    templateName: 'BN_Step2_RawMaterials', // 👈 แค่ระบุชื่อ Template ที่ถูกต้อง
    onTemplateLoaded,
    staticBlueprint,
  });

  const rawNaclBrewingTableValue = watch('calculations.naclBrewingTable'); // ดักฟังค่า NaCl Brewing Table เพื่อแสดงผลแบบปัดเศษใน Input Field


  // --- Logic 2: เรียกใช้ Custom Hooks ที่เราสร้างไว้ ---
  useWeightingCalculation(watch, setValue, bzWeightingConfig);
  useNaclBrewingLookup(watch, setValue, '4%', 'Zeolite');
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
                <td className={tdLeftClass}>Zeolite Z (Jikulite) :Weight</td>
                <td className={tdLeftClass}>  <input type="number" className={inputClass} {...register('cg1cWeighting.row1.cg1c', { valueAsNumber: true, required: 'กรุณากรอก Zeolite Z (Jikulite) :Weight' })} />
                  {errors.cg1cWeighting?.row1?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row1.cg1c.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>BagWeight</td>
                <td className={tdLeftClass}><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row1.bagWeight')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row1.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Zeolite  (Natto) : Weight</td>
                <td className={tdLeftClass}>  <input type="number" step="any" className={inputClass} {...register('cg1cWeighting.row2.cg1c', { valueAsNumber: true, required: 'กรุณากรอก Zeolite (Natto) : Weight' })} />
                  {errors.cg1cWeighting?.row2?.cg1c &&
                    <p className="text-sm text-danger mt-1">
                      {errors.cg1cWeighting.row2.cg1c.message}
                    </p>
                  }
                </td>

                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>BagWeight</td>
                <td className={tdLeftClass}><input type="text" step="any" className={inputClass} {...register('cg1cWeighting.row2.bagWeight')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row2.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Zeolite Z (Jikulite&Natto) =</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.total')} /></td>
                <td className={tdLeftClass}>Net Weight of Yieid (STD) :</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly value="1200" /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>4% NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="number" step="0.001" className={inputClass} {...register('calculations.nacl15SpecGrav', { valueAsNumber: true, required: 'กรุณากรอก NaCl brewing table ( BN NaCl 4 % Water )' })} />
                  {errors.calculations?.nacl15SpecGrav &&
                    <p className="text-sm text-danger mt-1">
                      {errors.calculations.nacl15SpecGrav.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Zeolite  Water Content ( Moisture )</td>
                <td className={tdLeftClass}><input type="number" step="0.01" className={inputClass} {...register('calculations.cg1cWaterContent', { valueAsNumber: true, required: 'กรุณากรอก 15% CG - 1C Water Content (Moisture)' })} />
                  {errors.calculations?.cg1cWaterContent &&
                    <p className="text-sm text-danger mt-1">
                      {errors.calculations.cg1cWaterContent.message}
                    </p>
                  }
                </td>
                <td className={tdLeftClass}>Temperature (˚C)</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('calculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl brewing table ( BN NaCl 4 % Water )</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclBrewingTable')}
                  value={rawNaclBrewingTableValue !== null && rawNaclBrewingTableValue !== undefined
                    ? Number(rawNaclBrewingTableValue).toFixed(4)
                    : ''} />
                </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>4% NacCl Water Calculaion for finding water content</td>
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
    </div >
  );
};

export default FormStep2;