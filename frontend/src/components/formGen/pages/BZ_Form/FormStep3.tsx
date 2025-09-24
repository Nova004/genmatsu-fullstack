import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { getLatestTemplateByName } from '../../../../services/formService';
import { IManufacturingReportForm, IConfigJson } from './types';

// Props (ถูกต้องอยู่แล้ว)
interface FormStep3Props {
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  onTemplateLoaded: (templateInfo: any) => void;
  isReadOnly?: boolean;
  staticBlueprint?: any;
}

const FormStep3: React.FC<FormStep3Props> = ({ register, errors, onTemplateLoaded, isReadOnly = false, staticBlueprint }) => {

  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect (ถูกต้องสมบูรณ์แล้ว)
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
        const data = await getLatestTemplateByName('BZ_Step3_Operations');
        processBlueprint(data);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูล Master ของ Step 3 ได้');
        setIsLoading(false);
      }
    };
    if (staticBlueprint) {
      processBlueprint(staticBlueprint);
    } else {
      fetchLatestBlueprint();
    }
  }, [onTemplateLoaded, staticBlueprint]);

  if (isLoading) return <div className="p-4">Loading Form Step 3...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-gray-2 px-3 py-2 text-black outline-none dark:border-form-strokedark dark:bg-meta-4 dark:text-white";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
       <div className="border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Operation result / รายละเอียดผลการผลิต</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            {/* ... (<thead> เหมือนเดิม) ... */}
            <tbody>
              {fields.map((item, index) => {
                const config = item.config_json as IConfigJson;
                if (!config || typeof config !== 'object' || !('columns' in config)) return null;

                const isStartTimeDisabled = !config.inputs.startTime?.enabled;
                const isFinishTimeDisabled = !config.inputs.finishTime?.enabled;

                return (
                  <tr key={item.item_id}>
                    <td className={tdCenterClass}>{index + 1}</td>
                    {config.columns.map((col, colIndex) => {
                      switch (col.type) {
                        case 'DESCRIPTION':
                          return <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>{col.value}</td>;
                        
                        case 'SINGLE_INPUT_GROUP': {
                          if (!col.input) return null;
                          const fieldName = col.input.field_name.replace('{index}', String(index));
                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                                <div className="flex w-full">
                                  <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.label}</span>
                                  <input
                                    type={col.input.type || 'text'}
                                    className={`${isReadOnly ? disabledInputClass : inputClass} rounded-l-none rounded-r-none`}
                                    {...register(fieldName as any, { valueAsNumber: col.input.type === 'number' })}
                                    disabled={isReadOnly} // 👈 เพิ่ม isReadOnly
                                  />
                                  <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.unit}</span>
                                </div>
                            </td>
                          );
                        }
                        
                        // ... (case อื่นๆ) ...

                        default:
                          return <td key={colIndex}>Unsupported</td>;
                      }
                    })}
                    <td className={tdCenterClass}>
                      <input
                        type="time"
                        className={(isStartTimeDisabled || isReadOnly) ? disabledInputClass : inputClass}
                        disabled={isStartTimeDisabled || isReadOnly} // 👈 เพิ่ม isReadOnly
                        {...register(`operationResults.${index}.startTime`)}
                      />
                    </td>
                    <td className={tdCenterClass}>
                      <input
                        type="time"
                        className={(isFinishTimeDisabled || isReadOnly) ? disabledInputClass : inputClass}
                        disabled={isFinishTimeDisabled || isReadOnly} // 👈 เพิ่ม isReadOnly
                        {...register(`operationResults.${index}.finishTime`)}
                      />
                    </td>
                  </tr>
                );
              })}
              {/* แถวสำหรับ Remark */}
              <tr>
                <td className={tdLeftClass} colSpan={5}>
                  <div className="flex w-full">
                    <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">Remark</span>
                    <textarea 
                      className={`${isReadOnly ? disabledInputClass : inputClass} h-25 rounded-l-none`} 
                      {...register('operationRemark')}
                      disabled={isReadOnly} // 👈 เพิ่ม isReadOnly
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

export default FormStep3;