// path: frontend/src/hooks/useProductionForm.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductionForm } from './useProductionForm';

// --- 1. 🚀 [จุดแก้ไข] ---
// Import "ของจริง" เข้ามาก่อน
import { submitProductionForm } from '../services/submissionService';
import { fireToast } from './fireToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- 2. 🚀 [จุดแก้ไข] ---
// สั่ง Mock โดยสร้าง vi.fn() "ข้างใน" factory
// Vitest จะยกส่วนนี้ขึ้นไปทำงานก่อน
vi.mock('../services/submissionService', () => ({
  submitProductionForm: vi.fn(),
}));

vi.mock('./fireToast', () => ({
  fireToast: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(), // useNavigate เป็น Hook เราจึง mock ตัวมัน
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(), // useAuth ก็เป็น Hook
}));

// --- 3. Props ปลอมๆ (เหมือนเดิม) ---
const defaultProps = {
  formType: 'BZ' as const,
  category: 'GEN_B' as const,
  netWeightOfYieldSTD: 800,
};

// --- 4. เริ่มกลุ่มเทส ---
describe('useProductionForm', () => {

  // --- 5. 🚀 [จุดแก้ไข] ---
  // สร้างตัวแปร "สายลับ" สำหรับ navigate
  const mockNavigateSpy = vi.fn();

  beforeEach(() => {
    // ล้างประวัติสายลับทั้งหมด
    vi.clearAllMocks();

    // 6. 🚀 [จุดแก้ไข] ---
    // เราต้อง "ตั้งค่า" ให้ Hook ปลอมๆ ของเราคืนค่าที่ถูกต้อง
    // (useAuth as vi.Mock) คือการบอก Typescript ว่า "ฉันรู้ว่านี่คือ Mock"
    (useAuth as vi.Mock).mockReturnValue({ user: { id: 'test_user_123' } });
    (useNavigate as vi.Mock).mockReturnValue(mockNavigateSpy); // บอกให้ useNavigate คืนค่า "สายลับ"
  });


  it('เทส 1: onDraft (บันทึกร่าง) ➜ สำเร็จ', async () => {
    // Arrange:
    // 7. 🚀 [จุดแก้ไข] ---
    // ตั้งค่า Mock ให้ API (ตอนนี้เราต้อง cast type มัน)
    (submitProductionForm as vi.Mock).mockResolvedValue({ submissionId: 'draft-123' });

    // Render Hook
    const { result } = renderHook(() => useProductionForm(defaultProps));

    // Act:
    await act(async () => {
      await result.current.onDraft();
    });

    // Assert:
    expect(submitProductionForm).toHaveBeenCalledTimes(1);
    expect(fireToast).not.toHaveBeenCalledWith('error', expect.any(String));
    expect(fireToast).toHaveBeenCalledWith('success', 'บันทึกร่างสำเร็จ! (ID: draft-123)');
    
    // 8. 🚀 [จุดแก้ไข] ---
    // ตรวจสอบ "สายลับ" ที่เราฉีดเข้าไป
    expect(mockNavigateSpy).toHaveBeenCalledWith('/reports/history/gen-b', expect.any(Object));
  });


  it('เทส 2: onDraft (บันทึกร่าง) ➜ ล้มเหลว', async () => {
    // Arrange:
    (submitProductionForm as vi.Mock).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProductionForm(defaultProps));

    // Act:
    await act(async () => {
      await result.current.onDraft();
    });

    // Assert:
    expect(fireToast).toHaveBeenCalledWith('error', expect.stringContaining('บันทึกร่างไม่สำเร็จ'));
    expect(mockNavigateSpy).not.toHaveBeenCalled(); // 👈 ตรวจสอบ "สายลับ"
  });


  it('เทส 3: onSubmit (ส่งจริง) ➜ ล้มเหลว (เพราะ Template ไม่ครบ)', async () => {
    // Arrange:
    const { result } = renderHook(() => useProductionForm(defaultProps));

    // Act:
    await act(async () => {
      await result.current.onSubmit();
    });

    // Assert:
    expect(fireToast).toHaveBeenCalledWith('error', 'ข้อมูล Template จาก Step 2 และ 3 ยังโหลดไม่สมบูรณ์');
    expect(submitProductionForm).not.toHaveBeenCalled();
  });


  it('เทส 4: onSubmit (ส่งจริง) ➜ สำเร็จ', async () => {
    // Arrange:
    (submitProductionForm as vi.Mock).mockResolvedValue({ submissionId: 'submit-456' });

    const { result } = renderHook(() => useProductionForm(defaultProps));

    // โหลด Template (ปลอม) ให้ครบ
    act(() => {
      result.current.handleTemplateLoaded({ template_id: 1, name: 'step2' });
    });
    act(() => {
      result.current.handleTemplateLoaded({ template_id: 2, name: 'step3' });
    });

    // Act:
    await act(async () => {
      await result.current.onSubmit();
    });

    // Assert:
    expect(fireToast).not.toHaveBeenCalledWith('error', expect.any(String));
    expect(submitProductionForm).toHaveBeenCalledTimes(1);
    expect(fireToast).toHaveBeenCalledWith('success', 'บันทึกข้อมูลสำเร็จ! (ID: submit-456)');
    expect(mockNavigateSpy).toHaveBeenCalledWith('/reports/history/gen-b', expect.any(Object));
  });

});