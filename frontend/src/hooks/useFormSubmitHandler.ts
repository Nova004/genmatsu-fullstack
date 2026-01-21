import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { fireToast } from './fireToast'; // Import จาก folder เดียวกัน (hooks)

interface UseFormSubmitHandlerProps<T> {
  onSubmit: SubmitHandler<T>;
}

export const useFormSubmitHandler = <T>({
  onSubmit,
}: UseFormSubmitHandlerProps<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit: SubmitHandler<T> = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data); // เรียกใช้ฟังก์ชัน onSubmit ที่ส่งเข้ามา
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      fireToast('error', `เกิดข้อผิดพลาด: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleFormSubmit,
  };
};
