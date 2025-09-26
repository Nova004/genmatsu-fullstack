// Import Library ที่จำเป็นจาก React และ React Hook Form
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IManufacturingReportForm } from './types';

// Import Component ของแต่ละ Step ที่จะนำมาใช้ซ้ำในการแสดงผล
import FormStep1 from './FormStep1';
import FormStep2 from './FormStep2';
import FormStep3 from './FormStep3';
import FormStep4 from './FormStep4';

// Component สำหรับแสดงแถบสถานะ (ProgressBar) ซึ่งเหมือนกับในหน้าสร้างฟอร์ม
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => { 
    const activeClass = 'bg-primary text-white';
    const inactiveClass = 'bg-gray-2 text-black dark:bg-meta-4 dark:text-white';
    return (<div className="my-6 flex justify-center"> <div className="inline-flex rounded-md shadow-sm"> {[...Array(totalSteps)].map((_, index) => { const stepNumber = index + 1; return (<div key={stepNumber} className={`px-4 py-2 text-sm font-medium ${stepNumber === currentStep ? activeClass : inactiveClass} ${stepNumber === 1 ? 'rounded-l-lg' : ''} ${stepNumber === totalSteps ? 'rounded-r-lg' : ''} border border-gray-200 dark:border-strokedark`}> Step {stepNumber} </div>); })} </div> </div>);
};


// สร้าง Interface เพื่อกำหนดว่า BZFormViewer ต้องรับข้อมูลอะไรเข้ามาบ้าง
interface BZFormViewerProps {
  formData: IManufacturingReportForm; // 1. ข้อมูลที่ถูกบันทึกไว้จากฐานข้อมูล
  blueprints: any;                   // 2. "พิมพ์เขียว" (Master Template) ที่ใช้ตอนบันทึก
  isReadOnly: boolean;               // 3. ตัวแปรสำหรับบอกว่าเป็นโหมด "อ่านอย่างเดียว" หรือไม่
}

// --- ส่วน Component หลัก ---
const BZFormViewer: React.FC<BZFormViewerProps> = ({ formData, blueprints, isReadOnly }) => {
  
  // สร้าง State `step` เพื่อเก็บว่าผู้ใช้กำลังดู Step ไหนอยู่, เริ่มต้นที่ 1
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  
  const methods = useForm<IManufacturingReportForm>({  // ใช้ useForm เพื่อจัดการฟอร์ม
    // กำหนดค่าเริ่มต้นของทุกช่องในฟอร์มให้เท่ากับ `formData` ที่ได้รับมา
    defaultValues: formData,
  });

  
  // ใช้ useEffect เพื่อคอย "จับตาดู" การเปลี่ยนแปลงของ `formData`
  useEffect(() => {
    if (formData) {
      // ให้ "ล้าง" ฟอร์มและ "เติม" ข้อมูลใหม่เข้าไปทันที เพื่อให้หน้าจออัปเดต
      methods.reset(formData);
    }
  }, [formData, methods]); 


  // สร้าง Object `formStepProps` เพื่อรวบรวม Props ที่ต้องส่งให้ทุก Step ไว้ในที่เดียว
  const formStepProps = {
    ...methods, // ส่งทุกฟังก์ชันจาก `useForm` (register, watch, setValue, etc.)
    errors: methods.formState.errors, // ส่ง state ของ error ไปด้วย
    isReadOnly: isReadOnly,           // ส่งสถานะ "อ่านอย่างเดียว" ลงไปให้ลูกๆ
    onTemplateLoaded: () => {},       // สร้างฟังก์ชันเปล่าๆ สำหรับ Prop นี้ เพราะในโหมด Viewer เราไม่ต้องการโหลด Template ใหม่
  };
  
  // ฟังก์ชันสำหรับจัดการการกดปุ่ม "Next"
  const handleNext = () => {
    if (step < totalSteps) setStep(prev => prev + 1);
  };

  // ฟังก์ชันสำหรับจัดการการกดปุ่ม "Back"
  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  
  // Return โครงสร้างหน้าเว็บที่จะแสดงผล
  return (
    // ใช้ `FormProvider` ห่อทุกอย่างไว้ เพื่อให้ Component ลูก (FormStep) สามารถดึง `methods` ไปใช้ได้เอง
    <FormProvider {...methods}>
      {/* กล่องหลักของฟอร์ม */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
        
        {/* แสดง Component ProgressBar */}
        <ProgressBar currentStep={step} totalSteps={totalSteps} />

        {/* ส่วนที่แสดงเนื้อหาของแต่ละ Step */}
        <div className="my-6">
          {/* ใช้ Conditional Rendering: ถ้า `step` เท่ากับ 1 ให้แสดง <FormStep1> */}
          {step === 1 && <FormStep1 {...formStepProps} />}
          {/* ถ้า `step` เท่ากับ 2 ให้แสดง <FormStep2> และส่ง `staticBlueprint` ที่ถูกต้องเข้าไปด้วย */}
          {step === 2 && <FormStep2 {...formStepProps} staticBlueprint={blueprints['BZ_Step2_RawMaterials']} />}
          {/* ถ้า `step` เท่ากับ 3 ก็ทำเหมือน Step 2 */}
          {step === 3 && <FormStep3 {...formStepProps} staticBlueprint={blueprints['BZ_Step3_Operations']} />}
          {/* ถ้า `step` เท่ากับ 4 ให้แสดง <FormStep4> */}
          {step === 4 && <FormStep4 {...formStepProps} />}
        </div>

        {/* ส่วนของปุ่ม Navigation ด้านล่าง */}
        <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
          {/* แสดงปุ่ม "Back" ก็ต่อเมื่อไม่ได้อยู่ที่ Step แรก */}
          {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
          {/* แสดงปุ่ม "Next" ก็ต่อเมื่อยังไม่ถึง Step สุดท้าย */}
          {step < totalSteps && (<button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">Next</button>)}
        </div>

      </div>
    </FormProvider>
  );
};

// Export Component นี้ออกไปเพื่อให้ไฟล์อื่นสามารถเรียกใช้งานได้
export default BZFormViewer;