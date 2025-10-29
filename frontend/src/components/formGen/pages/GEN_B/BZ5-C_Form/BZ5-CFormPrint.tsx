// location: frontend/src/components/formGen/pages/BZ5-C_Form/BZ5-CFormPrint.tsx
// (ฉบับจัด Layout A4 หน้าเดียว - ยึด Logic เดิมของคุณ)

// Import Library ที่จำเป็นจาก React และ React Hook Form
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IManufacturingReportForm } from '../../types';
import { useNavigate } from 'react-router-dom';

// Import Component ของแต่ละ Step ที่จะนำมาใช้ซ้ำในการแสดงผล
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENB';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENB';
import ProgressBar from '../../../components/ProgressBar';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
import { useProductionForm } from '../../../../../hooks/useProductionForm';


// สร้าง Interface เพื่อกำหนดว่า BZ5-CFormPrint ต้องรับข้อมูลอะไรเข้ามาบ้าง
interface BZ5_CFormPrintProps {
  formData: IManufacturingReportForm; // 1. ข้อมูลที่ถูกบันทึกไว้จากฐานข้อมูล
  blueprints: any;                   // 2. "พิมพ์เขียว" (Master Template) ที่ใช้ตอนบันทึก
  isReadOnly: boolean;               // 3. ตัวแปรสำหรับบอกว่าเป็นโหมด "อ่านอย่างเดียว" หรือไม่
}

