

import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENB';
import FormHeader from '../../../components/FormHeader';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
import { useProductionForm } from '../../../../../hooks/useProductionForm';
import ProgressBar from '../../../components/ProgressBar';
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENB';
import { initialFormValues } from '../../formDefaults'; // (แก้ path ให้ถูก)



// ย้าย Schema ออกมาไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกครั้งที่ re-render
const BZ_VALIDATION_SCHEMA = {
    1: {
        fields: ['basicData.date', 'basicData.machineName', 'basicData.lotNo', 'conditions'], // 👈 เพิ่ม 'conditions'
        scope: 'basicData',
        message: 'กรุณากรอกข้อมูลวันที่, เครื่อง, Lot No. และตรวจสอบสภาพบรรจุภัณฑ์ให้ครบถ้วน',
    },
    2: {
        fields: [
            'rawMaterials', // ยังคงเช็ค rawMaterials ทั้งหมดเหมือนเดิม
            'cg1cWeighting.row1.cg1c',
            'calculations.nacl15SpecGrav',
            'calculations.cg1cWaterContent',
            'calculations.temperature'
        ],
        message: 'กรุณากรอกข้อมูลการชั่งวัตถุดิบและค่าคำนวณที่จำเป็นให้ครบถ้วน',
    },
    3: {
        fields: ['conditions', 'operationResults', 'operationRemark'],
        message: 'กรุณาตรวจสอบข้อมูลเงื่อนไขและผลการปฏิบัติงานให้ถูกต้อง',
    },
};

function BZ_Form() {
    const navigate = useNavigate(); // ยังคงต้องใช้สำหรับปุ่ม Back to history
    const totalSteps = 4;
    // 🚀 เรียกใช้ Hook เพื่อจัดการ Logic ของฟอร์มทั้งหมด
    const { formMethods, isSubmitting, onSubmit, onDraft, handleTemplateLoaded } = useProductionForm({
        formType: 'BZ',
        netWeightOfYieldSTD: 800,
        category: 'GEN_B'
    });

    // ดึงสิ่งที่จำเป็นออกมาจาก formMethods
    const { register, trigger, watch, control, setValue, getValues, formState: { errors }} = formMethods;

    // เรียกใช้ Hook สำหรับจัดการ Step
    const { step, handleNext, handleBack } = useMultiStepForm({
        totalSteps: 4,
        trigger,
        errors,
        validationSchema: BZ_VALIDATION_SCHEMA,
    });

    // ค่าคงที่สำหรับ UI
    const availableForms = [
        { value: 'BZ', label: 'BZ', path: '/forms/bz-form' },
        { value: 'BZ3', label: 'BZ3', path: '/forms/bz3-form' },
        { value: 'BS3', label: 'BS3', path: '/forms/bs3-form' },
        { value: 'BZ5-C', label: 'BZ5-C', path: '/forms/bz5-c-form' },
        { value: 'BS5-C', label: 'BS5-C', path: '/forms/bs5-c-form' },
    ];
    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
            <form onSubmit={onSubmit}>
                <FormHeader
                    title="ใบรายงานการผลิต (BZ)"
                    formTypes={availableForms}
                    currentValue="BZ"
                    inputClass={inputClass}
                />

                <ProgressBar currentStep={step} totalSteps={4} />

                <div className="my-6">
                    <div className={step !== 1 ? 'hidden' : ''}>
                        <SharedFormStep1 register={register} watch={watch} setValue={setValue} packagingWarningItemName="CG-1C" errors={errors} />
                    </div>
                    <div className={step !== 2 ? 'hidden' : ''}>
                        <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} onTemplateLoaded={handleTemplateLoaded} />
                    </div>
                    <div className={step !== 3 ? 'hidden' : ''}>
                        <SharedFormStep3 register={register} errors={errors} trigger={trigger} control={control} getValues={getValues} onTemplateLoaded={handleTemplateLoaded} templateName="BZ_Step3_Operations" />
                    </div>
                    <div className={step !== 4 ? 'hidden' : ''}>
                        <SharedFormStep4 register={register} watch={watch} setValue={setValue} totalWeightFieldName="calculations.finalTotalWeight" />
                    </div>
                </div>
                <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
                    {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
                    {step === 1 && (<button type="button" onClick={() => navigate('/reports/history/gen-b')} className="rounded-md bg-secondary px-10 py-2 font-medium text-white hover:bg-opacity-90" >Back</button>)}
                    {step < 4 && (
                        <button
                            type="button" // 👈 1. เปลี่ยนเป็น "button"
                            onClick={onDraft} // 👈 2. เพิ่ม onClick ให้เรียก onDraft
                            disabled={isSubmitting}
                            className={`rounded-md bg-primary px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'Drafted'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default BZ_Form;