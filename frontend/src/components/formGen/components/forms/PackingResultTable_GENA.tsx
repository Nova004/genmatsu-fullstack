// src/components/forms/PackingResultTable.tsx

import React, { useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';

// 1. เพิ่ม cansMultiplier เข้าไปใน Props
interface PackingResultTableProps {
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  cansMultiplier: number; // Prop ใหม่สำหรับรับค่าตัวคูณ
}

const PackingResultTable: React.FC<PackingResultTableProps> = ({ register, watch, setValue, cansMultiplier }) => {
  // --- ส่วนจัดการ Class ของ UI (เหมือนเดิม) ---
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-slate-100 px-3 py-2 text-slate-500 outline-none dark:border-form-strokedark dark:bg-slate-800 dark:text-slate-400";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  // --- Logic การคำนวณ ---
  const quantityOfCans = watch('packingResults.quantityOfProduct.cans');

  useEffect(() => {
    if (quantityOfCans === null || quantityOfCans === undefined) {
      setValue('packingResults.quantityOfProduct.calculated', null);
      return;
    }

    const calculatedValue = Number(quantityOfCans) * cansMultiplier;
    setValue('packingResults.quantityOfProduct.calculated', calculatedValue);

  }, [quantityOfCans, setValue, cansMultiplier]); // เพิ่ม cansMultiplier ใน dependency array


  return (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full table-auto">
        <tbody>
          <tr>
            <td className={tdLeftClass} colSpan={2}>Quantity<br></br>(จำนวนถังเต็ม x 150 kg.) + น้ำหนักถังเศษ</td>
            <td className={tdCenterClass}><input type="number" className={inputClass} {...register('packingResults.quantityOfProduct.cans', { valueAsNumber: true })} /></td>
            {/* 3. แสดงผลค่าตัวคูณแบบ Dynamic */}
            <td className={tdCenterClass}>Cans x {cansMultiplier} KG + </td>
            <td className={tdLeftClass}> <div className="flex items-center"> <input type="number" className={inputClass} {...register('packingResults.weighttank.tank', { valueAsNumber: true })} /><span className="ml-2">KG</span></div></td>
            <td className={tdCenterClass}>=</td>
            <td className={tdCenterClass}><div className="flex items-center"><input type="number" className={disabledInputClass} readOnly disabled {...register('packingResults.quantityOfProduct.calculated')} /><span className="ml-2">KG</span></div></td>
          </tr>
          <tr>
            <td className={tdLeftClass} colSpan={2}>Remain</td>
            <td className={tdCenterClass}><div className="flex items-center"> <input type="number" className={inputClass} {...register('packingResults.remain')} /><span className="ml-2">KG</span></div> </td>
            <td className={tdLeftClass} colSpan={4}><span className="text-s">(Genmatsu ที่ผ่านการผลิตเรียบร้อยแล้ว ถูกแบ่งเก็บไว้สำหรับเทปิดรูวาล์วในการผลิตครั้งต่อไป)</span></td>
          </tr>
          <tr>
            <td className={tdLeftClass} colSpan={2}>Scrape on 30 mesh</td>
            <td className={tdCenterClass}><div className="flex items-center"><input type="number" step="any" className={inputClass} {...register('packingResults.meshPass40', { valueAsNumber: true })} /><span className="ml-2">KG</span></div></td>
            <td className={tdLeftClass} colSpan={3}><span className="text-s"> (เก็นที่จับเป็นก้อนซึ่งเป็นของเสียที่ไม่สามารถส่ง Production ได้)</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PackingResultTable;