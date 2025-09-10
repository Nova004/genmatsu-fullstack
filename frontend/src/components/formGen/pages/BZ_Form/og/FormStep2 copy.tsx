// src/pages/BZ_Form/FormStep2.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormStepProps, IManufacturingReportForm, IMasterFormItem } from './types';


// สร้าง Interface สำหรับ Props ของหน้านี้โดยเฉพาะ เพื่อให้ Type ถูกต้อง
interface FormStep2Props extends FormStepProps {
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
}

const FormStep2: React.FC<FormStep2Props> = ({ register, watch, setValue }) => {

  // 1. สร้าง State เพื่อเก็บ "พิมพ์เขียว" ที่จะโหลดมาจาก Backend
  const [rawMaterialConfig, setRawMaterialConfig] = useState<IMasterFormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. ใช้ useEffect เพื่อยิง API ไปขอ "พิมพ์เขียว" แค่ครั้งเดียวตอนหน้าโหลด
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:4000/api/master/template/BZ_Step2_RawMaterials'); //  <-- แก้ Port ให้ถูกต้อง
        const data = await response.json();
        setRawMaterialConfig(data); // เก็บ "พิมพ์เขียว" ไว้ใน State
      } catch (error) {
        console.error("Failed to fetch master data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, []); // [] หมายถึงให้ทำงานแค่ครั้งเดียว

  // --- Logic การคำนวณ Real-time (เหมือนเดิม) ---
  const cg1cRow1 = watch('cg1cWeighting.row1.cg1c');
  const cg1cRow2 = watch('cg1cWeighting.row2.cg1c');

  useEffect(() => {
    const net1 = Number(cg1cRow1) - 2 || 0;
    const net2 = Number(cg1cRow2) - 2 || 0;
    const total = net1 + net2;
    setValue('cg1cWeighting.row1.net', net1 > 0 ? net1 : null);
    setValue('cg1cWeighting.row2.net', net2 > 0 ? net2 : null);
    setValue('cg1cWeighting.total', total > 0 ? total : null);
    setValue('rawMaterials.diaEarth', total > 0 ? total : null);
  }, [cg1cRow1, cg1cRow2, setValue]);


  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} bg-gray-2 dark:bg-meta-4 cursor-default`;
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
        {/* --- ตารางที่ 1: Raw Material Name (สร้างแบบไดนามิก) --- */}
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
                const config = field.config_json;
                // --- ใช้ switch case เพื่อสร้างแถวตาม row_type ---
                switch (config.row_type) {
                  case 'SINGLE_INPUT':
                    return (
                      <tr key={field.item_id}>
                        <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                        <td className={tdCenterClass}>{config.std_value}</td>
                        <td className={tdCenterClass}>
                          <input type={config.inputs[0].type} className={config.inputs[0].is_disabled ? disabledInputClass : inputClass} disabled={config.inputs[0].is_disabled} {...register(config.inputs[0].field_name, { valueAsNumber: true })} />
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
                          <input type={config.inputs[0].type} className={disabledInputClass} disabled readOnly {...register(config.inputs[0].field_name)} />
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
                          <input type={config.inputs[0].type} className={inputClass} {...register(config.inputs[0].field_name)} />
                        </td>
                        <td className={tdCenterClass}>{config.std_value}</td>
                        <td className={tdCenterClass}>
                          <input type={config.inputs[1].type} className={inputClass} {...register(config.inputs[1].field_name, { valueAsNumber: true })} />
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

        {/* --- ตารางที่ 2: Calculations (ยังคงเป็น Hardcode เพราะ Logic ซับซ้อน) --- */}
        <div className="overflow-x-auto">
          {/* ... โค้ด JSX ของตารางที่ 2 (เหมือนเดิม) ... */}
        </div>
      </div>
    </div>
  );
};

export default FormStep2;