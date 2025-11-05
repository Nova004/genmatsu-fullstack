// 📁 path: src/components/formGen/components/forms/SharedFormStep4_GENB.test.tsx

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // 👈 (อันนี้แก้จากรอบที่แล้ว)
import { useForm, FormProvider } from 'react-hook-form';
import SharedFormStep4 from './SharedFormStep4_GENB';
import { IManufacturingReportForm } from '../../pages/types';
import { FieldErrors } from 'react-hook-form';

// ====================================================================
// 1. ARRANGE (จัดเตรียม) - Mock Child Components (เหมือนเดิม)
// ====================================================================

vi.mock('./PackingResultTable_GENB', () => ({
  default: () => <div data-testid="mock-packing-table" />,
}));
vi.mock('./PalletTable', () => ({
  default: () => <div data-testid="mock-pallet-table" />,
}));

// ====================================================================
// 2. ARRANGE (จัดเตรียม) - Type และ "ห้องทดลอง" (เหมือนเดิม)
// ====================================================================

interface MockFormData {
  packingResults: {
    quantityOfProduct: {
      cans: number | null;
      calculated: number | null;
    };
    yieldPercent: number | null;
  };
  bz3Calculations: {
    totalWeightWithNcr: number | null;
  };
}

const TestHarness: React.FC = () => {
  const methods = useForm<MockFormData>({
    mode: 'onChange',
    defaultValues: {
      packingResults: {
        quantityOfProduct: { cans: null, calculated: null },
        yieldPercent: null,
      },
      bz3Calculations: { totalWeightWithNcr: null },
    },
  });

  return (
    <FormProvider {...methods}>
      {/* "แผงควบคุม" (Control Panel) (เหมือนเดิม) */}
      <div style={{ padding: 10, backgroundColor: 'lightgray' }}>
        <h5>--- Control Panel (For Test Only) ---</h5>
        <label>
          Cans (Control):
          <input
            type="number"
            {...methods.register('packingResults.quantityOfProduct.cans', {
              valueAsNumber: true,
            })}
          />
        </label>
        <br />
        <label>
          Total Weight (Control):
          <input
            type="number"
            {...methods.register('bz3Calculations.totalWeightWithNcr', {
              valueAsNumber: true,
            })}
          />
        </label>
      </div>
      <hr />
      {/* Component ที่เรากำลังเทส (เหมือนเดิม) */}
      <SharedFormStep4
        register={methods.register as any}
        watch={methods.watch}
        setValue={methods.setValue}
        totalWeightFieldName="bz3Calculations.totalWeightWithNcr"
      />
    </FormProvider>
  );
};

// ====================================================================
// 3. เริ่มกลุ่มเทส (Test Suite)
// ====================================================================
describe('SharedFormStep4_GENB (useEffect Calculations)', () => {
  const user = userEvent.setup();

  // --- เทสที่ 1: ✨ [แก้ไข] เปลี่ยนวิธีค้นหา ---
  it('เทส 1: ควรคำนวณ "calculatedProduct" (cans * 12) ถูกต้อง', async () => {
    // Arrange
    render(<TestHarness />);
    const cansInput = screen.getByLabelText('Cans (Control):');

    // ✨ FIX:
    // 1. ค้นหา "ทั้งหมด" (getAllByText) ที่ตรงเงื่อนไข
    const displaySpans = screen.getAllByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'span' &&
        element?.classList.contains('text-primary') &&
        element?.parentElement?.textContent?.includes('÷')
      );
    });

    // 2. เลือก "ตัวแรก" ([0]) ซึ่งคือ calculatedProduct
    const calculatedDisplay = displaySpans[0];
    // (ตัวที่ [1] คือ finalTotalWeight)

    // Assert (ค่าเริ่มต้น)
    expect(calculatedDisplay.textContent).toBe('-');

    // Act: พิมพ์ 10
    await user.type(cansInput, '10');

    // Assert (รอให้ useEffect ทำงาน)
    await waitFor(() => {
      expect(calculatedDisplay.textContent).toBe('120'); // 10 * 12 = 120
    });
  });

  // --- เทสที่ 2: (เหมือนเดิม ไม่ต้องแก้) ---
  it('เทส 2: ควรคำนวณ "yieldPercent" ((calc / total) * 100) ถูกต้อง', async () => {
    // Arrange
    const { container } = render(<TestHarness />);
    const cansInput = screen.getByLabelText('Cans (Control):');
    const totalWeightInput = screen.getByLabelText('Total Weight (Control):');
    const yieldInput = container.querySelector(
      'input[name="packingResults.yieldPercent"]'
    );
    expect(yieldInput).toBeTruthy();

    // Act:
    await user.type(cansInput, '10'); // calc = 120
    await user.type(totalWeightInput, '1000'); // total = 1000

    // Assert
    await waitFor(() => {
      expect((yieldInput as HTMLInputElement).value).toBe('12'); // (120 / 1000) * 100 = 12
    });
  });

  // --- เทสที่ 3: (เหมือนเดิม ไม่ต้องแก้) ---
  it('เทส 3: ควรตั้งค่า Yield เป็น "" (null) ถ้า FinalWeight เป็น 0', async () => {
    // Arrange
    const { container } = render(<TestHarness />);
    const cansInput = screen.getByLabelText('Cans (Control):');
    const totalWeightInput = screen.getByLabelText('Total Weight (Control):');
    const yieldInput = container.querySelector(
      'input[name="packingResults.yieldPercent"]'
    );

    // Act: (พิมพ์ค่าอื่นก่อน)
    await user.type(cansInput, '10');
    await user.type(totalWeightInput, '1000');
    await waitFor(() => {
      expect((yieldInput as HTMLInputElement).value).toBe('12');
    });

    // Act 2: (เคลียร์ค่า)
    await user.clear(totalWeightInput);
    await user.type(totalWeightInput, '0');

    // Assert
    await waitFor(() => {
      expect((yieldInput as HTMLInputElement).value).toBe(''); // (กลายเป็น null -> "")
    });
  });
});