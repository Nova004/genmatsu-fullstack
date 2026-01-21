// location: frontend/src/components/formGen/pages/BZ_Form/BZFormEdit.tsx

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { IManufacturingReportForm } from '../../types';
import { useNavigate } from 'react-router-dom';
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENB';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENB';
import FormHeader from '../../../components/FormHeader';
import ProgressBar from '../../../components/ProgressBar';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
import { useFormSubmitHandler } from '../../../../../hooks/useFormSubmitHandler';
import { initialFormValues } from '../../formDefaults'; // (แก้ path ให้ถูก)


// Props ที่ Component นี้จะรับเข้ามา
interface BZFormEditProps {
    initialData: Partial<IManufacturingReportForm>; // ข้อมูลเดิมสำหรับเติมฟอร์ม
    onSubmit: SubmitHandler<IManufacturingReportForm>; // ฟังก์ชันที่จะทำงานเมื่อกดบันทึก
    onResubmit: SubmitHandler<IManufacturingReportForm>; // ฟังก์ชันที่จะทำงานเมื่อกดส่งอนุมัติใหม่
    submissionId: number; // ID ของ submission ที่กำลังแก้ไ
    status: string;
}

const BZ_VALIDATION_SCHEMA = {
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
const BZFormEdit: React.FC<BZFormEditProps> = ({ initialData, onSubmit, onResubmit, submissionId, status }) => {

    const totalSteps = 4;
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        trigger,
        watch,
        setValue,
        getValues,
        control,
        formState: { errors },
        reset,
    } = useForm<IManufacturingReportForm>({
        mode: 'onChange',
        defaultValues: initialFormValues // 👈 จบ! สะอาดและใช้ซ้ำได้
    });

    // --- ใช้ useEffect เพื่อเติมข้อมูลเดิมลงในฟอร์มเมื่อ Component ถูกสร้างขึ้น ---
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);
    // --- ใช้ Custom Hook สำหรับจัดการ Submit ---
    const { isSubmitting, handleFormSubmit } = useFormSubmitHandler({ onSubmit });

    // --- ฟังก์ชันสำหรับจัดการปุ่ม Next และ Back ---
    const { step, setStep, handleNext, handleBack, handleSubmit_form } = useMultiStepForm({
        totalSteps: 4,
        trigger,
        errors,
        validationSchema: BZ_VALIDATION_SCHEMA,
    });


    // --- ค่าคงที่สำหรับ Styling และ Dropdown ---
    const availableForms = [{ value: 'BZ', label: 'BZ', path: '#' }]; // ไม่จำเป็นต้องมี path จริงในโหมดแก้ไข
    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <FormHeader
                    title="แก้ไขใบรายงานการผลิต (BZ)" // เปลี่ยน Title สำหรับหน้าแก้ไข
                    formTypes={availableForms}
                    currentValue="BZ"
                    inputClass={inputClass}
                />

                <ProgressBar
                    currentStep={step}
                    totalSteps={4}
                    onStepClick={(stepNumber) => setStep(stepNumber)}
                />

                <div className="my-6">
                    {/* ในโหมด Edit เราไม่จำเป็นต้องใช้ onTemplateLoaded 
                      เพราะเราจะแสดงผลข้อมูลตามที่ได้รับมาผ่าน initialData
                      แต่ยังคงส่ง props ที่จำเป็นอื่นๆ ให้กับ Step Components
                    */}
                    {step === 1 && <SharedFormStep1 register={register} watch={watch} setValue={setValue} packagingWarningItemName="CG-1C" errors={errors} />}
                    {step === 2 && <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} onTemplateLoaded={() => { }} />}
                    {step === 3 && <SharedFormStep3 register={register} errors={errors} trigger={trigger} control={control} getValues={getValues} onTemplateLoaded={() => { }} templateName="BZ_Step3_Operations" />}
                    {step === 4 && <SharedFormStep4 register={register} watch={watch} setValue={setValue} totalWeightFieldName="calculations.finalTotalWeight" />}
                </div>

                <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
                    {step > 1 && (
                        <button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">
                            Back
                        </button>
                    )}
                    {step === 1 && (<button type="button" onClick={() => navigate('/reports/history/gen-b')} className="rounded-md bg-secondary px-10 py-2 font-medium text-white hover:bg-opacity-90" >Back</button>)}
                    {step < totalSteps && (
                        <button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">
                            Next
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={handleSubmit_form}
                        className={`rounded-md bg-amber-500 px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>

                    {(status === 'Rejected' || status === 'Drafted') && step === totalSteps && (
                        <button
                            type="button"
                            onClick={handleSubmit(onResubmit)} // ใช้ฟังก์ชันส่งอนุมัติ
                            disabled={isSubmitting}
                            className={`rounded-md px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                                } ${
                                // เปลี่ยนสีปุ่มตามสถานะได้ด้วยเพื่อความชัดเจน
                                status === 'Rejected'
                                    ? 'bg-indigo-600' // สีม่วง (Resubmit)
                                    : 'bg-green-600'  // สีเขียว (Submit ครั้งแรก)
                                }`}
                        >
                            {isSubmitting
                                ? 'กำลังบันทึก...'
                                : status === 'Rejected'
                                    ? 'บันทึก และ ส่งอนุมัติใหม่ (Resubmit)'
                                    : 'บันทึก และ ส่งอนุมัติ (Submit)'
                            }
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default BZFormEdit;