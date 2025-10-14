// frontend/src/components/formGen/pages/AS2_Form/AS2_index.tsx 

import React from 'react';
import { useNavigate } from 'react-router-dom';
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENA';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENA';
import FormHeader from '../../../components/FormHeader';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
import { useProductionForm } from '../../../../../hooks/useProductionForm';
import ProgressBar from '../../../components/ProgressBar';



// ย้าย Schema ออกมาไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกครั้งที่ re-render
const AS2_VALIDATION_SCHEMA = {
    1: {
        fields: ['basicData.date', 'basicData.machineName', 'basicData.lotNo', 'conditions'], // 👈 เพิ่ม 'conditions'
        scope: 'basicData',
        message: 'กรุณากรอกข้อมูลวันที่, เครื่อง, Lot No. และตรวจสอบสภาพบรรจุภัณฑ์ให้ครบถ้วน',
    },
    2: {
         fields: [
            'rawMaterials', 
            'cg1cWeighting.row1.cg1c',
            'cg1cWeighting.row2.cg1c',
        ],
        message: 'กรุณากรอกข้อมูลการชั่งวัตถุดิบและค่าคำนวณที่จำเป็นให้ครบถ้วน',
    },
    3: {
        fields: ['conditions', 'operationResults', 'operationRemark'],
        message: 'กรุณาตรวจสอบข้อมูลเงื่อนไขและผลการปฏิบัติงานให้ถูกต้อง',
    },
};
function AS2_Form() {
    const navigate = useNavigate(); // ยังคงต้องใช้สำหรับปุ่ม Back to history
    const totalSteps = 4;
    // 🚀 เรียกใช้ Hook เพื่อจัดการ Logic ของฟอร์มทั้งหมด
    const { formMethods, isSubmitting, onSubmit, handleTemplateLoaded } = useProductionForm({
        formType: 'AS2',
        netWeightOfYieldSTD: 0,
    });

    // ดึงสิ่งที่จำเป็นออกมาจาก formMethods
    const { register, trigger, watch, setValue, formState: { errors } } = formMethods;

    // เรียกใช้ Hook สำหรับจัดการ Step
    const { step, handleNext, handleBack } = useMultiStepForm({
        totalSteps: 4,
        trigger,
        errors,
        validationSchema: AS2_VALIDATION_SCHEMA, // 👈 ใช้ Schema ใหม่
    });

    // ค่าคงที่สำหรับ UI
    const availableForms = [
        { value: 'AS2', label: 'AS2', path: '/forms/as2-form' },
        { value: 'AX2', label: 'AX2', path: '/forms/ax2-form' },
        { value: 'AZ', label: 'AZ', path: '/forms/az-form' },
    ];
    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
            <form onSubmit={onSubmit}>
                <FormHeader
                    title="ใบรายงานการผลิต (AS2)"
                    formTypes={availableForms}
                    currentValue="AS2"
                    inputClass={inputClass}
                />

                <ProgressBar currentStep={step} totalSteps={4} />

                <div className="my-6">
                    {step === 1 && <SharedFormStep1 register={register} watch={watch} setValue={setValue} errors={errors} packagingWarningItemName="AS-2"  />}
                    {step === 2 && <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} onTemplateLoaded={handleTemplateLoaded} />}
                    {step === 3 && <SharedFormStep3 register={register} errors={errors} onTemplateLoaded={handleTemplateLoaded} templateName="AS2_Step3_Operations" />}
                    {step === 4 && <SharedFormStep4 register={register} watch={watch} setValue={setValue} totalWeightFieldName="calculations.finalTotalWeight" />}
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

export default AS2_Form;