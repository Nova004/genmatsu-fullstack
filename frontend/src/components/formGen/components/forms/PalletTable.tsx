// src/components/forms/PalletTable.tsx

import React from 'react';
import { PalletTableProps } from '../../pages/types';

const PalletTable: React.FC<PalletTableProps> = ({ 
  register, 
  title, 
  numberOfRows, 
  fieldName 
}) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = "border-b border-stroke px-4 py-3 text-center align-middle text-black dark:border-strokedark dark:text-white";

  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h4 className="font-medium text-white text-lg">{title}</h4>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className={thClass}>No.</th>
              <th className={thClass}>Q'ty</th>
              <th className={thClass}>Can No.</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(numberOfRows)].map((_, index) => (
              <tr key={index}>
                <td className={tdCenterClass}><input type="text" className={inputClass} {...register(`${fieldName}.${index}.no`)} /></td>
                <td className={tdCenterClass}><input type="text" className={inputClass} {...register(`${fieldName}.${index}.qty`)} /></td>
                <td className={tdCenterClass}><input type="text" className={inputClass} {...register(`${fieldName}.${index}.canNo`)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PalletTable;