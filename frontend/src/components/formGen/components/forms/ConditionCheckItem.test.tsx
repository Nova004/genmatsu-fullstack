// 📁 path: src/components/formGen/components/forms/ConditionCheckItem.test.tsx

import React from 'react';
import { describe, it, expect, vi } from 'vitest'; // 👈 ลบ beforeEach ออก เพราะเราไม่ได้ใช้แล้ว
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import ConditionCheckItem from './ConditionCheckItem';

interface MockFormData {
  conditions: {
    status: 'OK' | 'NG' | null;
    remark: string;
  }[];
}

// (ส่วนที่ 2: TestHarness ... แก้ไข)
const TestHarness: React.FC = () => {
  const methods = useForm<MockFormData>({
    mode: 'onSubmit', // ถูกต้อง
    defaultValues: {
      conditions: [{ status: null, remark: '' }],
    },
  });

  // ✨ FIX 1: ต้อง "สร้าง" ฟังก์ชัน onSubmit ที่เป็น "สายลับ" (Spy)
  const onSubmit = vi.fn();

  return (
    <FormProvider {...methods}>
      {/* ✨ FIX 1 (ต่อ): ส่ง "onSubmit" (ที่เราสร้าง) เข้าไป */}
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <ConditionCheckItem
          index={0}
          title="Test Title"
          description="Test Description"
          warning="Test Warning"
          reference="Test Reference"
          register={methods.register}
          watch={methods.watch}
          errors={methods.formState.errors}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};

// ====================================================================
// 3. เริ่มกลุ่มเทส (Test Suite)
// ====================================================================
describe('ConditionCheckItem (Integration Test)', () => {
  const user = userEvent.setup();

  // --- เทสที่ 1: (เหมือนเดิม) ---
  it('เทส 1: ควรแสดง Title, Description, Reference, และ Warning ถูกต้อง', () => {
    render(<TestHarness />);
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Test Description')).toBeTruthy();
    expect(screen.getByText('Test Warning')).toBeTruthy();
    expect(screen.getByText('Test Reference')).toBeTruthy();
    expect(screen.getByLabelText('OK')).toBeTruthy();
    expect(screen.getByLabelText('NG')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  // --- เทสที่ 2: (แก้ไข) ---
  it('เทส 2: [Error] ควรแสดง Error "กรุณากรอกหมายเหตุ" เมื่อคลิก NG', async () => {
    render(<TestHarness />);
    const radioNG = screen.getByLabelText('NG');
    
    // ✨ FIX 2: ต้อง "ค้นหา" ปุ่ม submit ก่อน
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    await user.click(radioNG);
    await user.click(submitButton); // 👈 (บรรทัดนี้ถูกต้องแล้ว)
    
    expect(
      await screen.findByText('กรุณากรอกหมายเหตุเมื่อเลือก NG')
    ).toBeTruthy();
  });

  // --- เทสที่ 3: (แก้ไข Logic) ---
  it('เทส 3: [ผ่าน] ควร "ไม่" แสดง Error หมายเหตุ เมื่อคลิก OK', async () => {
    render(<TestHarness />);
    const radioOK = screen.getByLabelText('OK');
    
    // ✨ FIX 3: เทส "กรณีผ่าน" ก็ต้องกด Submit เพื่อพิสูจน์
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    await user.click(radioOK);
    await user.click(submitButton); // 👈 กด Submit

    await waitFor(() => {
      expect(
        screen.queryByText('กรุณากรอกหมายเหตุเมื่อเลือก NG')
      ).toBeNull();
    });
  });

  // --- เทสที่ 4: (แก้ไข Logic) ---
  it('เทส 4: [ผ่าน] ควร "ไม่" แสดง Error เมื่อคลิก NG และ "กรอก" หมายเหตุ', async () => {
    render(<TestHarness />);
    const radioNG = screen.getByLabelText('NG');
    const remarkTextarea = screen.getByRole('textbox');
    
    // ✨ FIX 4: เทส "กรณีผ่าน" ก็ต้องกด Submit เพื่อพิสูจน์
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    await user.click(radioNG);
    await user.type(remarkTextarea, 'This is a remark');
    await user.click(submitButton); // 👈 กด Submit

    await waitFor(() => {
      expect(
        screen.queryByText('กรุณากรอกหมายเหตุเมื่อเลือก NG')
      ).toBeNull();
    });
  });

  // --- เทสที่ 5: (แก้ไข) ---
  it('เทส 5: [Error] ควรแสดง Error "กรุณาเลือกสถานะ" ถ้าไม่เลือกเลย', async () => {
    render(<TestHarness />);
    const remarkTextarea = screen.getByRole('textbox');
    
    // ✨ FIX 5: ต้อง "ค้นหา" ปุ่ม submit ก่อน
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    await user.type(remarkTextarea, 'test');
    await user.click(submitButton); // 👈 (บรรทัดนี้ถูกต้องแล้ว)
    
    expect(await screen.findByText('กรุณาเลือกสถานะ')).toBeTruthy();
  });
});