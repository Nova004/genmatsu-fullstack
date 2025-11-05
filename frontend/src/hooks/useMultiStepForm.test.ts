// path: frontend/src/hooks/useMultiStepForm.test.ts

// 1. Import เครื่องมือสำหรับเทส
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 2. Import "สมอง" ที่เราต้องการเทส
import { useMultiStepForm } from './useMultiStepForm';

// --- 3. สร้าง "ของปลอม" (Mocks) ที่ Hook นี้ต้องการ ---
// (เราไม่ต้องการทดสอบ RHF เราแค่ต้องการ "ตัวแปรปลอม" ส่งเข้าไป)

// vi.fn() คือการสร้าง "ฟังก์ชันสายลับ" ที่ไม่ทำอะไรเลย
const mockTrigger = vi.fn(); 
const mockErrors = {}; // errors ว่างเปล่า
const mockValidationSchema = {
  1: { // กฎของ Step 1
    fields: ['field1'],
    message: 'Error Step 1'
  },
  2: { // กฎของ Step 2
    fields: ['field2'],
    message: 'Error Step 2'
  }
};


// 4. "describe" คือการ "จัดกลุ่ม" เทส
describe('useMultiStepForm', () => {

  // "it" (หรือ "test") คือ "หนึ่ง" สถานการณ์ที่เราจะเทส
  it('เทส 1: เมื่อ Hook เริ่มทำงาน, step ต้องเป็น 1', () => {
    // 5. "renderHook" คือการ "รัน" Hook ในห้องทดลอง
    const { result } = renderHook(() => 
      useMultiStepForm({
        totalSteps: 4,
        trigger: mockTrigger,
        errors: mockErrors,
        validationSchema: mockValidationSchema,
      })
    );

    // 6. "expect" คือการ "ตรวจสอบ" ผลลัพธ์
    expect(result.current.step).toBe(1); // (เราคาดหวังว่า step ปัจจุบัน .toBe คือ 1)
  });


  it('เทส 2: เมื่ออยู่ Step 1 แล้วกด handleBack, step ต้องยังคงเป็น 1', () => {
    const { result } = renderHook(() => 
      useMultiStepForm({
        totalSteps: 4,
        trigger: mockTrigger,
        errors: mockErrors,
        validationSchema: mockValidationSchema,
      })
    );

    // "act" ใช้ห่อหุ้ม "การกระทำ" ที่ทำให้ State เปลี่ยน
    act(() => {
      result.current.handleBack(); // 👈 ลองกดปุ่ม Back
    });

    // คาดหวังว่า step "ยังคง" เป็น 1
    expect(result.current.step).toBe(1);
  });


  it('เทส 3: เมื่อกด handleNext และ validation "ผ่าน", step ต้องเป็น 2', async () => {
    // 7. จำลองให้ trigger (ตัวตรวจสอบ) คืนค่า "ผ่าน" (true) เสมอ
    mockTrigger.mockResolvedValue(true); 

    const { result } = renderHook(() => 
      useMultiStepForm({
        totalSteps: 4,
        trigger: mockTrigger,
        errors: mockErrors,
        validationSchema: mockValidationSchema,
      })
    );

    // สั่งรัน handleNext (ซึ่งเป็น async)
    await act(async () => {
      await result.current.handleNext(); // 👈 ลองกดปุ่ม Next
    });

    // คาดหวังว่า step "เปลี่ยนเป็น" 2
    expect(result.current.step).toBe(2);
  });


  it('เทส 4: เมื่อกด handleNext และ validation "ไม่ผ่าน", step ต้องยังคงเป็น 1', async () => {
    // 8. จำลองให้ trigger (ตัวตรวจสอบ) คืนค่า "ไม่ผ่าน" (false)
    mockTrigger.mockResolvedValue(false);

    const { result } = renderHook(() => 
      useMultiStepForm({
        totalSteps: 4,
        trigger: mockTrigger,
        errors: mockErrors,
        validationSchema: mockValidationSchema,
      })
    );

    await act(async () => {
      await result.current.handleNext(); // 👈 ลองกดปุ่ม Next
    });

    // คาดหวังว่า step "ยังคง" เป็น 1
    expect(result.current.step).toBe(1);
  });

});