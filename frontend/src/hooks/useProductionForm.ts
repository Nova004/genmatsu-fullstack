import { useState, useCallback } from 'react';
import { useForm, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import React from 'react';

import { IManufacturingReportForm } from '../components/formGen/pages/types';
import { useAuth } from '../context/AuthContext';
import { submitProductionForm } from '../services/submissionService';
import { ironpowderService } from '../services/ironpowder.service';
import { fireToast } from './fireToast';
import { initialFormValues } from '../components/formGen/pages/formDefaults';

interface UseProductionFormProps {
  formType:
    | 'BS3'
    | 'BZ3'
    | 'BZ'
    | 'AS2'
    | 'BZ5-C'
    | 'BS5-C'
    | 'AX9-B'
    | 'AX2-B'
    | 'BS-B'
    | 'BN'
    | 'BS3-B'
    | 'BS3-B1'
    | 'BZ3-B'
    | 'BS3-C'
    | 'BS'
    | 'AZ1'
    | 'AZ'
    | 'AS2-D'
    | 'AZ-D'
    | 'AS4'
    | 'AJ4'
    | 'Ironpowder';
  category: 'GEN_A' | 'GEN_B' | 'Recycle';
  netWeightOfYieldSTD: number;
}

interface UseProductionFormReturn {
  formMethods: UseFormReturn<IManufacturingReportForm>;
  isSubmitting: boolean;
  onDraft: () => Promise<void>; // 👈 (อันนี้คุณทำถูกแล้ว)
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleTemplateLoaded: (templateInfo: any) => void;
}

export const useProductionForm = ({
  formType,
  netWeightOfYieldSTD,
  category,
}: UseProductionFormProps): UseProductionFormReturn => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedTemplates, setLoadedTemplates] = useState<any[]>([]);

  const STORAGE_KEY = `autosave_draft_${formType}`;

  const formMethods = useForm<IManufacturingReportForm>({
    mode: 'onChange',
    defaultValues: initialFormValues,
  });

  const { reset, watch } = formMethods;

  // ✅ 1. Load Draft on Mount
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft);
        // Reset form with saved data
        // Note: We merge with initial values to ensure structure integrity
        reset({ ...initialFormValues, ...parsedData });
        // fireToast('success', 'กู้คืนข้อมูลแบบร่างล่าสุดเรียบร้อยแล้ว');
      } catch (error) {
        console.error('Failed to parse draft', error);
      }
    }
  }, [formType, reset]);

  // ✅ 2. Auto-Save on Change
  React.useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch, STORAGE_KEY]);

  const handleTemplateLoaded = useCallback((templateInfo: any) => {
    setLoadedTemplates((prev) => {
      if (prev.find((t) => t.template_id === templateInfo.template_id)) {
        return prev;
      }
      return [...prev, templateInfo];
    });
  }, []);

  // --- 1. onSubmit (สำหรับ Submit จริง) ---
  const onSubmit: SubmitHandler<IManufacturingReportForm> = async (data) => {
    setIsSubmitting(true);

    try {
      // Handle Ironpowder form separately
      if (formType === 'Ironpowder') {
        const ironpowderPayload = {
          lotNo: data.basicData.lotNo,
          formData: data,
          submittedBy: user?.id || 'unknown_user',
        };

        const result = await ironpowderService.createIronpowder(
          ironpowderPayload,
        );
        fireToast('success', 'Successfully Created!');
        // ต้องส่ง ID ไปด้วย (เช็คชื่อ field ID ให้ชัวร์ว่า backend ส่งกลับมาว่าอะไร เช่น submissionId หรือ id)
        const newId = result.submissionId || result.data?.submissionId;

        // ✅ Clear Draft on Success
        localStorage.removeItem(STORAGE_KEY);

        navigate('/reports/history/recycle', {
          state: { highlightedId: newId },
        });
        return;
      }

      // Handle other forms
      const templateIds = loadedTemplates.map((t) => t.template_id);

      // [VALIDATION ตรวจสอบความสมบูรณ์ของ Template]
      if (templateIds.length < 2) {
        fireToast(
          'error',
          'ข้อมูล Template จาก Step 2 และ 3 ยังโหลดไม่สมบูรณ์',
        );
        setIsSubmitting(false);
        return;
      }

      const submissionPayload = {
        formType,
        lotNo: data.basicData.lotNo,
        templateIds,
        formData: {
          ...data,
          rawMaterials: {
            ...data.rawMaterials,
            netWeightOfYieldSTD,
          },
        },
        submittedBy: user?.id || 'unknown_user',
      };

      // [ยิง API]
      const result = await submitProductionForm(submissionPayload);
      fireToast('success', `บันทึกข้อมูลสำเร็จ! (ID: ${result.submissionId})`);

      // ✅ Clear Draft on Success
      localStorage.removeItem(STORAGE_KEY);

      const historyPath =
        category === 'GEN_A'
          ? '/reports/history/gen-a'
          : '/reports/history/gen-b';
      navigate(historyPath, {
        state: { highlightedId: result.submissionId },
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      fireToast('error', `บันทึกข้อมูลไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }; // 👈 ** onSubmit ต้องจบตรงนี้ **

  // --- 2. onDraft (สำหรับบันทึกร่าง) ---
  // **ต้องย้ายมาอยู่นอก onSubmit ครับ**
  const handleDraftSubmit = async () => {
    setIsSubmitting(true);
    const data = formMethods.getValues(); // 👈 ใช้ getValues (ถูกต้อง)

    try {
      // Handle Ironpowder form separately
      if (formType === 'Ironpowder') {
        const ironpowderPayload = {
          lotNo: data.basicData.lotNo,
          formData: data,
          submittedBy: user?.id || 'unknown_user',
        };

        const result = await ironpowderService.createIronpowder(
          ironpowderPayload,
        );
        fireToast(
          'success',
          `บันทึกร่าง Ironpowder สำเร็จ! (ID: ${result.submissionId})`,
        );
        // ✅ Clear Draft on Success
        localStorage.removeItem(STORAGE_KEY);

        navigate('/reports/history/recycle', {
          state: { highlightedId: result.submissionId },
        });
        return;
      }

      // Handle other forms
      const templateIds = loadedTemplates.map((t) => t.template_id);

      const submissionPayload = {
        formType,
        lotNo: data.basicData.lotNo,

        templateIds,
        formData: {
          ...data,
          rawMaterials: {
            ...data.rawMaterials,
            netWeightOfYieldSTD,
          },
        },
        submittedBy: user?.id || 'unknown_user',
      };

      const result = await submitProductionForm(submissionPayload);
      fireToast('success', `บันทึกร่างสำเร็จ! (ID: ${result.submissionId})`);

      // ✅ Clear Draft on Success
      localStorage.removeItem(STORAGE_KEY);

      const historyPath =
        category === 'GEN_A'
          ? '/reports/history/gen-a'
          : '/reports/history/gen-b';
      navigate(historyPath, {
        state: { highlightedId: result.submissionId },
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      fireToast('error', `บันทึกร่างไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }; // 👈 ** handleDraftSubmit จบตรงนี้ **

  // --- 3. return สุดท้ายของ Hook ---
  // **ต้องย้ายมาอยู่นอกสุดของ Hook ครับ**
  return {
    formMethods,
    isSubmitting,
    onSubmit: formMethods.handleSubmit(onSubmit), // 👈 ตัวนี้ห่อด้วย handleSubmit
    onDraft: handleDraftSubmit, // 👈 ตัวนี้ "ไม่ต้องห่อ" เพราะเราต้องการข้าม Validation
    handleTemplateLoaded,
  };
};
