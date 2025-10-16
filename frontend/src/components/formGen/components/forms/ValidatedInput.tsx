import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';

interface ValidatedInputProps {
  config: IStep2ConfigJson;
  inputIndex?: number;
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({ config, inputIndex = 0, register, errors }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";

  const inputConfig = config.inputs[inputIndex];
  if (!inputConfig) return null;

  const fieldName = inputConfig.field_name as Path<IManufacturingReportForm>;
  const validationRules = inputConfig.validation || config.validation;

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
            if (!validationRules) {
              return true;
            }

            // ✨ แก้ไขจุดนี้: เพิ่ม `value === 0` (แบบตัวเลข) เข้าไปในเงื่อนไข
            if (value === 0 || value === '0' || value === '-') {
              return true;
            }

            if (value === null || value === '' || value === undefined) {
              return true;
            }
            
            const numericValue = parseFloat(value);
            if (isNaN(numericValue)) {
                return validationRules.errorMessage || 'กรุณากรอกเป็นตัวเลข';
            }

            switch (validationRules.type) {
              case 'RANGE_TOLERANCE':
              case 'RANGE_DIRECT':
                if (validationRules.min !== undefined && validationRules.max !== undefined) {
                  return (numericValue >= validationRules.min && numericValue <= validationRules.max) || validationRules.errorMessage;
                }
                return true;
              case 'MAX_VALUE':
                if (validationRules.max !== undefined) {
                  return (numericValue <= validationRules.max) || validationRules.errorMessage;
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