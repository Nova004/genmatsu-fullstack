// src/pages/BZ3_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { getLatestTemplateByName } from '../../../../services/formService';
import { IManufacturingReportForm, IStep2ConfigJson } from '../types';
import apiClient from '../../../../services/apiService';


// =================================================================
// ╔═══════════════════════════════════════════════════════════════╗
// ║                     CUSTOM HOOKS (ส่วนจัดการ Logic)            
// ╚═══════════════════════════════════════════════════════════════╝
// =================================================================

/**
 * 🚀 HOOK 1: จัดการการคำนวณน้ำหนัก RC-417 (Net & Total)
 */
const useRc417WeightingCalculation = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>

) => {
  const rc417Row1 = watch('rc417Weighting.row1.weight');
  const rc417Row2 = watch('rc417Weighting.row2.weight');

  useEffect(() => {
    const net1 = Number(rc417Row1) - 2 || 0;
    const net2 = Number(rc417Row2) - 2 || 0;
    const total = net1 + net2;

    setValue('rc417Weighting.row1.net', net1 > 0 ? net1 : null);
    setValue('rc417Weighting.row2.net', net2 > 0 ? net2 : null);
    setValue('rc417Weighting.total', total > 0 ? total : null);
    setValue('rawMaterials.diaEarth', total > 0 ? total : null, { shouldValidate: true });
  }, [rc417Row1, rc417Row2, setValue]);
};



/**
 * 🚀 HOOK 2: [ใหม่] จัดการการคำนวณสำหรับฟอร์ม BZ3 โดยเฉพาะ
 */
