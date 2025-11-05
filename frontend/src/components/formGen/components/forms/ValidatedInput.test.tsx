// 📁 path: src/components/formGen/components/forms/ValidatedInput.test.tsx

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import ValidatedInput from './ValidatedInput';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';
import { FieldErrors } from 'react-hook-form';

// ====================================================================
// 1. ARRANGE (จัดเตรียม) - ส่วนที่ 1: สร้างข้อมูล Mock
// ====================================================================

// สร้าง Type ของฟอร์มจำลอง
interface MockFormData {
  testValue: number | string | null;
}

// สร้าง "พิมพ์เขียว" (Config) ปลอมๆ สำหรับเทสแต่ละเงื่อนไข
// (เราจะใช้ config ที่แตกต่างกันในแต่ละเทส)

// 1.1 เทส "ห้ามเกิน 100"
const MOCK_CONFIG_MAX_VALUE: IStep2ConfigJson = {
  inputs: [
    {
      field_name: 'testValue',
      type: 'number',
      is_disabled: false,
      validation: {
        type: 'MAX_VALUE',
        max: 100,
        errorMessage: 'ห้ามเกิน 100',
      },
    },
  ],
};

// 1.2 เทส "ช่วง 10-60"
const MOCK_CONFIG_RANGE: IStep2ConfigJson = {
  inputs: [
    {
      field_name: 'testValue',
      type: 'number',
      is_disabled: false,
      validation: {
        type: 'RANGE_DIRECT',
        min: 10,
        max: 60,
        errorMessage: 'ต้องอยู่ในช่วง 10-60',
      },
    },
  ],
};

// 1.3 เทส "ตัวเลขเท่านั้น" (กรณี error ที่ 'isNaN')
const MOCK_CONFIG_IS_NUMBER: IStep2ConfigJson = {
  inputs: [
    {
      field_name: 'testValue',
      type: 'number',
      is_disabled: false,
      validation: {
        type: 'RANGE_DIRECT', // (Type อะไรก็ได้ แค่ให้มัน validate)
        min: 0,
        max: 100,
        errorMessage: 'กรุณากรอกเป็นตัวเลข', // 👈 ใช้ Error message นี้
      },
    },
  ],
};

// ====================================================================
// 2. ARRANGE (จัดเตรียม) - ส่วนที่ 2: สร้าง "ห้องทดลอง" (Test Harness)
// ====================================================================

// นี่คือ Component "หุ้ม" ที่จะให้ RHF "ของจริง"
// เราจะส่ง 'config' เข้ามาใน props เพื่อเปลี่ยนเงื่อนไขการเทส
const TestHarness: React.FC<{ config: IStep2ConfigJson }> = ({ config }) => {
  const methods = useForm<MockFormData>({
    mode: 'onSubmit',
    defaultValues: {
      testValue: null,
    },
  });

  const onSubmit = vi.fn(); // สร้าง onSubmit (ปลอม)

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <ValidatedInput
          config={config} // 👈 ใช้ config ที่ส่งเข้ามา
          inputIndex={0} // เราเทส input ตัวแรกเสมอ
          register={methods.register}
          // (เราต้อง Cast errors Type เพราะ ValidatedInput คาดหวัง Type ใหญ่)
          errors={methods.formState.errors as FieldErrors<IManufacturingReportForm>}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};

// ====================================================================
// 3. เริ่มกลุ่มเทส (Test Suite)
// ====================================================================
describe('ValidatedInput (Integration Test)', () => {
  const user = userEvent.setup();

  // Helper function สำหรับพิมพ์, กด Submit, และรอ
  const typeAndSubmit = async (
    container: HTMLElement,
    value: string
  ) => {
    // (เราใช้ querySelector เพราะ input ไม่มี 'label')
    const input = container.querySelector('input[name="testValue"]');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // (เราใช้ 'clear' ก่อน เผื่อมีค่าเก่า)
    await user.clear(input!);
    if (value) {
      await user.type(input!, value);
    }
    await user.click(submitButton);
  };

  // --- 3A: เทสกลุ่ม MAX_VALUE (ห้ามเกิน 100) ---
  describe('Validation: MAX_VALUE (max: 100)', () => {
    it('เทส 1.1: [ผ่าน] ควร "ไม่" แสดง Error เมื่อกรอก 99', async () => {
      const { container } = render(<TestHarness config={MOCK_CONFIG_MAX_VALUE} />);
      await typeAndSubmit(container, '99');

      await waitFor(() => {
        expect(screen.queryByText('ห้ามเกิน 100')).toBeNull();
      });
    });

    it('เทส 1.2: [Error] ควรแสดง Error เมื่อกรอก 101', async () => {
      const { container } = render(<TestHarness config={MOCK_CONFIG_MAX_VALUE} />);
      await typeAndSubmit(container, '101');
      
      expect(await screen.findByText('ห้ามเกิน 100')).toBeTruthy();
    });
  });

  // --- 3B: เทสกลุ่ม RANGE_DIRECT (10-60) ---
  describe('Validation: RANGE_DIRECT (min: 10, max: 60)', () => {
    it('เทส 2.1: [ผ่าน] ควร "ไม่" แสดง Error เมื่อกรอก 50', async () => {
      const { container } = render(<TestHarness config={MOCK_CONFIG_RANGE} />);
      await typeAndSubmit(container, '50');

      await waitFor(() => {
        expect(screen.queryByText('ต้องอยู่ในช่วง 10-60')).toBeNull();
      });
    });

    it('เทส 2.2: [Error] ควรแสดง Error เมื่อกรอก 5 (น้อยไป)', async () => {
      const { container } = render(<TestHarness config={MOCK_CONFIG_RANGE} />);
      await typeAndSubmit(container, '5');
      
      expect(await screen.findByText('ต้องอยู่ในช่วง 10-60')).toBeTruthy();
    });

    it('เทส 2.3: [Error] ควรแสดง Error เมื่อกรอก 61 (มากไป)', async () => {
      const { container } = render(<TestHarness config={MOCK_CONFIG_RANGE} />);
      await typeAndSubmit(container, '61');
      
      expect(await screen.findByText('ต้องอยู่ในช่วง 10-60')).toBeTruthy();
    });
  });

  // --- 3C: เทสกลุ่ม Edge Cases (ตัวเลขพิเศษ) ---
  describe('Validation: Edge Cases (0, isNaN)', () => {
    it('เทส 3.1: [ผ่าน] ควร "ไม่" แสดง Error เมื่อกรอก 0 (ตาม Logic ใน Component)', async () => {
      // (ใช้ Config ไหนก็ได้ที่มี validation)
      const { container } = render(<TestHarness config={MOCK_CONFIG_RANGE} />);
      await typeAndSubmit(container, '0');

      // (Logic `value === 0` ของคุณจะ return true ก่อน)
      await waitFor(() => {
        expect(screen.queryByText('ต้องอยู่ในช่วง 10-60')).toBeNull();
      });
    });

    it('เทส 3.2: [Error] ควรแสดง Error "กรุณากรอกเป็นตัวเลข" เมื่อกรอก "abc"', async () => {
      const { container } = render(<TestHarness config={MOCK_CONFIG_IS_NUMBER} />);
      await typeAndSubmit(container, 'abc');
      
      // (Logic `isNaN(numericValue)` ของคุณจะทำงาน)
      expect(await screen.findByText('กรุณากรอกเป็นตัวเลข')).toBeTruthy();
    });
  });
});