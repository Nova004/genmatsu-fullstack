import { useState, useCallback } from 'react';
import { UseFormTrigger, FieldErrors, SubmitErrorHandler } from 'react-hook-form';
import { fireToast } from './fireToast'; // (ตรวจสอบว่า import path ถูกต้อง)

// (Interface UseMultiStepFormProps ของคุณ)
interface UseMultiStepFormProps {
    totalSteps: number;
    trigger: UseFormTrigger<any>;
    errors: FieldErrors<any>;
    validationSchema: {
        [key: number]: {
            fields: string[];
            scope?: string;
            message: string;
        };
    };
}

// 1. 👈 เพิ่ม "handleSubmit_form" ใน Interface ผลลัพธ์
interface UseMultiStepFormReturn {
    step: number;
    setStep: React.Dispatch<React.SetStateAction<number>>;
    handleNext: () => Promise<void>;
    handleBack: () => void;
    handleSubmit_form: () => Promise<boolean>; // 👈 (Promise<boolean> บอกว่าผ่านหรือไม่)
}

// --- 2. สร้าง Helper Function ไว้ข้างนอก ---
// (ย้ายมาจากข้างใน handleNext เพื่อให้ handleSubmit_form ใช้ร่วมกันได้)
const findFirstErrorMessage = (errorNode: any): string | undefined => {
    if (!errorNode) return undefined;
    if (typeof errorNode.message === 'string') return errorNode.message;
    if (Array.isArray(errorNode)) {
        for (const item of errorNode) {
            const message = findFirstErrorMessage(item);
            if (message) return message;
        }
    } else if (typeof errorNode === 'object') {
        for (const key in errorNode) {
            const message = findFirstErrorMessage(errorNode[key]);
            if (message) return message;
        }
    }
    return undefined;
};

export const useMultiStepForm = ({
    totalSteps,
    trigger,
    errors,
    validationSchema,
}: UseMultiStepFormProps): UseMultiStepFormReturn => { // 👈 3. อัปเดต Return Type
    const [step, setStep] = useState(1);

    const handleNext = useCallback(async () => {
        const currentValidation = validationSchema[step];

        if (!currentValidation) {
            if (step < totalSteps) setStep(prev => prev + 1);
            return;
        }

        const { fields, scope, message: defaultErrorMessage } = currentValidation;
        // ตรวจสอบ "เฉพาะ" fields ของ Step ปัจจุบัน
        const isValid = await trigger(fields);

        if (isValid) {
            if (step < totalSteps) setStep(prev => prev + 1);
        } else {
            const errorScope = scope ? errors[scope] : errors;
            // เรียกใช้ Helper
            const firstError = findFirstErrorMessage(errorScope);
            fireToast('warning', firstError || defaultErrorMessage);
        }
    }, [step, totalSteps, trigger, errors, validationSchema]);

    const handleBack = useCallback(() => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    }, [step]);

    // --- 4. 🚀 เพิ่มฟังก์ชัน handleSubmit_form (ตัวใหม่) ---
    const handleSubmit_form = useCallback(async () => {
        // สั่ง RHF ให้ตรวจสอบ "ทุก" field ในฟอร์ม (โดยไม่ต้องระบุชื่อ fields)
        const isValid = await trigger();

        if (isValid) {
            // ถ้าผ่านหมด: คืนค่า true (อนุญาตให้เซฟ)
            return true;
        } else {
            // ถ้าไม่ผ่าน:
            // 1. ค้นหาข้อความ Error แรกสุด (จาก errors object ทั้งก้อน)
            const firstSpecificError = findFirstErrorMessage(errors);

            if (firstSpecificError) {
                // 1a. ถ้าเจอข้อความ Error เฉพาะจุด (เช่น "กรุณากรอก Lot No.")
                fireToast('warning', firstSpecificError);
            } else {
                // 1b. ถ้าหาไม่เจอ (ซึ่งไม่น่าเกิด) ให้หา Error Message "รวม" ของ Step แรกที่ Error
                let defaultStepMessage = "กรุณากรอกข้อมูลให้ครบถ้วน";
                for (let i = 1; i <= totalSteps; i++) {
                    if (validationSchema[i]) {
                        const scope = validationSchema[i].scope;
                        if (scope && errors[scope]) {
                            defaultStepMessage = validationSchema[i].message;
                            break;
                        }
                        // (คุณสามารถเพิ่ม Logic การเช็ค errors[field] ที่ซับซ้อนขึ้นได้อีก)
                    }
                }
                fireToast('warning', defaultStepMessage);
            }
            // 2. คืนค่า false (ไม่อนุญาตให้เซฟ)
            return false;
        }
    }, [trigger, errors, validationSchema, totalSteps]); // (เพิ่ม totalSteps ใน dependencies)

    // --- 5. 👈 คืนค่า handleSubmit_form ออกไป ---
    return { step, setStep, handleNext, handleBack, handleSubmit_form };
};