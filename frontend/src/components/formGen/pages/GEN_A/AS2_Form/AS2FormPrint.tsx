// location: frontend/src/components/formGen/pages/AS2_Form/AS2FormPrint.tsx
// (ฉบับจัด Layout A4 หน้าเดียว - ยึด Logic เดิมของคุณ)

// Import Library ที่จำเป็นจาก React และ React Hook Form
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IManufacturingReportForm } from '../../types';
import { useNavigate } from 'react-router-dom';

// Import Component ของแต่ละ Step ที่จะนำมาใช้ซ้ำในการแสดงผล
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENA';
import FormStep2 from '../AS2/FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENA';
import ProgressBar from '../../../components/ProgressBar';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
import { useProductionForm } from '../../../../../hooks/useProductionForm';


// สร้าง Interface เพื่อกำหนดว่า AS2FormPrint ต้องรับข้อมูลอะไรเข้ามาบ้าง
interface AS2FormPrintProps {
  formData: IManufacturingReportForm; // 1. ข้อมูลที่ถูกบันทึกไว้จากฐานข้อมูล
  blueprints: any;                   // 2. "พิมพ์เขียว" (Master Template) ที่ใช้ตอนบันทึก
  isReadOnly: boolean;               // 3. ตัวแปรสำหรับบอกว่าเป็นโหมด "อ่านอย่างเดียว" หรือไม่
}

const AS2_VALIDATION_SCHEMA = {
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
const AS2FormPrint: React.FC<AS2FormPrintProps> = ({ formData, blueprints, isReadOnly }) => {

  // --- (ส่วน Logic: ยึดตามโค้ดของคุณเป๊ะๆ) ---
  const totalSteps = 4;
  const navigate = useNavigate();
  const { formMethods } = useProductionForm({
    formType: 'AS2',
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
      {/* กล่องหลัก: flex flex-row */}
      <div className="a4-page-container rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark flex flex-row">

        {/* === คอลัมน์ซ้าย (เหลือแค่ Step 1 และ 3) === */}
        <div className="flex w-1/2 flex-col border-r border-stroke dark:border-strokedark">

          {/* --- Section 1 (Header) --- */}
          <div className="form-section p-1 md:p-1 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-2">
              1. ข้อมูลพื้นฐาน
            </h2>
            <SharedFormStep1 {...formStepProps} packagingWarningItemName="Iron Powder" />
          </div>

          {/* --- Section 3 (Body) --- */}
          {/* (แก้ไข) เพิ่ม flex-grow เพื่อให้มันยืดเต็มพื้นที่ที่เหลือ */}
          <div className="form-section print-step3-compact p-2 md:p-4 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-1">
              2. การปฏิบัติงาน {/* <--- ชื่อหัวข้อผิด ต้องเป็น "วัตถุดิบและการชั่ง" */}
            </h2>
            <FormStep2 {...formStepProps} staticBlueprint={blueprints['AS2_Step2_RawMaterials']} />
          </div>
          {/* --- (ลบ Section 4 ออกจากคอลัมน์ซ้าย) --- */}

        </div>

        {/* === คอลัมน์ขวา (เพิ่ม Step 4 เข้ามา) === */}
        <div className="flex w-1/2 flex-col">

          {/* --- Section 2 (ส่วนบน) --- */}
          {/* (แก้ไข) เอา h-full ออก และเพิ่ม border-b */}
          <div className="form-section p-2 md:p-4 border-b border-stroke dark:border-strokedark">
            <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4">
              3. การปฏิบัติงาน {/* <--- แก้ชื่อหัวข้อ */}
            </h2>
            {/* (แก้ไข) ต้องใช้ FormStep2 สำหรับ Section 2 */}
            <SharedFormStep3 {...formStepProps} staticBlueprint={blueprints['BS3_Step3_Operations']} templateName="AS2_Step3_Operations" />
          </div>

          {/* --- (เพิ่ม) Section 4 (ส่วนล่าง) --- */}
          <div className="form-section p-2 md:p-4">
            <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4">
              4. สรุปผลการผลิต
            </h2>
            <SharedFormStep4 {...formStepProps} totalWeightFieldName="calculations.finalTotalWeight" />
          </div>

        </div>

      </div>
    </FormProvider>
  );
};

export default AS2FormPrint;