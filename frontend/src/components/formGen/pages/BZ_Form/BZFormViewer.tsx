import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IManufacturingReportForm } from './types';

// Import ทุก Step ของฟอร์มเข้ามา
import FormStep1 from './FormStep1';
import FormStep2 from './FormStep2';
import FormStep3 from './FormStep3';
import FormStep4 from './FormStep4';

// (นำ ProgressBar Component มาจาก index.tsx เดิมของคุณ)
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    const activeClass = 'bg-primary text-white';
    const inactiveClass = 'bg-gray-2 text-black dark:bg-meta-4 dark:text-white';
    return (<div className="my-6 flex justify-center"> <div className="inline-flex rounded-md shadow-sm"> {[...Array(totalSteps)].map((_, index) => { const stepNumber = index + 1; return (<div key={stepNumber} className={`px-4 py-2 text-sm font-medium ${stepNumber === currentStep ? activeClass : inactiveClass} ${stepNumber === 1 ? 'rounded-l-lg' : ''} ${stepNumber === totalSteps ? 'rounded-r-lg' : ''} border border-gray-200 dark:border-strokedark`}> Step {stepNumber} </div>); })} </div> </div>);
};

// --- 👇👇👇 จุดที่แก้ไข: เพิ่ม blueprints และ isReadOnly เข้าไปใน Props ---
interface BZFormViewerProps {
  formData: IManufacturingReportForm;
  blueprints: any; 
  isReadOnly: boolean;
}

const BZFormViewer: React.FC<BZFormViewerProps> = ({ formData, blueprints, isReadOnly }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const methods = useForm<IManufacturingReportForm>({
    defaultValues: formData,
  });

  useEffect(() => {
    if (formData) {
      methods.reset(formData);
    }
  }, [formData, methods]);

  const formStepProps = {
    ...methods,
    errors: methods.formState.errors,
    isReadOnly: isReadOnly,
    onTemplateLoaded: () => {}, 
  };
  
  const handleNext = () => {
    if (step < totalSteps) setStep(prev => prev + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  return (
    <FormProvider {...methods}>
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
        
        <ProgressBar currentStep={step} totalSteps={totalSteps} />

        <div className="my-6">
          {step === 1 && <FormStep1 {...formStepProps} />}
          {step === 2 && <FormStep2 {...formStepProps} staticBlueprint={blueprints['BZ_Step2_RawMaterials']} />}
          {step === 3 && <FormStep3 {...formStepProps} staticBlueprint={blueprints['BZ_Step3_Operations']} />}
          {step === 4 && <FormStep4 {...formStepProps} />}
        </div>

        <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
          {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
          {step < totalSteps && (<button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">Next</button>)}
        </div>

      </div>
    </FormProvider>
  );
};

export default BZFormViewer;