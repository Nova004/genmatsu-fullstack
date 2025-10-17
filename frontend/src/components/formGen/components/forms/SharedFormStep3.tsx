// path: frontend/src/components/formGen/components/forms/SharedFormStep3.tsx

import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import { getLatestTemplateByName } from '../../../../services/formService';
import { IManufacturingReportForm, IConfigJson } from '../../pages/types';
import InputMask from 'react-input-mask';
import ValidatedInput from './ValidatedInput';

interface SharedFormStep3Props {
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  control: Control<IManufacturingReportForm>;
  onTemplateLoaded: (templateInfo: any) => void;
  isReadOnly?: boolean;
  staticBlueprint?: any;
  templateName: 'BS3_Step3_Operations' | 'BZ3_Step3_Operations' | 'BZ_Step3_Operations' | string;
}

const SharedFormStep3: React.FC<SharedFormStep3Props> = ({
  register,
  errors,
  control,
  onTemplateLoaded,
  isReadOnly = false,
  staticBlueprint,
  templateName
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
        setError('โครงสร้าง Master ของ Step 3 ไม่ถูกต้อง');
      }
      setIsLoading(false);
    };

    const fetchLatestBlueprint = async () => {
      try {
        const data = await getLatestTemplateByName(templateName);
        processBlueprint(data);
      } catch (err) {
        setError(`ไม่สามารถโหลดข้อมูล Master (${templateName}) ของ Step 3 ได้`);
        setIsLoading(false);
      }
    };

    if (staticBlueprint) {
      processBlueprint(staticBlueprint);
    } else {
      fetchLatestBlueprint();
    }
  }, [onTemplateLoaded, staticBlueprint, templateName]);

  if (isLoading) return <div className="p-4">Loading Form Step 3...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-gray-2 px-3 py-2 text-black outline-none dark:border-form-strokedark dark:bg-meta-4 dark:text-white";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-top pt-4`;
  const tdLeftClass = `${tdClass} align-top pt-4`;

  // ✨ 1. สร้างฟังก์ชัน Validate กลางขึ้นมาใช้ซ้ำ
  const createValidator = (rules: any) => (value: any) => {
    if (!rules) return true;

    // อนุโลมค่า 0 (ทั้งตัวเลขและตัวอักษร) และ -
    if (value === 0 || value === '0' || value === '-') return true;

    // ปล่อยผ่านค่าว่าง เพื่อให้กฎ `required` (ถ้ามี) จากที่อื่นเป็นตัวจัดการ
    if (value === null || value === '' || value === undefined) return true;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return rules.errorMessage || 'กรุณากรอกเป็นตัวเลข';
    }

    switch (rules.type) {
      case 'RANGE_DIRECT':
        if (rules.min !== undefined && rules.max !== undefined) {
          return (numericValue >= rules.min && numericValue <= rules.max) || rules.errorMessage;
        }
        return true;
      case 'MAX_VALUE':
        if (rules.max !== undefined) {
          return (numericValue <= rules.max) || rules.errorMessage;
        }
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Operation result / รายละเอียดผลการผลิต</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className={thClass}>No.</th>
                <th className={thClass} colSpan={2}>Operation result / รายละเอียดผลการผลิต</th>
                <th className={thClass}>Start time</th>
                <th className={thClass}>Finish time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="text-center p-4">Loading Master Form...</td></tr>
              )}

              {fields.map((item, index) => {
                const config = item.config_json as IConfigJson;

                if (!config || typeof config !== 'object' || !('columns' in config)) {
                  return <tr key={item.item_id}><td colSpan={5}>Invalid configuration for item</td></tr>;
                }

                const isStartTimeDisabled = !config.inputs.startTime?.enabled;
                const isFinishTimeDisabled = !config.inputs.finishTime?.enabled;

                return (
                  <tr key={item.item_id}>
                    <td className={tdCenterClass}>{index + 1}</td>

                    {config.columns.map((col, colIndex) => {
                      switch (col.type) {
                        case 'DESCRIPTION':
                          // ตรวจสอบว่ามี key `description` และเป็น object หรือไม่
                          if (col.description && typeof col.description === 'object') {
                            return (
                              <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                                {/* แสดงข้อความหลัก */}
                                {col.description.main && <p className="mb-1">{col.description.main}</p>}

                                {/* ตรวจสอบและแสดงผลข้อย่อย (subItems) */}
                                {Array.isArray(col.description.subItems) && col.description.subItems.length > 0 && (
                                  <ul className="flex flex-col gap-4 pl-4">
                                    {col.description.subItems.map((subItem: any, subIndex: number) => {
                                      const subItemStartTimeField = `operationResults.${index}.subItems.${subIndex}.startTime`;
                                      const subItemFinishTimeField = `operationResults.${index}.subItems.${subIndex}.finishTime`;

                                      const isSubStartTimeEnabled = subItem.inputs?.startTime?.enabled ?? false;
                                      const isSubFinishTimeEnabled = subItem.inputs?.finishTime?.enabled ?? false;

                                      // --- 🚀 1. สร้าง Class สำหรับช่องเวลาและ Label ---
                                      const timeInputClass = "w-full rounded-r-lg border-[1.5px] border-l-0 border-stroke bg-transparent px-3 py-1 text-sm text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
                                      const disabledTimeInputClass = "w-full cursor-default rounded-r-lg border-[1.5px] border-l-0 border-stroke bg-gray-2 px-3 py-1 text-sm text-black outline-none dark:border-form-strokedark dark:bg-meta-4 dark:text-white";
                                      const labelClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";

                                      return (
                                        <li key={subIndex} className="flex flex-col gap-2 border-t border-stroke pt-3 dark:border-strokedark">
                                          {/* ส่วนแสดงข้อความ */}
                                          <div>
                                            <span className="font-semibold">{subItem.id}</span>. {subItem.text}
                                          </div>

                                          {(isSubStartTimeEnabled || isSubFinishTimeEnabled) && (
                                            <div className="flex items-center justify-start gap-4">

                                              {/* --- 🚀 2. สร้าง Input Group สำหรับ Start Time --- */}
                                              <div className="flex w-40">
                                                <span className={labelClass}>Start</span>
                                                <Controller
                                                  name={subItemStartTimeField as any}
                                                  control={control}
                                                  render={({ field }) => (
                                                    <InputMask
                                                      {...field}
                                                      mask="99:99"
                                                      className={(!isSubStartTimeEnabled || isReadOnly) ? disabledTimeInputClass : timeInputClass}
                                                      disabled={!isSubStartTimeEnabled || isReadOnly}
                                                    />
                                                  )}
                                                />
                                              </div>

                                              {/* --- 🚀 3. สร้าง Input Group สำหรับ Finish Time --- */}
                                              <div className="flex w-40">
                                                <span className={labelClass}>Finish</span>
                                                <Controller
                                                  name={subItemFinishTimeField as any}
                                                  control={control}
                                                  render={({ field }) => (
                                                    <InputMask
                                                      {...field}
                                                      mask="99:99"
                                                      className={(!isSubFinishTimeEnabled || isReadOnly) ? disabledTimeInputClass : timeInputClass}
                                                      disabled={!isSubFinishTimeEnabled || isReadOnly}
                                                    />
                                                  )}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </td>
                            );
                          }

                          // โค้ดเดิม (สำหรับข้อมูลเก่าที่ยังใช้ col.value)
                          return <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>{col.value}</td>;

                        case 'SINGLE_INPUT_GROUP':
                          if (!col.input) {
                            return <td key={colIndex}>Config Error: Input is missing.</td>;
                          }
                          const fieldName = col.input.field_name.replace('{index}', String(index));
                          const fieldError = fieldName.split('.').reduce((obj: any, key) => obj && obj[key], errors);

                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                              <div className="relative pt-2 pb-6">
                                <div className="flex w-full">
                                  <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.label}</span>
                                  <input
                                    type={col.input.type || 'text'}
                                    step={col.input.step || 'any'}
                                    className={`${inputClass} rounded-l-none rounded-r-none`}
                                    {...register(fieldName as any, {
                                      valueAsNumber: col.input.type === 'number',
                                      // ✨ 2. เรียกใช้ฟังก์ชัน Validator กลาง
                                      validate: createValidator(col.input?.validation)
                                    })}
                                  />
                                  <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.unit}</span>
                                </div>
                                {fieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{fieldError.message as string}</span>}
                              </div>
                            </td>
                          );

                        case 'MULTI_INPUT_GROUP':
                          if (!col.inputs) {
                            return <td key={colIndex}>Config Error: Inputs array is missing.</td>;
                          }
                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                              {/* --- 🚀 1. เปลี่ยน Layout หลักเป็น flex-col --- */}
                              <div className="flex flex-col gap-2">
                                {/* ส่วนของ Description (เหมือนเดิม) */}
                                {col.description && (
                                  <span className="font-medium">
                                    {typeof col.description === 'object'
                                      ? col.description.main
                                      : col.description
                                    }
                                  </span>
                                )}

                                {/* --- 🚀 2. ห่อหุ้ม Inputs ด้วย div ใหม่ --- */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                  {col.inputs.map((inputItem, inputIdx) => {
                                    const multiFieldName = inputItem.field_name.replace('{index}', String(index));
                                    const multiFieldError = multiFieldName.split('.').reduce((obj: any, key) => obj && obj[key], errors);

                                    return (
                                      <div key={inputIdx} className="relative pt-2 pb-6">
                                        <div className="flex items-center">
                                          <span className="mr-2 whitespace-nowrap">{inputItem.label}</span>
                                          <Controller
                                            name={multiFieldName as any}
                                            control={control}
                                            render={({ field }) => (
                                              <input
                                                {...field}
                                                type={inputItem.type || 'text'}
                                                className={inputClass}
                                                style={{ minWidth: '60px', maxWidth: '80px' }}
                                                disabled={isReadOnly}
                                                {...register(multiFieldName as any, {
                                                  valueAsNumber: inputItem.type === 'number',                            
                                                  validate: createValidator(col.validation)
                                                })}
                                              />
                                            )}
                                          />
                                          <span className="ml-2">{inputItem.unit}</span>
                                        </div>
                                        {multiFieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{multiFieldError.message as string}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          );
                        default:
                          return <td key={colIndex}>Unsupported column type</td>;
                      }
                    })}
                    <td className={tdCenterClass}>
                      {/* --- 🚀 ใช้ InputMask แทน input ธรรมดา --- */}
                      <Controller
                        name={`operationResults.${index}.startTime`}
                        control={control}
                        render={({ field }) => (
                          <InputMask
                            {...field}
                            mask="99:99"
                            className={(isStartTimeDisabled || isReadOnly) ? disabledInputClass : inputClass}
                            disabled={isStartTimeDisabled || isReadOnly}
                          />
                        )}
                      />
                    </td>
                    <td className={tdCenterClass}>
                      <Controller
                        name={`operationResults.${index}.finishTime`}
                        control={control}
                        render={({ field }) => (
                          <InputMask
                            {...field}
                            mask="99:99"
                            className={(isFinishTimeDisabled || isReadOnly) ? disabledInputClass : inputClass}
                            disabled={isFinishTimeDisabled || isReadOnly}
                          />
                        )}
                      />
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className={tdLeftClass} colSpan={5}>
                  <div className="flex w-full">
                    <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">Remark</span>
                    <textarea
                      className={`${isReadOnly ? disabledInputClass : inputClass} h-25 rounded-l-none`}
                      {...register('operationRemark')}
                      disabled={isReadOnly}
                    ></textarea>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SharedFormStep3;