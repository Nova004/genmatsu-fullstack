// frontend/src/components/formGen/components/forms/RawMaterialTableRows.tsx

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';
import ValidatedInput from './ValidatedInput';

interface RawMaterialTableRowsProps {
  fields: any[];
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

const RawMaterialTableRows: React.FC<RawMaterialTableRowsProps> = ({ fields, register, errors }) => {
  // ย้าย ClassNames ที่จำเป็นสำหรับการแสดงผลมาไว้ที่นี่
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";

  return (
    <>
      {fields.map(field => {
        const config = field.config_json as IStep2ConfigJson;

        switch (config.row_type) {
          case 'SINGLE_INPUT':
            // จัดการ case พิเศษของ diaEarth ที่นี่
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
                      {fieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{fieldError.message as string}</span>}
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
                  <ValidatedInput config={config} register={register} errors={errors} />
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
                  <ValidatedInput config={config} register={register} errors={errors} />
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
                  <ValidatedInput config={config} inputIndex={0} register={register} errors={errors} />
                </td>
                <td className={tdCenterClass}>{config.std_value}</td>
                <td className={tdCenterClass}>
                  <ValidatedInput config={config} inputIndex={1} register={register} errors={errors} />
                </td>
                <td className={tdCenterClass}>{config.unit}</td>
              </tr>
            );

          default:
            return null;
        }
      })}
    </>
  );
};

export default RawMaterialTableRows;