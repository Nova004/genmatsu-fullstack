// src/pages/BZ_Form/FormStep3.tsx

import React, { useState, useEffect } from 'react';
import { FieldErrors } from 'react-hook-form'; // 1. Import FieldErrors
import { FormStepProps, IMasterFormItem, IConfigJson } from './types';

// 2. อัปเดต Props ให้รับ 'errors' เข้ามา
interface FormStep3Props extends FormStepProps {
  errors: FieldErrors<any>;
}

const FormStep3: React.FC<FormStep3Props> = ({ register, errors }) => { // <-- รับ errors มาใช้

  const [operationStepsConfig, setOperationStepsConfig] = useState<IMasterFormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:4000/api/master/template/BZ_Step3_Operations/latest');
        const data = await response.json();
        setOperationStepsConfig(data.items);
      } catch (error) {
        console.error("Failed to fetch master data for Step 3", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} bg-gray-2 dark:bg-meta-4 cursor-default`;
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  return (
    <div>
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

              {!isLoading && operationStepsConfig.map((item, index) => {
                const config = item.config_json as IConfigJson; // Type Assertion เพื่อความชัดเจน

                if (!config || typeof config !== 'object' || !('columns' in config)) {
                  return null;
                }

                const isStartTimeDisabled = !config.inputs.startTime?.enabled;
                const isFinishTimeDisabled = !config.inputs.finishTime?.enabled;

                return (
                  <tr key={item.item_id}>
                    <td className={tdCenterClass}>{index + 1}</td>

                    {config.columns.map((col, colIndex) => {
                      switch (col.type) {
                        case 'DESCRIPTION':
                          return <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>{col.value}</td>;

                        case 'SINGLE_INPUT_GROUP':
                          if (!col.input) {
                            return <td key={colIndex}>Config Error: Input is missing.</td>;
                          }

                          // 3. เตรียมตัวแปรสำหรับหา error ของ field นี้
                          const fieldName = col.input.field_name.replace('{index}', String(index));
                          const fieldError = fieldName.split('.').reduce((obj: any, key) => obj && obj[key], errors);

                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                              {/* 5. เพิ่ม Wrapper สำหรับจัดตำแหน่ง Error Message */}
                              <div className="relative pt-2 pb-6">
                                <div className="flex w-full">
                                  <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.label}</span>
                                  <input
                                    type={col.input.type || 'text'}
                                    step={col.input.step || 'any'}
                                    className={`${inputClass} rounded-l-none rounded-r-none`}
                                    // 4. เพิ่ม Logic การ Validate เข้าไปใน register
                                    {...register(fieldName as any, {
                                      valueAsNumber: col.input.type === 'number',
                                      validate: (value) => {
                                        const rules = col.input?.validation;
                                        // ถ้าไม่มีกฎ หรือยังไม่ได้กรอกค่า ให้ผ่าน
                                        if (!rules || value === null || value === '' || value === undefined) return true;

                                        // ตรวจสอบกฎตามประเภท
                                        switch (rules.type) {
                                          case 'RANGE_DIRECT':
                                            // เพิ่มการตรวจสอบว่า min และ max ไม่ใช่ undefined ก่อนใช้งาน
                                            if (rules.min !== undefined && rules.max !== undefined) {
                                              return (value >= rules.min && value <= rules.max) || rules.errorMessage;
                                            }
                                            return true; // ถ้า min หรือ max ไม่มีค่า ก็ให้ผ่านไปก่อน (หรือจะ return error message ก็ได้)
                                          default:
                                            return true;
                                        }
                                      }
                                    })}
                                  />
                                  <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.unit}</span>
                                </div>
                                {/* 6. แสดง Error Message ถ้ามี */}
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
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2"> {/* ปรับ gap เล็กน้อย */}

                                {/* เพิ่มส่วนนี้เพื่อแสดง description */}
                                {col.description && <span className="font-medium mr-2">{col.description}</span>}

                                {col.inputs.map((inputItem, inputIdx) => {
                                  const multiFieldName = inputItem.field_name.replace('{index}', String(index));
                                  const multiFieldError = multiFieldName.split('.').reduce((obj: any, key) => obj && obj[key], errors);

                                  return (
                                    <div key={inputIdx} className="relative pt-2 pb-6">
                                      <div className="flex items-center">
                                        <span className="mr-2 whitespace-nowrap">{inputItem.label}</span>
                                        <input
                                          type={inputItem.type || 'text'}
                                          className={inputClass}
                                          style={{   minWidth: '60px', maxWidth: '80px'  }} // กำหนดความกว้างขั้นต่ำ
                                          {...register(multiFieldName as any, {
                                            valueAsNumber: inputItem.type === 'number',
                                            validate: (value) => {
                                              const rules = col.validation;
                                              if (!rules || value === null || value === '' || value === undefined) return true;
                                              switch (rules.type) {
                                                case 'MAX_VALUE':
                                                  if (rules.max !== undefined) {
                                                    return (value <= rules.max) || rules.errorMessage;
                                                  }
                                                  return true;

                                                default:
                                                  return true;
                                              }
                                            }
                                          })}
                                        />
                                        <span className="ml-2">{inputItem.unit}</span>
                                      </div>
                                      {multiFieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{multiFieldError.message as string}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );

                        default:
                          return <td key={colIndex}>Unsupported column type</td>;
                      }
                    })}

                    <td className={tdCenterClass}>
                      <input
                        type="time"
                        className={isStartTimeDisabled ? disabledInputClass : inputClass}
                        disabled={isStartTimeDisabled}
                        {...register(`operationResults.${index}.startTime`)}
                      />
                    </td>
                    <td className={tdCenterClass}>
                      <input
                        type="time"
                        className={isFinishTimeDisabled ? disabledInputClass : inputClass}
                        disabled={isFinishTimeDisabled}
                        {...register(`operationResults.${index}.finishTime`)}
                      />
                    </td>
                  </tr>
                )
              })}

              {/* แถวสำหรับ Remark (ยังคง Hardcode ไว้) */}
              <tr>
                <td className={tdLeftClass} colSpan={5}>
                  <div className="flex w-full">
                    <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">Remark</span>
                    <textarea className={`${inputClass} h-25 rounded-l-none`} {...register('operationRemark')}></textarea>
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

export default FormStep3;