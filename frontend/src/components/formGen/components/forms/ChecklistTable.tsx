// frontend/src/components/formGen/components/forms/ChecklistTable.tsx

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';

// กำหนด Type สำหรับข้อมูลแต่ละแถวในตาราง
interface ChecklistItem {
  id: keyof IManufacturingReportForm['checklist'];
  label: string;
  condition: string;
  isOperatorCheck?: boolean;

}

// กำหนด Props ที่ Component ต้องการ
interface ChecklistTableProps {
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  items: ChecklistItem[];
  watch: UseFormWatch<IManufacturingReportForm>;
}

const ChecklistTable: React.FC<ChecklistTableProps> = ({ register, errors, items, watch }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";

  // ดักฟังชื่อ operator จากฟอร์มหลัก (เหมือนเดิม)
  const operatorName = watch('mcOperators.0.name');

  return (
    <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
      <table className="w-full table-auto">
        {/* ... ส่วน aheader (เหมือนเดิม) ... */}
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Item
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Condition / Standard
            </th>
            <th className="w-2/5 px-4 py-4 font-medium text-black dark:text-white">
              Check by.
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            // Logic การตรวจสอบเงื่อนไข (เหมือนเดิม)
            const isLinkedAndFilled = !!(item.isOperatorCheck && operatorName);

            // ✨ 1. "ดักฟัง" ค่าของ input ช่องนี้โดยเฉพาะ
            const currentValue = watch(`checklist.${item.id}`);

            return (
              <tr key={item.id}>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="text-black dark:text-white">{item.label}</p>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="text-black dark:text-white">{item.condition}</p>
                </td>
             <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <input
                    type="text"
                    
                    placeholder={!currentValue ? '-' : 'กรอกผลลัพธ์'}
                    
                    // 1. ใช้ disabledClass ตลอด (เหมือนเดิม ถูกแล้ว)
                    className={disabledInputClass} 
                    
                    {...register(`checklist.${item.id}`)}

                    // 2. ให้มัน readOnly "ตลอดเวลา" (ตามที่คุณอธิบาย)
                    //    (ลบ disabled={isLinkedAndFilled} ทิ้งไปเลยครับ)
                    readOnly 
                  />
                  {/* การแสดงผล Error (เหมือนเดิม) */}
                  {errors.checklist?.[item.id] && (
                    <p className="mt-1 text-sm text-danger">
                      {(errors.checklist as any)[item.id].message}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ChecklistTable;