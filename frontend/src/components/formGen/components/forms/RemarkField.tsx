
import React from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';

interface RemarkFieldProps<T extends FieldValues> {
    label?: string;
    name: Path<T>;
    register: UseFormRegister<T>;
    error?: FieldError;
    placeholder?: string;
    rows?: number;
    className?: string;
    defaultValue?: string;
    disabled?: boolean;
    required?: boolean;
}

const RemarkField = <T extends FieldValues>({
    label = "Remark (หมายเหตุ)",
    name,
    register,
    error,
    placeholder = "ระบุหมายเหตุเพิ่มเติม...",
    rows = 3,
    className = "",
    defaultValue,
    disabled = false,
    required = false
}: RemarkFieldProps<T>) => {

    const baseInputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
    const errorClass = "border-meta-1 focus:border-meta-1";
    const disabledClass = "disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400";

    // Combine classes
    const inputClassName = `${baseInputClass} ${error ? errorClass : ''} ${disabled ? disabledClass : ''} ${className}`;

    return (
        <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
                {label} {required && <span className="text-meta-1">*</span>}
            </label>
            <div className="relative z-0">
                <textarea
                    rows={rows}
                    placeholder={placeholder}
                    className={inputClassName}
                    disabled={disabled}
                    defaultValue={defaultValue}
                    {...register(name, { required: required ? "กรุณาระบุหมายเหตุ" : false })}
                ></textarea>
                {error && (
                    <span className="text-sm text-meta-1 mt-1 block">
                        {error.message}
                    </span>
                )}
            </div>
        </div>
    );
};

export default RemarkField;
