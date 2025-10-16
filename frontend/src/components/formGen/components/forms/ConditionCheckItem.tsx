// src/components/formGen/components/forms/ConditionCheckItem.tsx

import React from 'react';
import { ConditionCheckItemProps } from '../../pages/types';


const ConditionCheckItem: React.FC<ConditionCheckItemProps> = ({ index, title, description, warning, reference, register, watch, errors, }) => {
  const inputGroupClass = "flex w-full";
  const spanClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";
  const textareaClass = "w-full h-[100px] rounded-r-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const statusValue = watch(`conditions.${index}.status`);

  return (
    <div className="mb-5 border-b border-stroke pb-5 dark:border-strokedark">
      {/* ส่วน Title และ Description (เหมือนเดิม) */}
      <div className="mb-3">
        <h5 className="font-semibold text-black dark:text-white">{title}</h5>
        <p className="text-sm">{description}</p>
        {reference && <p className="mt-1 text-xs text-slate-500">{reference}</p>}
      </div>

      {/* 🚀 โค้ดที่แก้ไข Layout ใหม่ทั้งหมด */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-0">

        {/* --- ส่วนของ Radio OK/NG --- */}
        {/* กำหนดความกว้างคงที่ให้ส่วนนี้ เพื่อให้ส่วนของหมายเหตุขยายเต็มที่ */}
        <div className="flex flex-shrink-0 items-center gap-x-5 md:w-40">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              value="OK"
              {...register(`conditions.${index}.status`, {
                required: "กรุณาเลือกสถานะ"
              })}
            />
            <span>OK</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              value="NG"
              {...register(`conditions.${index}.status`, {
                required: "กรุณาเลือกสถานะ"
              })}
            />
            <span>NG</span>
          </label>
        </div>

        {/* --- ส่วนของ หมายเหตุ --- */}
        {/* ใช้ flex-grow เพื่อให้ส่วนนี้ขยายเต็มพื้นที่ที่เหลือ */}
        <div className="w-full flex-grow">
          <div className={inputGroupClass}>
            <span className={spanClass}>หมายเหตุ</span>
            <textarea
              className={textareaClass}
              {...register(`conditions.${index}.remark`, {
                validate: value =>
                  statusValue !== 'NG' ||
                  (value && value.trim() !== '') ||
                  'กรุณากรอกหมายเหตุเมื่อเลือก NG'
              })}
            />
          </div>
          {/* ส่วนแสดง Error (เหมือนเดิม) */}
          {errors.conditions?.[index]?.status && !errors.conditions?.[index]?.remark && (
            <p className="mt-1 text-sm text-danger">
              {errors.conditions[index]?.status?.message}
            </p>
          )}
          {errors.conditions?.[index]?.remark && (
            <p className="mt-1 text-sm text-danger">
              {errors.conditions[index]?.remark?.message}
            </p>
          )}
        </div>
      </div>

      {warning && <p className="mt-4 text-sm text-meta-1">{warning}</p>}
    </div>
  );
}

export default ConditionCheckItem;