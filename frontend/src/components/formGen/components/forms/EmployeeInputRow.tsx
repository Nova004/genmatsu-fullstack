// src/components/forms/EmployeeInputRow.tsx

import React from 'react';
import { EmployeeInputRowProps } from '../../pages/BZ_Form/types';

const EmployeeInputRow: React.FC<EmployeeInputRowProps> = ({ groupName, index, register }) => {
  const inputGroupClass = "flex w-full";
  const spanClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";
  const inputClass = "w-full rounded-r-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} dark:!bg-gray-700 !bg-gray-200`;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div className={inputGroupClass}> <span className={spanClass}>รหัสพนักงาน</span> <input type="text" className={inputClass} {...register(`${groupName}.${index}.id`)} /> </div>
      <div className={inputGroupClass}> <span className={spanClass}>ชื่อ-นามสกุล</span> <input type="text" className={disabledInputClass} readOnly disabled {...register(`${groupName}.${index}.name`)} /> </div>
      <div className={inputGroupClass}> <span className={spanClass}>เลขที่</span> <input type="text" className={disabledInputClass} readOnly disabled {...register(`${groupName}.${index}.number`)} /> </div>
    </div>
  );
};

export default EmployeeInputRow;