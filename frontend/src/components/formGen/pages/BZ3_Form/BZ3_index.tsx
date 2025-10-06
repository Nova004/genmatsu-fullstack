// frontend/src/components/formGen/pages/BZ3_Form/BZ3_index.tsx

import React, { useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { IManufacturingReportForm } from '../types';
import FormStep1 from './FormStep1';
import FormStep2 from './FormStep2';
import FormStep3 from './FormStep3';
import FormStep4 from './FormStep4';
import { useAuth } from '../../../../context/AuthContext';

// --- 1. Import เครื่องมือที่จำเป็น ---
import { submitProductionForm } from '../../../../services/submissionService';
import { fireToast } from '../../../../hooks/fireToast';

// (Component ProgressBar ของคุณเหมือนเดิม)
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    const activeClass = 'bg-primary text-white';
    const inactiveClass = 'bg-gray-2 text-black dark:bg-meta-4 dark:text-white';
    return (<div className="my-6 flex justify-center"> <div className="inline-flex rounded-md shadow-sm"> {[...Array(totalSteps)].map((_, index) => { const stepNumber = index + 1; return (<div key={stepNumber} className={`px-4 py-2 text-sm font-medium ${stepNumber === currentStep ? activeClass : inactiveClass} ${stepNumber === 1 ? 'rounded-l-lg' : ''} ${stepNumber === totalSteps ? 'rounded-r-lg' : ''} border border-gray-200 dark:border-strokedark`}> Step {stepNumber} </div>); })} </div> </div>);
};

function BZ3_Form() {
    const [step, setStep] = useState(1);
    const totalSteps = 4;
    const { user } = useAuth(); // ดึงข้อมูลผู้ใช้จาก Context
    
    // --- 2. เพิ่ม State สำหรับจัดการการบันทึก ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadedTemplates, setLoadedTemplates] = useState<any[]>([]);

    // useForm hook ของคุณ (เหมือนเดิม)
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

    // --- 3. สร้างฟังก์ชันสำหรับรับข้อมูล Template จากลูก (ป้องกัน Loop ด้วย useCallback) ---
    const handleTemplateLoaded = useCallback((templateInfo: any) => {
        // เพิ่มข้อมูล template ที่ได้รับมาเข้า State โดยป้องกันการเพิ่มซ้ำ
        setLoadedTemplates(prev => {
            if (prev.find(t => t.template_id === templateInfo.template_id)) {
                return prev; // ถ้ามีอยู่แล้ว ไม่ต้องทำอะไร
            }
            return [...prev, templateInfo]; // ถ้ายังไม่มี ให้เพิ่มเข้าไปใหม่
        });
    }, []); // dependency array ว่าง [] หมายถึงให้ React สร้างฟังก์ชันนี้แค่ครั้งแรกครั้งเดียว

    // --- 4. อัปเกรด onSubmit ให้เรียก API จริง ---
    const onSubmit: SubmitHandler<IManufacturingReportForm> = async (data) => {
        setIsSubmitting(true); // เริ่มกระบวนการบันทึก (ปุ่มจะขึ้นว่า "กำลังบันทึก...")

        const templateIds = loadedTemplates.map(t => t.template_id); 

        // ตรวจสอบข้อมูลเบื้องต้นก่อนส่ง
        if (templateIds.length < 2) {
            fireToast('error', 'ข้อมูล Template จาก Step 2 และ 3 ยังโหลดไม่สมบูรณ์');
            setIsSubmitting(false);
            return;
        }

        // เตรียมข้อมูลทั้งหมดที่จะส่งไป Backend
        const submissionPayload = {
            formType: 'BZ3',
            lotNo: data.basicData.lotNo,
            templateIds: templateIds,
            formData: {
                ...data, // 1. นำข้อมูลเดิมทั้งหมดมา
                rawMaterials: { // 2. กางข้อมูล rawMaterials เดิมออกมา
                    ...data.rawMaterials,
                    netWeightOfYieldSTD: 800 // 3. เพิ่ม field ใหม่เข้าไปใน object นี้
                }
            },
            submittedBy: user?.id || 'unknown_user',
        };

        try {
            const result = await submitProductionForm(submissionPayload);
            fireToast('success', `บันทึกข้อมูลสำเร็จ! (ID: ${result.submissionId})`);
            // สามารถเพิ่มคำสั่งล้างฟอร์มได้ถ้าต้องการ: reset();
            setStep(1); // กลับไปที่หน้าแรก
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ";
            fireToast('error', `บันทึกข้อมูลไม่สำเร็จ: ${errorMessage}`);
        } finally {
            setIsSubmitting(false); // สิ้นสุดกระบวนการบันทึก (ปุ่มกลับมาเป็นปกติ)
        }
    };

    // --- ฟังก์ชัน handleNext และ handleBack ของคุณ (เหมือนเดิม) ---
    const handleNext = async () => {
        const isValid = await trigger(['basicData.date', 'basicData.machineName', 'basicData.lotNo']);
        if (isValid && step < totalSteps) {
            setStep(prev => prev + 1);
        } else if (!isValid) {
            fireToast('warning', 'กรุณากรอกข้อมูลวันที่, เครื่อง, และ Lot No. ให้ครบถ้วน');
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(prev => prev - 1);
    };

    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* === Header และ ProgressBar (เหมือนเดิม) === */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark md:flex-row">
                    <h4 className="text-lg font-semibold text-black dark:text-white">
                        ใบรายงานการผลิต Manufacturing
                    </h4>
                    <select className={`${inputClass} max-w-xs`} {...register('reportType')}>
                        <option value="BZ3">BZ3</option>
                        <option value="BZ">BZ</option>
                    </select>
                </div>
                <ProgressBar currentStep={step} totalSteps={totalSteps} />

                {/* === 5. เนื้อหาฟอร์ม (แก้ไขการส่ง Props) === */}
                <div className="my-6">
                    {step === 1 && <FormStep1 register={register} watch={watch} setValue={setValue} />}
                    {step === 2 && <FormStep2 register={register} watch={watch} setValue={setValue} errors={errors} onTemplateLoaded={handleTemplateLoaded} />}
                    {step === 3 && <FormStep3 register={register} errors={errors} onTemplateLoaded={handleTemplateLoaded} />}
                    {step === 4 && <FormStep4 register={register} watch={watch} setValue={setValue} />}
                </div>

                {/* === ปุ่ม Navigation (เพิ่มสถานะ isSubmitting ที่ปุ่ม Submit) === */}
                <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
                    {step > 1 && (<button type="button" onClick={handleBack} className="rounded-md bg-warning px-10 py-2 font-medium text-white hover:bg-opacity-90">Back</button>)}
                    {step < totalSteps && (<button type="button" onClick={handleNext} className="rounded-md bg-success px-10 py-2 font-medium text-white hover:bg-opacity-90">Next</button>)}
                    {step === totalSteps && (
                        <button
                            type="submit"
                            disabled={isSubmitting} // ปิดปุ่มเมื่อกำลังบันทึก
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

export default BZ3_Form;