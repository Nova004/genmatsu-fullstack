// location: frontend/src/hooks/useMultiStepForm.ts

import { useState, useCallback } from 'react';
import { useFormState, UseFormTrigger } from 'react-hook-form';
import { fireToast } from './fireToast';

// --- 1. กำหนด Type สำหรับ "พิมพ์เขียว" การ Validate ของแต่ละฟอร์ม ---
interface ValidationStep {
    fields: string | string[];
    scope?: string;
    message: string;
}

interface ValidationSchema {
    [step: number]: ValidationStep;
}

// --- 2. กำหนด Type สำหรับ Props ที่ Hook ของเราจะรับเข้ามา ---
interface UseMultiStepFormProps {
    totalSteps: number;
    trigger: UseFormTrigger<any>;
    errors: ReturnType<typeof useFormState>['errors'];
    validationSchema: ValidationSchema;
}

// --- 3. สร้าง Custom Hook ---
export const useMultiStepForm = ({
    totalSteps,
    trigger,
    errors,
    validationSchema,
}: UseMultiStepFormProps) => {
    const [step, setStep] = useState(1);

    const handleNext = useCallback(async () => {
        const currentValidation = validationSchema[step];

        // ถ้า Step ปัจจุบันไม่มีกฎ validation ให้ไปต่อได้เลย
        if (!currentValidation) {
            if (step < totalSteps) setStep(prev => prev + 1);
            return;
        }

        const { fields, scope, message: defaultErrorMessage } = currentValidation;
        const isValid = await trigger(fields);

        if (isValid) {
            if (step < totalSteps) setStep(prev => prev + 1);
        } else {
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

            // ใช้ scope ที่กำหนด หรือใช้ errors object ทั้งหมดถ้าไม่ได้กำหนด
            const errorScope = scope ? errors[scope] : errors;
            const firstError = findFirstErrorMessage(errorScope);
            fireToast('warning', firstError || defaultErrorMessage);
        }
    }, [step, totalSteps, trigger, errors, validationSchema]);

    const handleBack = useCallback(() => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    }, [step]);
    
    // --- 4. คืนค่า state และฟังก์ชันที่จำเป็นออกไปให้ Component ใช้งาน ---
    return { step, setStep, handleNext, handleBack };
};