const BZ5_C_VALIDATION_SCHEMA = {
  1: {
    fields: ['basicData.date', 'basicData.machineName', 'basicData.lotNo'],
    scope: 'basicData',
    message: 'กรุณากรอกข้อมูลวันที่, เครื่อง, และ Lot No. ให้ครบถ้วน',
  },
  2: {
    fields: 'rawMaterials',
    scope: 'rawMaterials',
    message: 'กรุณาตรวจสอบข้อมูลวัตถุดิบให้ถูกต้อง',
  },
  3: {
    fields: ['conditions', 'operationResults', 'operationRemark'],
    message: 'กรุณาตรวจสอบข้อมูลเงื่อนไขและผลการปฏิบัติงานให้ถูกต้อง',
  },
};
// --- ส่วน Component หลัก ---
const BZ5_CFormPrint: React.FC<BZ5_CFormPrintProps> = ({ formData, blueprints, isReadOnly }) => {

  // --- (ส่วน Logic: ยึดตามโค้ดของคุณเป๊ะๆ) ---
  const totalSteps = 4;
  const navigate = useNavigate();
  const { formMethods } = useProductionForm({
    formType: 'BZ5-C',
    netWeightOfYieldSTD: 800,
  });
  const methods = useForm<IManufacturingReportForm>({  // ใช้ useForm เพื่อจัดการฟอร์ม
    defaultValues: formData,
    mode: 'onChange',      // 👈 เพิ่มโหมดการทำงาน
    criteriaMode: "all", // 👈 บอกให้รายงานข้อผิดพลาดทั้งหมด
  });


  // ใช้ useEffect เพื่อคอย "จับตาดู" การเปลี่ยนแปลงของ `formData`
  useEffect(() => {
    if (formData) {
      // ให้ "ล้าง" ฟอร์มและ "เติม" ข้อมูลใหม่เข้าไปทันที เพื่อให้หน้าจออัปเดต
      methods.reset(formData);
    }
  }, [formData, methods]);

  useEffect(() => {
    // ใช้ setTimeout เล็กน้อยเพื่อให้แน่ใจว่าฟอร์มได้ reset ค่าใหม่เข้าไปเรียบร้อยแล้ว
    const timer = setTimeout(() => {
      // สั่งให้ react-hook-form ตรวจสอบค่าทั้งหมดในฟอร์ม
      methods.trigger();
    }, 100); // delay 100ms

    return () => clearTimeout(timer); // cleanup function
  }, [formData, methods]); // ให้ re-trigger ทุกครั้งที่ formData เปลี่ยนแปลง

  // สร้าง Object `formStepProps` เพื่อรวบรวม Props ที่ต้องส่งให้ทุก Step ไว้ในที่เดียว
  const formStepProps = {
    ...methods, // ส่งทุกฟังก์ชันจาก `useForm` (register, watch, setValue, etc.)
    errors: methods.formState.errors, // ส่ง state ของ error ไปด้วย
    isReadOnly: isReadOnly, // 👈 (แก้ไข) ผมขอแก้ 'false' เป็น 'isReadOnly' เพื่อให้มันอ่านอย่างเดียว
    onTemplateLoaded: () => { },       // สร้างฟังก์ชันเปล่าๆ สำหรับ Prop นี้ เพราะในโหมด Print เราไม่ต้องการโหลด Template ใหม่
  };
  // --- (สิ้นสุดส่วน Logic) ---


  // --- (แก้ไข) ส่วนการแสดงผล (JSX) ---
  //
  // นี่คือส่วนที่ผม "จัดเรียง" ใหม่ครับ
  //
  // --- (แก้ไข) ส่วนการแสดงผล (JSX) ---
  return (
    <FormProvider {...methods}>
      {/* ‼️ [แก้ไข] เปลี่ยนเป็น flex-col ‼️ */}
      <div className="a4-page-container rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark flex flex-col"> {/* 👈 เปลี่ยน */}

        {/* === ส่วนหน้า 1 === */}
        {/* ‼️ [แก้ไข] เปลี่ยนเป็น w-full ‼️ */}
        <div className="flex w-full flex-col border-r border-stroke dark:border-strokedark"> {/* 👈 เปลี่ยน */}

          {/* --- Section 1 (Header) --- */}
          <div className="form-section p-1 md:p-1 border-b border-stroke dark:border-strokedark">
            {/* ผมเดาว่า Component Step 1 ของ BZ5-C น่าจะชื่อประมาณนี้นะครับ */}
            <SharedFormStep1 {...formStepProps} packagingWarningItemName="RC-417" />
          </div>

          {/* --- Section 2 (Raw Materials) --- */}
          <div className="form-section print-step3-compact p-2 md:p-4 border-b border-stroke dark:border-strokedark">
            {/* ผมเดาว่า Component Step 2 ของ BZ5-C น่าจะชื่อประมาณนี้นะครับ */}
            {/* และต้องส่ง Blueprint ที่ถูกต้องเข้าไปด้วย */}
            <FormStep2 {...formStepProps} staticBlueprint={blueprints['BZ5-C_Step2_RawMaterials']} />
          </div>
        </div>

        {/* ------------------------------------------- */}
        {/* --- ‼️ [จุดตัดหน้า] ‼️ --- */}
        {/* ------------------------------------------- */}

        {/* === ส่วนหน้า 2 === */}
        {/* ‼️ [แก้ไข] เปลี่ยนเป็น w-full และเพิ่ม style ‼️ */}
        <div
          className="flex w-full flex-col"  // 👈 เปลี่ยน
          style={{ pageBreakBefore: 'always' }} // 👈 เพิ่ม
        >

          {/* --- Section 3 (Operations) --- */}
          <div className="form-section p-2 md:p-4 border-b border-stroke dark:border-strokedark">
            {/* ต้องส่ง Blueprint ที่ถูกต้องเข้าไป */}
            <SharedFormStep3 {...formStepProps} staticBlueprint={blueprints['BZ5-C_Step3_Operations']} templateName="BZ5-C_Step3_Operations" />
          </div>

        </div>
        <div
          className="flex w-full flex-col"  // 👈 เปลี่ยนเป็น w-full
          style={{ pageBreakBefore: 'always' }} // 👈 สั่งขึ้นหน้าใหม่ก่อน div นี้
        >
          <div className="form-section p-2 md:p-4">
            {/* ผมเดาว่า Component Step 4 ของ BZ5-C น่าจะชื่อประมาณนี้นะครับ */}
            <SharedFormStep4 {...formStepProps} totalWeightFieldName="bz5cCalculations.totalWeightWithNcr" />
          </div>
        </div>
      </div>
    </FormProvider >
  );
};

export default BZ5_CFormPrint;