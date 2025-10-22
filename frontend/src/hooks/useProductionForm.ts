import { useState, useCallback } from 'react';
import { useForm, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import React from 'react'; // 👈 1. แก้ไข import ตรงนี้

import { IManufacturingReportForm } from '../components/formGen/pages/types';
import { useAuth } from '../context/AuthContext';
import { submitProductionForm } from '../services/submissionService';
import { fireToast } from './fireToast';

interface UseProductionFormProps {
  formType: 'BS3' | 'BZ3' | 'BZ' | 'AS2' | 'BZ5-C' | 'BS5-C';
  netWeightOfYieldSTD: number;
}

// --- 👇 1. แก้ไข Type ของ onSubmit ตรงนี้ ---
interface UseProductionFormReturn {
  formMethods: UseFormReturn<IManufacturingReportForm>;
  isSubmitting: boolean;
  // ให้ Type ตรงกับผลลัพธ์ที่ได้จาก handleSubmit
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleTemplateLoaded: (templateInfo: any) => void;
}

export const useProductionForm = ({ formType, netWeightOfYieldSTD }: UseProductionFormProps): UseProductionFormReturn => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedTemplates, setLoadedTemplates] = useState<any[]>([]);

  const formMethods = useForm<IManufacturingReportForm>({
    mode: 'onChange',
    defaultValues: {
      mcOperators: Array(3).fill({ id: '', name: '', number: '' }),
      assistants: Array(5).fill({ id: '', name: '', number: '' }),
      conditions: Array(3).fill({ status: null, remark: '' }),
      // ... default values อื่นๆ
    },
  });

  const handleTemplateLoaded = useCallback((templateInfo: any) => {
    setLoadedTemplates(prev => {
      if (prev.find(t => t.template_id === templateInfo.template_id)) {
        return prev;
      }
      return [...prev, templateInfo];
    });
  }, []);

  const onSubmit: SubmitHandler<IManufacturingReportForm> = async (data) => {
    setIsSubmitting(true);
    const templateIds = loadedTemplates.map(t => t.template_id);

    if (templateIds.length < 2) {
      fireToast('error', 'ข้อมูล Template จาก Step 2 และ 3 ยังโหลดไม่สมบูรณ์');
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

    try {
      const result = await submitProductionForm(submissionPayload);
      fireToast('success', `บันทึกข้อมูลสำเร็จ! (ID: ${result.submissionId})`);
      navigate('/reports/history/gen-b', {
        state: { highlightedId: result.submissionId },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      fireToast('error', `บันทึกข้อมูลไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 👇 2. ส่วนนี้ถูกต้องอยู่แล้ว ไม่ต้องแก้ไข ---
  // เรายังคงคืนค่าฟังก์ชันที่ผ่านการห่อจาก handleSubmit ไปให้ Component ใช้งาน
  return {
    formMethods,
    isSubmitting,
    onSubmit: formMethods.handleSubmit(onSubmit),
    handleTemplateLoaded,
  };
};