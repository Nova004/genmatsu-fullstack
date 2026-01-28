// path: frontend/src/components/formGen/pages/GEN_B/BN_Form/BN_index.test.tsx

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ❗️ "act" ไม่จำเป็นต้อง import โดยตรง แต่เราจะใช้ await findBy...
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BS_B_Form from './BN_index';

// --- (ส่วน Mock ทั้งหมดเหมือนเดิม) ---
import { useProductionForm } from '../../../../../hooks/useProductionForm';
import { useMultiStepForm } from '../../../../../hooks/useMultiStepForm';
vi.mock('../../../../../hooks/useProductionForm');
vi.mock('../../../../../hooks/useMultiStepForm');

import { useNavigate } from 'react-router-dom';
const mockNavigateSpy = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigateSpy,
}));

import { getLatestTemplateByName } from '../../../../../services/formService';
vi.mock('../../../../../services/formService', () => ({
  getLatestTemplateByName: vi.fn(),
}));


// --- (ส่วน "บทพูด" Mock เหมือนเดิม) ---
const mockUseProdForm = {
  formMethods: {
    register: vi.fn(),
    trigger: vi.fn(),
    watch: vi.fn(() => []),
    control: {},
    setValue: vi.fn(),
    getValues: vi.fn(),
    formState: { errors: {} },
  },
  isSubmitting: false,
  onSubmit: vi.fn(),
  onDraft: vi.fn(),
  handleTemplateLoaded: vi.fn(),
};
const mockUseMultiStep = {
  step: 1,
  handleNext: vi.fn(),
  handleBack: vi.fn(),
  handleSubmit: vi.fn(),
  setStep: vi.fn(),
};

// --- (เริ่มเทส) ---
describe('BN_Form Component (หน้า Draft - Step 1)', () => {

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (useProductionForm as vi.Mock).mockReturnValue(mockUseProdForm);
    (useMultiStepForm as vi.Mock).mockReturnValue(mockUseMultiStep);
    (getLatestTemplateByName as vi.Mock).mockResolvedValue({
      items: [],
      template: { template_id: 99 }
    });
  });

  // --- 👇 [แก้ไขเทสที่ 1] ---
  it('เทส 1: หน้า Step 1 ควรแสดงปุ่ม "Back" และ "Draft" แต่ "Next" ต้องไม่แสดง', async () => { // 👈 1. เพิ่ม async
    // Arrange: Render Component
    render(<BS_B_Form />);

    // Assert (ตรวจสอบ):

    // 2. 👈 เปลี่ยนเป็น await screen.findByRole
    // (นี่จะ "รอ" ให้ State update จาก FormStep2/3 ทำงานเสร็จก่อน)
    const backButton = await screen.findByRole('button', { name: /Back/i });

    // 3. (เมื่อรอเสร็จแล้ว ที่เหลือก็ใช้ get/query ได้เลย)
    expect(backButton).toBeTruthy();
    expect(screen.getByRole('button', { name: /Draft/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Next/i })).toBeNull();
  });

  // --- 👇 [แก้ไขเทสที่ 2] ---
  it('เทส 2: เมื่อกดปุ่ม "Draft" ฟังก์ชัน onDraft (ปลอม) ต้องถูกเรียก', async () => { // 👈 1. เพิ่ม async
    render(<BS_B_Form />);

    // 2. 👈 เปลี่ยนเป็น await screen.findByRole
    const draftButton = await screen.findByRole('button', { name: /Draft/i });

    // Act (คลิก):
    await user.click(draftButton);

    // Assert:
    expect(mockUseProdForm.onDraft).toHaveBeenCalledTimes(1);
  });

  // --- 👇 [แก้ไขเทสที่ 3] ---
  it('เทส 3: เมื่อกดปุ่ม "Back" ฟังก์ชัน navigate (ปลอม) ต้องถูกเรียก', async () => { // 👈 1. เพิ่ม async
    render(<BS_B_Form />);

    // 2. 👈 เปลี่ยนเป็น await screen.findByRole
    const backButton = await screen.findByRole('button', { name: /Back/i });

    // Act (คลิก):
    await user.click(backButton);

    // Assert:
    expect(mockNavigateSpy).toHaveBeenCalledTimes(1);
  });

});