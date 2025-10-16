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
  const disabledInputClass = `${inputClass} cursor-not-allowed bg-gray-2 dark:bg-form-input-disabled`;

  // ดักฟังชื่อ operator จากฟอร์มหลัก
  const operatorName = watch('mcOperators.0.name'); 
  
  return (
    <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Item
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Condition / Standard
            </th>
            <th className="w-2/5 px-4 py-4 font-medium text-black dark:text-white">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            // ✨ ย้าย Logic การตรวจสอบเงื่อนไขมาไว้ข้างใน .map()
            // เพื่อให้ตรวจสอบสำหรับแต่ละ item ที่กำลังวนลูปอยู่
            const isLinkedAndFilled = !!(item.isOperatorCheck && operatorName);

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
                    placeholder="Enter result"
                    // กำหนด className และ disabled จากผลลัพธ์ของ isLinkedAndFilled
                    className={isLinkedAndFilled ? disabledInputClass : inputClass}
                    {...register(`checklist.${item.id}`, { required: 'กรุณากรอกข้อมูล' })}
                    disabled={isLinkedAndFilled}
                  />
                  {/* การแสดงผล Error (ถูกต้องแล้ว) */}
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