const useBZ3Calculations = (
  watch: UseFormWatch<IManufacturingReportForm>,
  setValue: UseFormSetValue<IManufacturingReportForm>
) => {
  // --- "ดักฟัง" ค่าทั้งหมดที่ต้องใช้ในสูตร ---
  const rc417Total = watch('rc417Weighting.total');
  const magnesiumHydroxide = watch('rawMaterials.magnesiumHydroxide');
  const activatedCarbon = watch('rawMaterials.activatedcarbon');
  const ncrGenmatsu = watch('rawMaterials.ncrGenmatsu.actual');
  
  const totalWeightOfMaterials = watch('bz3Calculations.totalWeightOfMaterials');
  const rc417WaterContent = watch('bz3Calculations.rc417WaterContent');
  const stdMeanMoisture = watch('bz3Calculations.stdMeanMoisture');
  const naclWater = watch('bz3Calculations.naclWater');
  // 🔽 [แก้ไข] ดักฟังค่าใหม่ที่ต้องใช้
  const naclWaterSpecGrav = watch('bz3Calculations.naclWaterSpecGrav');


  useEffect(() => {
    // --- แปลงค่าทั้งหมดเป็นตัวเลขที่ปลอดภัย ---
    const numRc417Total = Number(rc417Total) || 0;
    const numMagnesiumHydroxide = Number(magnesiumHydroxide) || 0;
    const numActivatedCarbon = Number(activatedCarbon) || 0;
    const numNcrGenmatsu = Number(ncrGenmatsu) || 0;

    // --- เริ่มการคำนวณ ---

    // 1. คำนวณ "Weight of RC-417 + Mg(OH)2 + Activated Carbon P-200U"
    const totalMaterials = numRc417Total + numMagnesiumHydroxide + numActivatedCarbon;
    setValue('bz3Calculations.totalWeightOfMaterials', totalMaterials > 0 ? totalMaterials.toFixed(2) : null);


    // 2. คำนวณ "15% NaCl Water" (ค่าเริ่มต้น)
    let initialNaclWater15Result: number | null = null;
    const numTotalMaterialsForNacl = Number(totalWeightOfMaterials) || 0;
    const Q21 = Number(rc417WaterContent) / 100 || 0;
    const Q20 = numRc417Total;
    const AD21 = numTotalMaterialsForNacl;
    const Q22 = Number(stdMeanMoisture) / 100 || 0;
    const O23_percent = Number(naclWater) / 100 || 0;

    if (rc417WaterContent) {
      const denominator = 1 - O23_percent - Q22;
      if (denominator !== 0) {
        const numerator = (AD21 * Q22 - Q20 * Q21);
        const rawResult = (numerator / denominator) * O23_percent;
        initialNaclWater15Result = Number(rawResult.toFixed(2));
      }
    }
    
    // 3. คำนวณค่ากลาง (Intermediate Value)
    let intermediateWaterCalcResult: number | null = null;
    const T24_percent = Number(naclWater) || 0;
    const O23_val = Number(initialNaclWater15Result) || 0;
    
    if (naclWater && O23_val !== 0) {
        const rawResult = (T24_percent / O23_val * (1 - O23_val));
        intermediateWaterCalcResult = Number(rawResult.toFixed(2));
    }
    setValue('bz3Calculations.intermediateWaterCalc', intermediateWaterCalcResult);

    // --- 🔽 [ส่วนที่แก้ไข] เพิ่มสูตรสุดท้ายเพื่ออัปเดตค่า 15% NaCl Water ---
    let finalNaclWater15Result: number | null = initialNaclWater15Result; // เริ่มต้นด้วยค่าเดิม
    
    const W23 = Number(naclWaterSpecGrav) || 0;
    const T24 = Number(initialNaclWater15Result) || 0;
    const AD24 = Number(intermediateWaterCalcResult) || 0;
    
    // จำลองเงื่อนไข IF(W23="","",...)
    if (naclWaterSpecGrav && W23 !== 0) { // ตรวจสอบว่ามีค่า W23 และไม่เป็นศูนย์
        const rawResult = (T24 + AD24) / W23;
        finalNaclWater15Result = Number(rawResult.toFixed(2));
    }
    // อัปเดตค่าสุดท้ายลงใน State ของฟอร์ม
    setValue('bz3Calculations.naclWater15', finalNaclWater15Result);
    // --- 🔼 สิ้นสุดส่วนที่แก้ไข ---


    // 4. คำนวณ "(L/B)/20 min." (ใช้ค่าสุดท้ายที่คำนวณได้)
    const numNaclWater15 = Number(finalNaclWater15Result) || 0;
    const lminRate = numNaclWater15 / 20;
    setValue('bz3Calculations.lminRate', lminRate > 0 ? lminRate.toFixed(2) : null);

    // 5. คำนวณ "Total NaCl water"
    const totalNaclWater = null; // <-- รอสูตร
    setValue('bz3Calculations.totalNaclWater', totalNaclWater);

    // 6. คำนวณ "Total weight = NCR Genmatsu"
    const totalWeightWithNcr = null; // <-- รอสูตร
    setValue('bz3Calculations.totalWeightWithNcr', totalWeightWithNcr);

  }, [
    rc417Total,
    magnesiumHydroxide,
    activatedCarbon,
    ncrGenmatsu,
    totalWeightOfMaterials,
    rc417WaterContent,
    stdMeanMoisture,
    naclWater,
    naclWaterSpecGrav, // 🔽 [แก้ไข] เพิ่มตัวแปรใหม่
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

const FormStep2: React.FC<FormStep2Props> = ({
  register,
  watch,
  setValue,
  errors,
  onTemplateLoaded,
  staticBlueprint
}) => {

  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processBlueprint = (data: any) => {
      if (data && data.items) {
        setFields(data.items);
        if (onTemplateLoaded) {
          onTemplateLoaded(data.template);
        }
      } else {
        setError('โครงสร้าง Master ของ Step 2 ไม่ถูกต้อง');
      }
      setIsLoading(false);
    };

    const fetchLatestBlueprint = async () => {
      try {
        const data = await getLatestTemplateByName('BZ3_Step2_RawMaterials');
        processBlueprint(data);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูล Master ของ Step 2 ได้');
        setIsLoading(false);
      }
    };

    if (staticBlueprint) {
      processBlueprint(staticBlueprint);
    } else {
      fetchLatestBlueprint();
    }
  }, [onTemplateLoaded, staticBlueprint]);

  useRc417WeightingCalculation(watch, setValue);
  useBZ3Calculations(watch, setValue);

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  const renderValidatedInput = (config: IStep2ConfigJson, inputIndex: number = 0) => {
    const inputConfig = config.inputs[inputIndex];
    if (!inputConfig) return null;

    const fieldName = inputConfig.field_name;
    const validationRules = inputConfig.validation || config.validation;
    const fieldError = fieldName.split('.').reduce((obj: any, key: string) => obj && obj[key], errors);

    return (
      <div className='relative pt-2 pb-6'>
        <input
          type={inputConfig.type || 'text'}
          className={inputConfig.is_disabled ? disabledInputClass : inputClass}
          disabled={inputConfig.is_disabled}
          {...register(fieldName as any, {
            valueAsNumber: inputConfig.type === 'number',
            validate: (value: any) => {
              if (!validationRules || value === null || value === '' || value === undefined) return true;
              switch (validationRules.type) {
                case 'RANGE_TOLERANCE':
                case 'RANGE_DIRECT':
                  if (validationRules.min !== undefined && validationRules.max !== undefined) {
                    return (value >= validationRules.min && value <= validationRules.max) || validationRules.errorMessage;
                  }
                  return true;
                case 'MAX_VALUE':
                  if (validationRules.max !== undefined) {
                    return (value <= validationRules.max) || validationRules.errorMessage;
                  }
                  return true;
                default:
                  return true;
              }
            }
          })}
        />
        {fieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{fieldError.message as string}</span>}
      </div>
    );
  };


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

              {!isLoading && fields.map(field => {
                const config = field.config_json as IStep2ConfigJson;

                switch (config.row_type) {
                  case 'SINGLE_INPUT':
                    if (config.inputs[0]?.field_name === 'rawMaterials.diaEarth') {
                      const fieldError = errors.rawMaterials?.diaEarth;
                      return (
                        <tr key={field.item_id}>
                          <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                          <td className={tdCenterClass}>{config.std_value}</td>
                          <td className={tdCenterClass}>
                            <div className='relative pt-2 pb-6'>
                              <input type="number" className={disabledInputClass} readOnly disabled
                                {...register('rawMaterials.diaEarth', {
                                  valueAsNumber: true,
                                  validate: (value: any) => {
                                    const rules = config.validation;
                                    if (!rules || value === null || value === undefined) return true;
                                    if (rules.min !== undefined && rules.max !== undefined) {
                                      return (value >= rules.min && value <= rules.max) || rules.errorMessage;
                                    }
                                    return true;
                                  }
                                })}
                              />
                              {fieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{fieldError.message}</span>}
                            </div>
                          </td>
                          <td className={tdCenterClass}>{config.unit}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={field.item_id}>
                        <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                        <td className={tdCenterClass}>{config.std_value}</td>
                        <td className={tdCenterClass}>
                          {renderValidatedInput(config)}
                        </td>
                        <td className={tdCenterClass}>{config.unit}</td>
                      </tr>
                    );

                  case 'SINGLE_INPUT_SPAN':
                    return (
                      <tr key={field.item_id}>
                        <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                        <td className={tdCenterClass}>{config.std_value}</td>
                        <td className={tdCenterClass} rowSpan={2}>
                          {renderValidatedInput(config)}
                        </td>
                        <td className={tdCenterClass}>{config.unit}</td>
                      </tr>
                    );

                  case 'SUB_ROW':
                    return (
                      <tr key={field.item_id}>
                        <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                        <td className={tdCenterClass}>{config.std_value}</td>
                        <td className={tdCenterClass}>{config.unit}</td>
                      </tr>
                    );

                  case 'DUAL_INPUT':
                    return (
                      <tr key={field.item_id}>
                        <td className={tdLeftClass}>{config.label}</td>
                        <td className={tdCenterClass}>
                          {renderValidatedInput(config, 0)}
                        </td>
                        <td className={tdCenterClass}>{config.std_value}</td>
                        <td className={tdCenterClass}>
                          {renderValidatedInput(config, 1)}
                        </td>
                        <td className={tdCenterClass}>{config.unit}</td>
                      </tr>
                    );

                  default:
                    return null;
                }
              })}
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

              {/* --- ส่วนที่ 2: การคำนวณสำหรับ BZ3 --- */}
              <tr>
                <td className={tdLeftClass}>RC-417: Water Content</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz3Calculations.rc417WaterContent', { valueAsNumber: true })} value="2" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}> <span className="text-xs"> Weight of RC-417 + Mg(OH)<sub>2</sub> <br /> + Activated Carbon P-200U </span> </td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly {...register('bz3Calculations.totalWeightOfMaterials')} /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Moisture Gen BZ3 (STD mean.)</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz3Calculations.stdMeanMoisture', { valueAsNumber: true })} value="39.5" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl water =</td>
                <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={disabledInputClass} {...register('bz3Calculations.naclWater', { valueAsNumber: true })} value="15" readOnly disabled /><span className="ml-2">%</span></div> </td>
                <td className={tdLeftClass}>NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('bz3Calculations.naclWaterSpecGrav')} /></td>
                <td className={tdLeftClass}>Temperature</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('bz3Calculations.temperature', { valueAsNumber: true })} /></td>
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
