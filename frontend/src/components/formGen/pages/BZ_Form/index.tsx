// src/pages/BZ_Form/index.tsx

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { IManufacturingReportForm } from './types';
import FormStep1 from './FormStep1';
import FormStep2 from './FormStep2';
import FormStep3 from './FormStep3';
import FormStep4 from './FormStep4';

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  const activeClass = 'bg-primary text-white';
  const inactiveClass = 'bg-gray-2 text-black dark:bg-meta-4 dark:text-white';
  return (<div className="my-6 flex justify-center"> <div className="inline-flex rounded-md shadow-sm"> {[...Array(totalSteps)].map((_, index) => { const stepNumber = index + 1; return (<div key={stepNumber} className={`px-4 py-2 text-sm font-medium ${stepNumber === currentStep ? activeClass : inactiveClass} ${stepNumber === 1 ? 'rounded-l-lg' : ''} ${stepNumber === totalSteps ? 'rounded-r-lg' : ''} border border-gray-200 dark:border-strokedark`}> Step {stepNumber} </div>); })} </div> </div>);
};

function BZ_Form() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // ======================================================
  // === แก้ไขตรงนี้: เพิ่ม mode: 'onChange' เข้าไป ===
  // ======================================================
  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<IManufacturingReportForm>({   
    mode: 'onChange',
    defaultValues: {
      mcOperators: Array(3).fill({ id: '', name: '', number: '' }), 
      assistants: Array(5).fill({ id: '', name: '', number: '' }),
      conditions: Array(3).fill({ status: null, remark: '' }),
      rawMaterials: { diaEarth: null, sodiumChloride: null, magnesiumHydroxide: null, remainedGenmatsu: { lot: '', actual: null }, shelfLife: null, ncrGenmatsu: { lot: '', actual: null }, },
      cg1cWeighting: { row1: { cg1c: null, bagNo: '', net: null }, row2: { cg1c: null, bagNo: '', net: null }, total: null, },
      calculations: { nacl15SpecGrav: null, cg1cWaterContent: null, temperature: null, naclBrewingTable: null, naclWaterCalc: null, waterCalc: null, saltCalc: null, finalTotalWeight: null, },
      qouRemark: '',
      operationResults: Array(10).fill({ startTime: '', finishTime: '', humidity: null }),
      operationRemark: '',
      packingResults: { diameter: null, quantityOfProduct: { cans: null, calculated: null }, meshPass40: null, remain: null, yieldPercent: null, },
      palletInfo: Array(6).fill({ no: '', qty: null, canNo: '' }),
    }
  });

  const onSubmit: SubmitHandler<IManufacturingReportForm> = data => {
    console.log("ข้อมูลใบรายงานการผลิต (ฉบับสมบูรณ์):", data);
    alert('บันทึกข้อมูลสำเร็จ! ดูผลลัพธ์ใน Console (F12)');
  };

  const handleNext = async () => {
    let isValid = true;

    if (step === 1) {
      isValid = await trigger(['basicData.date', 'basicData.machineName', 'basicData.lotNo']);
    }

    if (isValid && step < totalSteps) {
      setStep(prev => prev + 1);
    } else if (!isValid) {
      alert('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

  return (
    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* === Header === */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark md:flex-row">
          <h4 className="text-lg font-semibold text-black dark:text-white">
            ใบรายงานการผลิต Manufacturing
          </h4>
          <select className={`${inputClass} max-w-xs`} {...register('reportType')}>
            <option value="AS2">AS2</option>
            <option value="BZ">BZ</option>
          </select>
        </div>

        {/* === Progress Bar === */}
        <ProgressBar currentStep={step} totalSteps={totalSteps} />

        {/* === เนื้อหาฟอร์ม (แสดงตามหน้า) === */}
        <div className="my-6">
          {step === 1 && <FormStep1 register={register} watch={watch} setValue={setValue} />}
          {step === 2 && <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} />}
          {step === 3 && <FormStep3 register={register} errors={errors} />}
          {step === 4 && <FormStep4 register={register} watch={watch} setValue={setValue}/>}
        </div>

        {/* === ปุ่ม Navigation === */}
        <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
          {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
          {step < totalSteps && (<button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">Next</button>)}
          {step === totalSteps && (<button type="submit" className="rounded-md bg-primary px-10 py-2 font-medium text-white hover:bg-opacity-90">Submit</button>)}
        </div>
      </form>
    </div>
  );
}

export default BZ_Form;