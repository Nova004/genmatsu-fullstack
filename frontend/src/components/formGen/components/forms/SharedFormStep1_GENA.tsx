// frontend/src/components/formGen/components/forms/SharedFormStep1.tsx

import React, { useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';
import EmployeeInputRow from './EmployeeInputRow';
import ConditionCheckItem from './ConditionCheckItem';
import { FieldErrors } from 'react-hook-form';
import ChecklistTable from './ChecklistTable';

// 1. สร้าง Interface สำหรับ Props ที่ Component นี้ต้องการ
interface SharedFormStep1Props {
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  packagingWarningItemName: string;
}

const checklistItems = [
  { id: 'butterflyValve' as const, label: 'Butterfly valve', condition: 'Turn off' },
  { id: 'coolingValve' as const, label: 'Cooling Valve', condition: 'Turn off' },
];

const SharedFormStep1: React.FC<SharedFormStep1Props> = ({ register, watch, setValue, packagingWarningItemName, errors }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const firstMcOperatorName = watch('mcOperators.0.name');
  const firstMcOperatorNo = watch('mcOperators.0.number');

  useEffect(() => {
    // ตรวจสอบว่ามีทั้ง "ชื่อ" และ "เลขที่" แล้วหรือยัง
    if (firstMcOperatorName && firstMcOperatorNo) {
      // สร้างข้อความใหม่ในรูปแบบ "ชื่อ (เลขที่)"
      const combinedValue = `${firstMcOperatorName} (${firstMcOperatorNo})`;
      setValue('checklist.coolingValve', combinedValue, { shouldValidate: true });
      setValue('checklist.butterflyValve', combinedValue, { shouldValidate: true });
    }
    // ถ้าชื่อถูกลบ (กรอกรหัสผิด) ให้เคลียร์ค่าทิ้ง
    else if (!firstMcOperatorName) {
      setValue('checklist.coolingValve', '');
      setValue('checklist.butterflyValve', '');
    }
  }, [firstMcOperatorName, firstMcOperatorNo, setValue]); // ✨ 3. เพิ่ม firstMcOperatorNo ใน dependency array

  return (
    <div>
      {/* ส่วน Basic Data (เหมือนเดิมทุกประการ) */}
      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h5 className="font-medium text-white text-lg">Basic Data (ข้อมูลทั่วไป)</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <div className="mb-6 grid grid-cols-1 gap-6 border-b border-stroke pb-6 dark:border-strokedark md:grid-cols-2">
          <div className="flex items-center">
            <label className="w-1/3 text-black dark:text-white">Date</label>
            <input type="date" className={inputClass} {...register('basicData.date', { required: true })} />
          </div>
          <div className="flex items-center">
            <label className="w-1/3 text-black dark:text-white">Machine Name</label>
            <input type="text" className={inputClass} {...register('basicData.machineName', { required: true })} />
          </div>
          <div className="flex items-center">
            <label className="w-1/3 text-black dark:text-white">Lot no.</label>
            <input type="text" className={inputClass} {...register('basicData.lotNo', { required: true })} />
          </div>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-6 border-b border-black pb-6 dark:border-strokedark lg:grid-cols-6">
          <div className="flex items-center justify-center text-center font-medium text-black dark:text-white lg:col-span-1">M/C operator</div>
          <div className="flex flex-col gap-5 lg:col-span-5">
            {[...Array(3)].map((_, index) => (
              <EmployeeInputRow key={`mc-${index}`} groupName="mcOperators" index={index} register={register} watch={watch} setValue={setValue} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
          <div className="flex items-center justify-center text-center font-medium text-black dark:text-white lg:col-span-1">Assistant M/C</div>
          <div className="flex flex-col gap-5 lg:col-span-5">
            {[...Array(5)].map((_, index) => (
              <EmployeeInputRow key={`asst-${index}`} groupName="assistants" index={index} register={register} watch={watch} setValue={setValue} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h5 className="font-medium text-white text-lg">Check List before turn on</h5>
      </div>
      {/* 3. เรียกใช้ Component พร้อมส่ง props ที่จำเป็นไปให้ */}
      <ChecklistTable
        items={checklistItems}
        register={register}
        errors={errors}
        watch={watch} // 👈 4. ส่ง watch ลงไปด้วย
      />

      {/* ส่วน Check the condition (แก้ไขเล็กน้อย) */}
      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h5 className="font-medium text-white text-lg">Check the condition (ตรวจสอบสภาพบรรจุภัณฑ์)</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <ConditionCheckItem
          index={0} title="ถุง (ภายนอก)"
          description={`เช็คสภาพถุงภายนอกและหูยกถุงบรรจุ ${packagingWarningItemName} จะต้องไม่ชำรุดและ ไม่มีรอยขาดของถุง`}
          // 3. ใช้ค่าจาก Prop มาแสดงในคำเตือน
          warning={`หากพบความผิดปกติถุง (${packagingWarningItemName}) ให้ทำการแจ้งหัวหน้างานรับทราบทันที ห้ามใช้โดยเด็ดขาดก่อนได้รับอนุญาตจากหัวหน้างาน`}
          register={register}
          watch={watch}   // 👈 ส่ง watch ลงไป
          errors={errors} // 👈 ส่ง errors ลงไป
        />
        <ConditionCheckItem
          index={1} title="กระป๋องก่อนใช้งาน"
          description="สภาพสมบูรณ์ ไม่บุบหรือเสียรูป ไม่มีเศษไม้ พลาสติก/หนังยางปนเปื้อน"
          reference="Ref : SD-GN-043 การเตรียมและการสอบคุณภาพภาชนะบรรจุวัตถุดิบ"
          register={register}
          watch={watch}   // 👈 ส่ง watch ลงไป
          errors={errors} // 👈 ส่ง errors ลงไป
        />
      </div>
    </div>
  );
};

export default SharedFormStep1;