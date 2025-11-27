import React, { useRef, useEffect } from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';

interface ValidatedInputProps {
  config: IStep2ConfigJson;
  inputIndex?: number;
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

const formatNumberPreserve = (num: number | string): string => {
  const numericVal = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numericVal)) return String(num);

  const multiplier = 100000000;
  const cleanNum = Math.round(numericVal * multiplier) / multiplier;
  let str = cleanNum.toString();
  const parts = str.split('.');

  if (parts.length === 1) return str + ".00";
  if (parts[1].length === 1) return str + "0";
  return str;
};

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
      } else { return undefined; }
    }
    return current;
  };
  const fieldError = getFieldError(fieldName);

  const internalRef = useRef<HTMLInputElement | null>(null);

  const { ref: formRef, ...restRegister } = register(fieldName, {
    valueAsNumber: false,
    validate: (value: any) => {
        if (!validationRules) return true;
        // ถ้าเป็น Text ไม่ต้อง Validate ตัวเลข (หรือจะเพิ่มเงื่อนไขเฉพาะก็ได้)
        if (inputConfig.type !== 'number' && typeof value === 'string') return true; 
        
        if (value === 0 || value === '0' || value === '-') return true;
        if (value === null || value === '' || value === undefined) return true;

        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) return validationRules.errorMessage || 'กรุณากรอกเป็นตัวเลข';
        
        switch (validationRules.type) {
            case 'RANGE_TOLERANCE':
            case 'RANGE_DIRECT':
                if (validationRules.min !== undefined && validationRules.max !== undefined) {
                    if (numericValue < validationRules.min || numericValue > validationRules.max) {
                        return validationRules.errorMessage || `ค่าต้องอยู่ระหว่าง ${validationRules.min} - ${validationRules.max}`;
                    }
                }
                return true;
            case 'MAX_VALUE':
                if (validationRules.max !== undefined) {
                    if (numericValue > validationRules.max) {
                        return validationRules.errorMessage || `ค่าต้องไม่เกิน ${validationRules.max}`;
                    }
                }
                return true;
            default: return true;
        }
    }
  });

  // useEffect สำหรับช่อง Disabled
  useEffect(() => {
    // 🔥 เพิ่มเงื่อนไข: ทำเฉพาะ inputConfig.type === 'number' เท่านั้น
    if (inputConfig.type === 'number' && inputConfig.is_disabled && internalRef.current && internalRef.current.value) {
        const currentVal = parseFloat(internalRef.current.value);
        if(!isNaN(currentVal)) {
            internalRef.current.value = formatNumberPreserve(currentVal);
        }
    }
  });

  return (
    <div className='relative pt-2 pb-6'>
      <input
        // ถ้าเป็น number ให้เปลี่ยนเป็น text เพื่อโชว์ .00
        // แต่ถ้า config มาเป็น text (Lot No.) ก็ให้เป็น text ตามเดิม
        type={(inputConfig.type === 'number' && inputConfig.is_disabled) ? 'text' : (inputConfig.type || 'text')}
        step="any"
        className={`${inputConfig.is_disabled ? disabledInputClass : inputClass} ${fieldError ? 'border-meta-1 focus:border-meta-1' : ''}`}
        disabled={inputConfig.is_disabled}

        {...restRegister}
        
        ref={(e) => {
            formRef(e); 
            internalRef.current = e; 
        }}

        onBlur={(e) => {
          // 🔥 เพิ่มเงื่อนไข: ถ้าไม่ใช่ type number (เช่น Lot No.) ห้ามไปยุ่งกับมัน
          if (inputConfig.type === 'number' && !inputConfig.is_disabled && e.target.value) {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              e.target.value = formatNumberPreserve(val);
              restRegister.onChange(e); 
            }
          }
          restRegister.onBlur(e);
        }}
      />
      {fieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{fieldError.message as string}</span>}
    </div>
  );
};

export default ValidatedInput;