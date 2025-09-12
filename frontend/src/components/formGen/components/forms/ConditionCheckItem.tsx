// src/components/forms/ConditionCheckItem.tsx

import React from 'react';
import { ConditionCheckItemProps } from '../../pages/BZ_Form/types';

const ConditionCheckItem: React.FC<ConditionCheckItemProps> = ({ index, title, description, warning, reference, register }) => {
  const inputGroupClass = "flex w-full";
  const spanClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";
  const textareaClass = "w-full h-[100px] rounded-r-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

  return (
    <div className="grid grid-cols-12 gap-4 border-t border-stroke py-5 dark:border-strokedark">
      <div className="col-span-12 md:col-span-8">
        <h5 className="mb-2 text-lg font-bold text-black dark:text-white">{`${index + 1}. ${title}`}</h5>
        <p className="mb-4 text-black dark:text-white">{description}</p>
        <div className={inputGroupClass}> <span className={spanClass}>หมายเหตุ</span> <textarea className={textareaClass} {...register(`conditions.${index}.remark`)} /> </div>
        {warning && <p className="mt-4 text-sm text-meta-1">{warning}</p>}
      </div>
      <div className="col-span-12 flex items-center justify-center md:col-span-4">
        <div className="flex gap-x-6">
          <label className="flex cursor-pointer select-none items-center gap-2"> <input type="radio" value="OK" {...register(`conditions.${index}.status`)} /> <span className="font-medium">OK</span> </label>
          <label className="flex cursor-pointer select-none items-center gap-2"> <input type="radio" value="NG" {...register(`conditions.${index}.status`)} /> <span className="font-medium">NG</span> </label>
        </div>
      </div>
      {reference && <p className="col-span-12 text-xs text-gray-500">{reference}</p>}
    </div>
  );
}

export default ConditionCheckItem;