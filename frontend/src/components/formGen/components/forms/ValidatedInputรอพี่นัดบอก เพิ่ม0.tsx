import React, { useRef, useEffect } from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';

interface ValidatedInputProps {
  config: IStep2ConfigJson;
  inputIndex?: number;
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

// ฟังก์ชันจัดรูปแบบตัวเลข (Utility)
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

  // ฟังก์ชันดึง Error Message จาก Object ที่ซ้อนกัน
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

  // 1. สร้าง Ref ภายในเพื่อเข้าถึง DOM ของ Input โดยตรง
  const internalRef = useRef<HTMLInputElement | null>(null);

  // 2. Setup Register และ Validation Logic
  const { ref: formRef, ...restRegister } = register(fieldName, {
    valueAsNumber: false, // ต้องเป็น false เพื่อเก็บค่า String "25.00" ได้ (ระบบคำนวณจะ parseFloat เอง)
    validate: (value: any) => {
        if (!validationRules) return true;
        if (value === 0 || value === '0' || value === '-') return true;
        if (value === null || value === '' || value === undefined) return true;

        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) return validationRules.errorMessage || 'กรุณากรอกเป็นตัวเลข';
        
        // ตรวจสอบเงื่อนไขต่างๆ
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

  // 3. Magic UseEffect: บังคับแสดงผล .00 ในช่อง Disabled
  useEffect(() => {
    // ทำงานเฉพาะช่องที่ถูก Disabled และมีค่าอยู่
    if (inputConfig.is_disabled && internalRef.current && internalRef.current.value) {
        const currentVal = parseFloat(internalRef.current.value);
        if(!isNaN(currentVal)) {
            // "แอบ" เปลี่ยนค่าที่แสดงบนหน้าจอให้มี .00 (ไม่มีผลกับข้อมูลจริงใน React Hook Form)
            internalRef.current.value = formatNumberPreserve(currentVal);
        }
    }
  }); // ไม่ใส่ Dependency เพื่อให้รันทุกครั้งที่ Render (เผื่อค่าเปลี่ยน)

  return (
    <div className='relative pt-2 pb-6'>
      <input
        // บังคับเป็น text หาก disabled เพื่อป้องกัน Browser ตัดเลข 0
        type={inputConfig.is_disabled ? 'text' : (inputConfig.type || 'text')}
        step="any"
        className={`${inputConfig.is_disabled ? disabledInputClass : inputClass} ${fieldError ? 'border-meta-1 focus:border-meta-1' : ''}`} // เพิ่มสีแดงที่ขอบถ้ามี Error
        disabled={inputConfig.is_disabled}

        {...restRegister}
        
        // รวม Ref: ให้ทั้ง RHF และเราเข้าถึง Input ได้
        ref={(e) => {
            formRef(e); 
            internalRef.current = e; 
        }}

        // onBlur: จัดการ Format เมื่อ User พิมพ์เสร็จ (เฉพาะช่องที่พิมพ์ได้)
        onBlur={(e) => {
          if (!inputConfig.is_disabled && e.target.value) {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              // Format ค่าแล้วส่งกลับเข้า Form
              e.target.value = formatNumberPreserve(val);
              restRegister.onChange(e); 
            }
          }
          restRegister.onBlur(e);
        }}
      />
      {/* แสดงข้อความ Error สีแดงด้านล่าง */}
      {fieldError && (
        <span className="absolute left-0 -bottom-1 text-sm text-meta-1">
            {fieldError.message as string}
        </span>
      )}
    </div>
  );
};

export default ValidatedInput;