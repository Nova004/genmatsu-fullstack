// src/pages/BZ_Form/FormStep1.tsx

import React from 'react';
import { FormStepProps, IManufacturingReportForm } from './types';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import EmployeeInputRow from '../../components/forms/EmployeeInputRow';
import ConditionCheckItem from '../../components/forms/ConditionCheckItem';

// สร้าง Interface สำหรับ Props ของหน้านี้โดยเฉพาะ
interface FormStep1Props extends FormStepProps {
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
}

// ======================================================
// === 1. แก้ไขตรงนี้: ให้รับ Props ตาม Interface ตัวใหม่ (FormStep1Props) ===
// ======================================================
const FormStep1: React.FC<FormStep1Props> = ({ register, watch, setValue }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  
  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Basic Data (ข้อมูลทั่วไป)</h5>
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
            {/* ====================================================== */}
            {/* === 2. แก้ไขตรงนี้: ส่ง watch และ setValue เข้าไปด้วย === */}
            {/* ====================================================== */}
            {[...Array(3)].map((_, index) => (
              <EmployeeInputRow 
                key={`mc-${index}`} 
                groupName="mcOperators" 
                index={index} 
                register={register} 
                watch={watch} 
                setValue={setValue} 
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
          <div className="flex items-center justify-center text-center font-medium text-black dark:text-white lg:col-span-1">Assistant M/C</div>
          <div className="flex flex-col gap-5 lg:col-span-5">
            {[...Array(5)].map((_, index) => (
              <EmployeeInputRow 
                key={`asst-${index}`} 
                groupName="assistants" 
                index={index} 
                register={register} 
                watch={watch} 
                setValue={setValue} 
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Check the condition (ตรวจสอบสภาพบรรจุภัณฑ์)</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <ConditionCheckItem
          index={0} title="ถุง (ภายนอก)"
          description="เช็คสภาพถุงภายนอกและหูยกถุงบรรจุจะต้องไม่ชำรุด และไม่มีรอยขาดของถุง"
          warning="หากพบความผิดปกติถุง (CG1) ให้ทำการแจ้งหัวหน้างานรับทราบทันที ห้ามใช้โดยเด็ดขาดก่อนได้รับอนุญาตจากหัวหน้างาน"
          register={register}
        />
        <ConditionCheckItem
          index={1} title="ถุงสำหรับใส่กากเก็นและฝุ่น"
          description="การรัดปากถุงสำหรับใส่กากเก็นและฝุ่นมีสภาพที่สมบูรณ์ถูกต้อง"
          register={register}
        />
        <ConditionCheckItem
          index={2} title="กระป๋องก่อนใช้งาน"
          description="สภาพสมบูรณ์ ไม่บุบหรือเสียรูป ไม่มีเศษไม้ พลาสติก/หนังยางปนเปื้อน"
          reference="Ref : SD-GN-043 การเตรียมและการสอบคุณภาพภาชนะบรรจุวัตถุดิบ"
          register={register}
        />
      </div>
    </div>
  );
};

export default FormStep1;