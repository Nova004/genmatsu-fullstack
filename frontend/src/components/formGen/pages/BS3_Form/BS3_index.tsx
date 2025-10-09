// frontend/src/components/formGen/pages/BS3_Form/BS3_index.tsx (โค้ดใหม่)

import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import FormStep1 from './FormStep1';
import FormStep2 from './FormStep2';
import FormStep3 from './FormStep3';
import FormStep4 from './FormStep4';
import FormHeader from '../../components/FormHeader';
import { useMultiStepForm } from '../../../../hooks/useMultiStepForm';
import { useProductionForm } from '../../../../hooks/useProductionForm'; 
import ProgressBar from '../../components/ProgressBar'; 



// ย้าย Schema ออกมาไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกครั้งที่ re-render
const BS3_VALIDATION_SCHEMA = {
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

function BS3_Form() {
    const navigate = useNavigate(); // ยังคงต้องใช้สำหรับปุ่ม Back to history
    const totalSteps = 4;
    // 🚀 เรียกใช้ Hook เพื่อจัดการ Logic ของฟอร์มทั้งหมด
    const { formMethods, isSubmitting, onSubmit, handleTemplateLoaded } = useProductionForm({
        formType: 'BS3',
        netWeightOfYieldSTD: 800,
    });

    // ดึงสิ่งที่จำเป็นออกมาจาก formMethods
    const { register, trigger, watch, setValue, formState: { errors } } = formMethods;

    // เรียกใช้ Hook สำหรับจัดการ Step
    const { step, handleNext, handleBack } = useMultiStepForm({
        totalSteps: 4,
        trigger,
        errors,
        validationSchema: BS3_VALIDATION_SCHEMA,
    });

    // ค่าคงที่สำหรับ UI
    const availableForms = [
        { value: 'BZ', label: 'BZ', path: '/forms/bz-form' },
        { value: 'BZ3', label: 'BZ3', path: '/forms/bz3-form' },
        { value: 'BS3', label: 'BS3', path: '/forms/bs3-form' },
    ];
    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
            <form onSubmit={onSubmit}>
                <FormHeader
                    title="ใบรายงานการผลิต (BS3)"
                    formTypes={availableForms}
                    currentValue="BS3"
                    inputClass={inputClass}
                />

                <ProgressBar currentStep={step} totalSteps={4} />

                <div className="my-6">
                    {step === 1 && <FormStep1 register={register} watch={watch} setValue={setValue} />}
                    {step === 2 && <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} onTemplateLoaded={handleTemplateLoaded} />}
                    {step === 3 && <FormStep3 register={register} errors={errors} onTemplateLoaded={handleTemplateLoaded} />}
                    {step === 4 && <FormStep4 register={register} watch={watch} setValue={setValue} />}
                </div>

                <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
                    {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
                    {step === 1 && (<button type="button" onClick={() => navigate('/reports/history/gen-b')} className="rounded-md bg-secondary px-10 py-2 font-medium text-white hover:bg-opacity-90" >Back</button>)}
                    {step < totalSteps && (<button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">Next</button>)}
                    {step === totalSteps && (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`rounded-md bg-primary px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'Submit'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default BS3_Form;