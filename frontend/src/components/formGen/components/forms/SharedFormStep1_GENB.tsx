// frontend/src/components/formGen/components/forms/SharedFormStep1_GENB.tsx

import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';
import EmployeeInputRow from './EmployeeInputRow';
import ConditionCheckItem from './ConditionCheckItem';
import { FieldErrors } from 'react-hook-form';

// 1. สร้าง Interface สำหรับ Props ที่ Component นี้ต้องการ
interface SharedFormStep1Props {
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  packagingWarningItemName: string;
}

const SharedFormStep1: React.FC<SharedFormStep1Props> = ({ register, watch, setValue, packagingWarningItemName, errors }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

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
        <div className="mb-6 grid grid-cols-1 gap-6 border-b border-stroke pb-6 dark:border-strokedark lg:grid-cols-6">
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

      {/* ส่วน Check the condition (แก้ไขเล็กน้อย) */}
       <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h5 className="font-medium text-white text-lg">Check the condition (ตรวจสอบสภาพบรรจุภัณฑ์)</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <ConditionCheckItem
          index={0} title="ถุง (ภายนอก)"
          description="เช็คสภาพถุงภายนอกและหูยกถุงบรรจุจะต้องไม่ชำรุด และไม่มีรอยขาดของถุง"
          // 3. ใช้ค่าจาก Prop มาแสดงในคำเตือน
          warning={`หากพบความผิดปกติถุง (${packagingWarningItemName}) ให้ทำการแจ้งหัวหน้างานรับทราบทันที ห้ามใช้โดยเด็ดขาดก่อนได้รับอนุญาตจากหัวหน้างาน`}
          register={register}
          watch={watch}   // 👈 ส่ง watch ลงไป
          errors={errors} // 👈 ส่ง errors ลงไป
        />
        <ConditionCheckItem
          index={1} title="ถุงสำหรับใส่กากเก็นและฝุ่น"
          description="การรัดปากถุงสำหรับใส่กากเก็นและฝุ่นมีสภาพที่สมบูรณ์ถูกต้อง"
          register={register}
          watch={watch}   // 👈 ส่ง watch ลงไป
          errors={errors} // 👈 ส่ง errors ลงไป
        />
        <ConditionCheckItem
          index={2} title="กระป๋องก่อนใช้งาน"
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