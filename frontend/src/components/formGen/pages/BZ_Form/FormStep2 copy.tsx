// src/pages/BZ_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { FormStepProps, IManufacturingReportForm, IMasterFormItem, IStep2ConfigJson } from './types';
import axios from 'axios';

interface FormStep2Props extends FormStepProps {
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

const FormStep2: React.FC<FormStep2Props> = ({ register, watch, setValue, errors }) => {

  const [rawMaterialConfig, setRawMaterialConfig] = useState<IMasterFormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  // --- ดึงข้อมูล Master Form จาก API เมื่อ component โหลดครั้งแรก ---
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        // 1. ใช้ axios.get และ URL ที่สั้นลง (เพราะมี Proxy)
        const response = await axios.get('/api/master/template/BZ_Step2_RawMaterials/latest');

        // 2. ข้อมูล items จะอยู่ใน response.data.items โดยตรง
        setRawMaterialConfig(response.data?.items || []);

      } catch (error) {
        console.error("Failed to fetch master data for Step 2", error);
        setRawMaterialConfig([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, []);


  // --- Logic การคำนวณ Real-time ---
  const cg1cRow1 = watch('cg1cWeighting.row1.cg1c');
  const cg1cRow2 = watch('cg1cWeighting.row2.cg1c');

  useEffect(() => {
    const net1 = Number(cg1cRow1) - 2 || 0;
    const net2 = Number(cg1cRow2) - 2 || 0;
    const total = net1 + net2;
    setValue('cg1cWeighting.row1.net', net1 > 0 ? net1 : null);
    setValue('cg1cWeighting.row2.net', net2 > 0 ? net2 : null);
    setValue('cg1cWeighting.total', total > 0 ? total : null);
    // สั่งให้ validate field diaEarth ทันทีที่ค่าจากการคำนวณเปลี่ยนไป
    setValue('rawMaterials.diaEarth', total > 0 ? total : null, { shouldValidate: true });
  }, [cg1cRow1, cg1cRow2, setValue]);


  // =================================================================
  // === ส่วนที่เพิ่มเข้ามา: Logic การดึงค่าจากตาราง NaCl brewing ===
  // =================================================================

  const cg1cWaterContent = watch('calculations.cg1cWaterContent');

  useEffect(() => {
    // ถ้าไม่มีค่า หรือไม่ใช่ตัวเลข ก็ไม่ต้องทำอะไร
    if (cg1cWaterContent === null || cg1cWaterContent === undefined || isNaN(cg1cWaterContent)) {
      setValue('calculations.naclBrewingTable', null); // ล้างค่าในช่อง brewing table
      return;
    }

    const fetchBrewingValue = async () => {
      try {
        const response = await axios.get(`/api/nacl/lookup/${cg1cWaterContent}`);

        if (response.data && response.data.NaCl_NaCl_Water !== undefined) {
          // ถ้าเจอข้อมูล ให้นำไปใส่ในช่อง brewing table
          setValue('calculations.naclBrewingTable', response.data.NaCl_NaCl_Water);
        } else {
          setValue('calculations.naclBrewingTable', null); // ถ้า API ตอบกลับมาแปลกๆ ให้ล้างค่า
        }

      } catch (error) {
        console.error("NaCl lookup failed:", error);
        // ถ้าหาไม่เจอ (API ตอบ 404) หรือ Error ให้ล้างค่าในช่อง
        setValue('calculations.naclBrewingTable', null);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchBrewingValue();
    }, 500);

    // Cleanup function: จะทำงานเมื่อ user พิมพ์ตัวอักษรใหม่
    // เพื่อยกเลิก timeout เก่า ป้องกันการยิง API ซ้ำซ้อน
    return () => clearTimeout(delayDebounceFn);

  }, [cg1cWaterContent, setValue]); // useEffect นี้จะทำงานทุกครั้งที่ค่า cg1cWaterContent เปลี่ยน


  // =================================================================
  // === 2. ส่วนที่เพิ่มเข้ามา: Logic การคำนวณตามสูตร Excel ===
  // =================================================================

  // "ดักฟัง" ค่าทั้งหมดที่ต้องใช้ในสูตร
  const naclBrewingTable = watch('calculations.naclBrewingTable'); // $Y$20
  const totalWeight = watch('cg1cWeighting.total');                // $Q$18
  const naclSpecGrav = watch('calculations.nacl15SpecGrav');     // $Q$19
  const stdYield = 800;                                             // $Y$18 (ค่าคงที่)

  const [naclWaterCalculation, setNaclWaterCalculation] = useState<number | null>(null); // สร้าง state สำหรับเก็บค่าการคำนวณ

  useEffect(() => {
    // แปลงค่าทั้งหมดให้เป็นตัวเลข และให้เป็น 0 หากไม่มีค่า
    const numNaclBrewingTable = Number(naclBrewingTable) || 0;
    const numTotalWeight = Number(totalWeight) || 0;
    const numNaclSpecGrav = Number(naclSpecGrav) || 0;

    // ตรวจสอบเงื่อนไข IF($Y$20="","",...)
    // และป้องกันการหารด้วยศูนย์
    if (numNaclBrewingTable === 0 || numNaclSpecGrav === 0) {
      setNaclWaterCalculation(null);
      return;
    }
    // ทำการคำนวณตามสูตร
    const result = (numTotalWeight * numNaclBrewingTable) / (stdYield * numNaclSpecGrav);

    // เก็บผลลัพธ์ไว้ใน State
    setNaclWaterCalculation(result);

    // (ตัวอย่าง) แสดงผลลัพธ์ใน Console เพื่อตรวจสอบ
    console.log(`Calculation Result: (${numTotalWeight} * ${numNaclBrewingTable}) / (${stdYield} * ${numNaclSpecGrav}) = ${result}`);

  }, [naclBrewingTable, totalWeight, naclSpecGrav, stdYield]); // useEffect นี้จะทำงานเมื่อค่าใดค่าหนึ่งในนี้เปลี่ยน


   useEffect(() => {
    // 1. ดึงค่าที่จำเป็นมาใช้
    const numNaclWaterCalculation = Number(naclWaterCalculation) || 0; // W21
    const numNaclSpecGrav = Number(naclSpecGrav) || 0;             // Q19

    // 2. ตรวจสอบเงื่อนไข IF(W21="","",...)
    if (naclWaterCalculation === null) {
      setValue('calculations.naclWaterCalc', null); // ถ้าค่า W21 เป็นค่าว่าง ให้ล้างค่าในช่องผลลัพธ์
      return;
    }

    // 3. ทำการคำนวณตามสูตร
    const result = numNaclWaterCalculation * numNaclSpecGrav;

    // 4. นำผลลัพธ์ไปใส่ในช่อง 'calculations.naclWaterCalc'
    setValue('calculations.naclWaterCalc', result);
    
    // (ตัวอย่าง) แสดงผลลัพธ์ใน Console เพื่อตรวจสอบ
    console.log(`Final Calc: ${numNaclWaterCalculation} * ${numNaclSpecGrav} = ${result}`);

  }, [naclWaterCalculation, naclSpecGrav, setValue]); // useEffect นี้จะทำงานเมื่อค่า 2 ตัวนี้เปลี่ยน



  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} bg-gray-2 dark:bg-meta-4 cursor-default`;
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  // --- ฟังก์ชันสำหรับสร้าง Input Field พร้อม Validation ---
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
            validate: (value) => {
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

              {!isLoading && rawMaterialConfig.map(field => {
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
                                  validate: (value) => {
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