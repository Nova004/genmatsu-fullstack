// 📁 path: src/components/formGen/components/forms/SharedFormStep4_GENA.test.tsx

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import SharedFormStep4 from './SharedFormStep4_GENA'; // 👈 1. Import GENA
import { IManufacturingReportForm } from '../../pages/types';

// ====================================================================
// 1. ARRANGE (จัดเตรียม) - Mock Child Components
// ====================================================================

// 👈 2. Mock 'PackingResultTable_GENA'
vi.mock('./PackingResultTable_GENA', () => ({
  default: () => <div data-testid="mock-packing-table-gena" />,
}));

vi.mock('./PalletTable', () => ({
  default: () => <div data-testid="mock-pallet-table" />,
}));

// ====================================================================
// 2. ARRANGE (จัดเตรียม) - สร้าง Type และ "ห้องทดลอง"
// ====================================================================

// 👈 3. อัปเดต Type ให้มี 'weighttank'
interface MockFormData {
  packingResults: {
    quantityOfProduct: {
      cans: number | null;
      calculated: number | null;
    };
    weighttank: { // 👈 เพิ่ม field นี้
      tank: number | null;
    };
    yieldPercent: number | null;
  };
  // 👈 ใช้ field นี้เป็น 'totalWeightFieldName'
  calculations: {
    finalTotalWeight: number | null;
  };
}

// สร้าง "ห้องทดลอง" (Test Harness)
const TestHarness: React.FC = () => {
  const methods = useForm<MockFormData>({
    mode: 'onChange',
    defaultValues: {
      packingResults: {
        quantityOfProduct: { cans: null, calculated: null },
        weighttank: { tank: null }, // 👈 4. เพิ่ม DefaultValue
        yieldPercent: null,
      },
      calculations: { finalTotalWeight: null }, // 👈 4. เพิ่ม DefaultValue
    },
  });

  return (
    <FormProvider {...methods}>
      {/* ============================================================
        🚀🚀 "แผงควบคุม" (Control Panel) 🚀🚀
        ============================================================
      */}
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
        {/* 👈 5. เพิ่ม Input สำหรับ 'tank' */}
        <label>
          Tank (Control):
          <input
            type="number"
            {...methods.register('packingResults.weighttank.tank', {
              valueAsNumber: true,
            })}
          />
        </label>
        <br />
        <label>
          Total Weight (Control):
          <input
            type="number"
            {...methods.register('calculations.finalTotalWeight', { // 👈 6. อัปเดต field name
              valueAsNumber: true,
            })}
          />
        </label>
      </div>

      <hr />

      {/* --- นี่คือ Component ที่เรากำลังเทส --- */}
      <SharedFormStep4
        register={methods.register as any}
        watch={methods.watch}
        setValue={methods.setValue}
        // 👈 7. ส่ง Prop ที่ GENA คาดหวัง
        totalWeightFieldName="calculations.finalTotalWeight"
      />
    </FormProvider>
  );
};

// ====================================================================
// 3. เริ่มกลุ่มเทส (Test Suite)
// ====================================================================
describe('SharedFormStep4_GENA (useEffect Calculations)', () => {
  const user = userEvent.setup();

  // --- เทสที่ 1: เทสสูตร 'Calculated' (cans * 150 + tank) ---
  it('เทส 1: ควรคำนวณ "calculatedProduct" (cans * 150 + tank) ถูกต้อง', async () => {
    // Arrange
    render(<TestHarness />);

    // 1. ค้นหา "แผงควบคุม"
    const cansInput = screen.getByLabelText('Cans (Control):');
    const tankInput = screen.getByLabelText('Tank (Control):'); // 👈 ค้นหา Tank

    // 2. ค้นหา "ผลลัพธ์" (Span ตัวแรก)
    const displaySpans = screen.getAllByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'span' &&
        element?.classList.contains('text-primary')
      );
    });
    const calculatedDisplay = displaySpans[0];

    // Assert (ค่าเริ่มต้น)
    expect(calculatedDisplay.textContent).toBe('-');

    // Act:
    // พิมพ์ cans = 10 (10 * 150 = 1500)
    await user.type(cansInput, '10');
    // พิมพ์ tank = 500
    await user.type(tankInput, '500');

    // Assert (รอให้ useEffect ทำงาน)
    // คาดหวัง: 1500 + 500 = 2000
    await waitFor(() => {
      expect(calculatedDisplay.textContent).toBe('2000.00');
    });
  });

  // --- เทสที่ 2: เทสสูตร 'Yield %' ---
  it('เทส 2: ควรคำนวณ "yieldPercent" ((calc / total) * 100) ถูกต้อง', async () => {
    // Arrange
    const { container } = render(<TestHarness />);

    // 1. ค้นหา "แผงควบคุม"
    const cansInput = screen.getByLabelText('Cans (Control):');
    const tankInput = screen.getByLabelText('Tank (Control):');
    const totalWeightInput = screen.getByLabelText('Total Weight (Control):');

    // 2. ค้นหา "ผลลัพธ์"
    const yieldInput = container.querySelector(
      'input[name="packingResults.yieldPercent"]'
    );
    expect(yieldInput).toBeTruthy();

    // Act:
    // (cans * 150) + tank = (10 * 150) + 500 = 2000
    await user.type(cansInput, '10');
    await user.type(tankInput, '500');
    // พิมพ์ total = 10000
    await user.type(totalWeightInput, '10000');

    // Assert (รอให้ useEffect (ตัวที่ 2) ทำงาน)
    // คาดหวัง: (2000 / 10000) * 100 = 20
    await waitFor(() => {
      expect((yieldInput as HTMLInputElement).value).toBe('20.00');
    });
  });

  // --- เทสที่ 3: เทส Edge Case (หารด้วย 0) ---
  it('เทส 3: ควรตั้งค่า Yield เป็น "" (null) ถ้า FinalWeight เป็น 0', async () => {
    // Arrange
    const { container } = render(<TestHarness />);
    const cansInput = screen.getByLabelText('Cans (Control):');
    const totalWeightInput = screen.getByLabelText('Total Weight (Control):');
    const yieldInput = container.querySelector(
      'input[name="packingResults.yieldPercent"]'
    );

    // Act: (พิมพ์ค่าอื่นก่อน)
    await user.type(cansInput, '10'); // calc = 1500
    await user.type(totalWeightInput, '15000'); // yield = 10

    // Assert (มีค่าแล้ว)
    await waitFor(() => {
      expect((yieldInput as HTMLInputElement).value).toBe('10.00');
    });

    // Act 2: (เคลียร์ค่า total weight)
    await user.clear(totalWeightInput);
    await user.type(totalWeightInput, '0'); // total = 0

    // Assert (รอให้ useEffect ทำงาน)
    await waitFor(() => {
      expect(['', '0']).toContain((yieldInput as HTMLInputElement).value);
    });
  });
});