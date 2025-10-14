// location: frontend/src/components/formGen/pages/BZ3_Form/BZFormEdit.tsx

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { IManufacturingReportForm } from '../../types';
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENB';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENB';
import FormHeader from '../../../components/FormHeader';
import { fireToast } from '../../../../../hooks/fireToast';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../../../components/ProgressBar';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';


// Props ที่ Component นี้จะรับเข้ามา
interface BZ3FormEditProps {
    initialData: Partial<IManufacturingReportForm>; // ข้อมูลเดิมสำหรับเติมฟอร์ม
    onSubmit: SubmitHandler<IManufacturingReportForm>; // ฟังก์ชันที่จะทำงานเมื่อกดบันทึก
}

const BZ3_VALIDATION_SCHEMA = {
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

const BZ3FormEdit: React.FC<BZ3FormEditProps> = ({ initialData, onSubmit }) => {
    const totalSteps = 4;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        trigger,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<IManufacturingReportForm>({
        mode: 'onChange',
    });

    // --- ใช้ useEffect เพื่อเติมข้อมูลเดิมลงในฟอร์มเมื่อ Component ถูกสร้างขึ้น ---
    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    // --- ฟังก์ชัน Handle การ Submit ของฟอร์ม ---
    const handleFormSubmit: SubmitHandler<IManufacturingReportForm> = async (data) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data); // เรียกใช้ฟังก์ชัน onSubmit ที่ส่งมาจาก Parent Component
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            fireToast('error', `เกิดข้อผิดพลาด: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ฟังก์ชันสำหรับจัดการปุ่ม Next และ Back ---
    const { step, handleNext, handleBack } = useMultiStepForm({
        totalSteps: 4,
        trigger,
        errors,
        validationSchema: BZ3_VALIDATION_SCHEMA,
    });


    // --- ค่าคงที่สำหรับ Styling และ Dropdown ---
    const availableForms = [{ value: 'BZ3', label: 'BZ3', path: '#' }]; // ไม่จำเป็นต้องมี path จริงในโหมดแก้ไข
    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <FormHeader
                    title="แก้ไขใบรายงานการผลิต (BZ3)" // เปลี่ยน Title สำหรับหน้าแก้ไข
                    formTypes={availableForms}
                    currentValue="BZ3"
                    inputClass={inputClass}
                />

                <ProgressBar currentStep={step} totalSteps={totalSteps} />

                <div className="my-6">
                    {/* ในโหมด Edit เราไม่จำเป็นต้องใช้ onTemplateLoaded 
                      เพราะเราจะแสดงผลข้อมูลตามที่ได้รับมาผ่าน initialData
                      แต่ยังคงส่ง props ที่จำเป็นอื่นๆ ให้กับ Step Components
                    */}
                    {step === 1 && <SharedFormStep1 register={register} watch={watch} setValue={setValue} packagingWarningItemName="RC-417" />}
                    {step === 2 && <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} onTemplateLoaded={() => { }} />}
                    {step === 3 && <SharedFormStep3 register={register} errors={errors} onTemplateLoaded={() => { }} templateName="BZ3_Step3_Operations" />}
                    {step === 4 && <SharedFormStep4 register={register} watch={watch} setValue={setValue} totalWeightFieldName="bz3Calculations.totalWeightWithNcr" />}
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
                    {step === totalSteps && (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`rounded-md bg-primary px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default BZ3FormEdit;