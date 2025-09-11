// src/pages/BZ_Form/FormStep3.tsx

import React, { useState, useEffect } from 'react';
import { FormStepProps, IMasterFormItem } from './types';

const FormStep3: React.FC<FormStepProps> = ({ register }) => {
  
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
                const config = item.config_json;
                const isStartTimeDisabled = !config.inputs.startTime?.enabled;
                const isFinishTimeDisabled = !config.inputs.finishTime?.enabled;
                
                return (
                  <tr key={item.item_id}>
                    <td className={tdCenterClass}>{index + 1}</td>
                    
                    {/* --- "จิตรกร" เริ่มวาดภาพตาม "แบบแปลน" --- */}
                    {config.columns.map((col, colIndex) => {
                      switch (col.type) {
                        case 'DESCRIPTION':
                          return <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>{col.value}</td>;
                        
                        case 'SINGLE_INPUT_GROUP':
                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                              <div className="flex w-full">
                                <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.label}</span>
                                <input 
                                  type={col.input.type || 'text'}
                                  step={col.input.step || 'any'}
                                  className={`${inputClass} rounded-l-none rounded-r-none`} 
                                  {...register(col.input.field_name.replace('{index}', index), { valueAsNumber: col.input.type === 'number' })} 
                                />
                                <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.unit}</span>
                              </div>
                            </td>
                          );
                        
                        // นายสามารถเพิ่ม case สำหรับ col.type อื่นๆ ได้ในอนาคต
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