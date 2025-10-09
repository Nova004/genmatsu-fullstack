// frontend/src/components/formGen/components/forms/ValidatedInput.tsx

import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';

// 1. กำหนด Props ที่ Component ต้องการ
interface ValidatedInputProps {
  config: IStep2ConfigJson;
  inputIndex?: number;
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({ config, inputIndex = 0, register, errors }) => {
  // 2. ย้าย ClassNames เข้ามาใน Component
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";

  const inputConfig = config.inputs[inputIndex];
  if (!inputConfig) return null;

  const fieldName = inputConfig.field_name as Path<IManufacturingReportForm>;
  const validationRules = inputConfig.validation || config.validation;

  // 3. ปรับปรุงการเข้าถึง Error ให้ปลอดภัยขึ้น
  const getFieldError = (path: string) => {
    const pathArray = path.split('.');
    let current: any = errors;
    for (const key of pathArray) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const fieldError = getFieldError(fieldName);

  return (
    <div className='relative pt-2 pb-6'>
      <input
        type={inputConfig.type || 'text'}
        className={inputConfig.is_disabled ? disabledInputClass : inputClass}
        disabled={inputConfig.is_disabled}
        {...register(fieldName, {
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

export default ValidatedInput;