

// Import Library ที่จำเป็นจาก React และ React Hook Form
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IManufacturingReportForm } from '../../types';

// Import Component ของแต่ละ Step ที่จะนำมาใช้ซ้ำในการแสดงผล
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENB';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENB';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../../components/ProgressBar';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
import { useProductionForm } from '../../../../../hooks/useProductionForm';


// สร้าง Interface เพื่อกำหนดว่า BS3-CFormViewer ต้องรับข้อมูลอะไรเข้ามาบ้าง
interface BS3_CFormViewerProps {
  formData: IManufacturingReportForm; // 1. ข้อมูลที่ถูกบันทึกไว้จากฐานข้อมูล
  blueprints: any;                   // 2. "พิมพ์เขียว" (Master Template) ที่ใช้ตอนบันทึก
  isReadOnly: boolean;               // 3. ตัวแปรสำหรับบอกว่าเป็นโหมด "อ่านอย่างเดียว" หรือไม่
}

const BS3_C_VALIDATION_SCHEMA = {
  1: {
    fields: ['basicData.date', 'basicData.machineName', 'basicData.lotNo'],
    scope: 'basicData',
    message: 'กรุณากรอกข้อมูลวันที่, เครื่อง, และ Lot No. ให้ครบถ้วน',
  },
  2: {
    fields: [

    ],
    message: 'กรุณากรอกข้อมูลการชั่งวัตถุดิบและค่าคำนวณที่จำเป็นให้ครบถ้วน',
  },
  3: {
    fields: ['conditions', 'operationResults', 'operationRemark'],
    message: 'กรุณาตรวจสอบข้อมูลเงื่อนไขและผลการปฏิบัติงานให้ถูกต้อง',
  },
};
// --- ส่วน Component หลัก ---
const BS3_CFormViewer: React.FC<BS3_CFormViewerProps> = ({ formData, blueprints, isReadOnly }) => {

  // สร้าง State `step` เพื่อเก็บว่าผู้ใช้กำลังดู Step ไหนอยู่, เริ่มต้นที่ 1
  const totalSteps = 4;
  const navigate = useNavigate();
  const { formMethods } = useProductionForm({
    formType: 'BS3-C',
    netWeightOfYieldSTD: 800,
    category: 'GEN_B'
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
    isReadOnly: false,         // ส่งสถานะ "อ่านอย่างเดียว" ลงไปให้ลูกๆ
    onTemplateLoaded: () => { },       // สร้างฟังก์ชันเปล่าๆ สำหรับ Prop นี้ เพราะในโหมด Viewer เราไม่ต้องการโหลด Template ใหม่
  };

  const { trigger, formState: { errors } } = formMethods;

  const { step, setStep, handleNext, handleBack } = useMultiStepForm({
    totalSteps: 4,
    trigger,
    errors,
    validationSchema: BS3_C_VALIDATION_SCHEMA,
  });


  // Return โครงสร้างหน้าเว็บที่จะแสดงผล
  return (
    // ใช้ `FormProvider` ห่อทุกอย่างไว้ เพื่อให้ Component ลูก (FormStep) สามารถดึง `methods` ไปใช้ได้เอง
    <FormProvider {...methods}>
      {/* กล่องหลักของฟอร์ม */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">

        {/* แสดง Component ProgressBar */}
        <ProgressBar
          currentStep={step}
          totalSteps={4}
          onStepClick={(stepNumber) => setStep(stepNumber)}
        />

        {/* ส่วนที่แสดงเนื้อหาของแต่ละ Step */}
        <div className="my-6">
          {/* ใช้ Conditional Rendering: ถ้า `step` เท่ากับ 1 ให้แสดง <FormStep1> */}
          {step === 1 && <SharedFormStep1 {...formStepProps} packagingWarningItemName="RC-417" />}
          {/* ถ้า `step` เท่ากับ 2 ให้แสดง <FormStep2> และส่ง `staticBlueprint` ที่ถูกต้องเข้าไปด้วย */}
          {step === 2 && <FormStep2 {...formStepProps} staticBlueprint={blueprints['BS3-C_Step2_RawMaterials']} />}
          {/* ถ้า `step` เท่ากับ 3 ก็ทำเหมือน Step 2 */}
          {step === 3 && <SharedFormStep3 {...formStepProps} staticBlueprint={blueprints['BS3-C_Step3_Operations']} templateName="BS3-C_Step3_Operations" />}
          {/* ถ้า `step` เท่ากับ 4 ให้แสดง <FormStep4> */}
          {step === 4 && <SharedFormStep4 {...formStepProps} totalWeightFieldName="bs3Calculations.totalWeightWithNcr" />}
        </div>

        {/* ส่วนของปุ่ม Navigation ด้านล่าง */}
        <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
          {/* แสดงปุ่ม "Back" ก็ต่อเมื่อไม่ได้อยู่ที่ Step แรก */}
          {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
          {step === 1 && (<button type="button" onClick={() => navigate('/reports/history/gen-b')} className="rounded-md bg-secondary px-10 py-2 font-medium text-white hover:bg-opacity-90" >Back</button>)}
          {/* แสดงปุ่ม "Next" ก็ต่อเมื่อยังไม่ถึง Step สุดท้าย */}
          {step < totalSteps && (<button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">Next</button>)}
        </div>

      </div>
    </FormProvider>
  );
};

// Export Component นี้ออกไปเพื่อให้ไฟล์อื่นสามารถเรียกใช้งานได้
export default BS3_CFormViewer;