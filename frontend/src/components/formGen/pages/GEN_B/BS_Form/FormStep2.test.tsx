// path: frontend/src/components/formGen/pages/GEN_B/BS_Form/FormStep2.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 1. 🚀 Import "สมอง" ที่เราจะเทส (ตัวที่ export ออกมา)
import { useExcelFormulaCalculations } from './FormStep2';

// --- 2. 🚀 สร้าง "ห้องทดลอง" (Mock Environment) ---

// "ฟอร์มจำลอง" ของเรา (เป็น Object ธรรมดา)
// เราจะใช้มันเก็บค่าที่ `setValue` (ปลอม) ถูกเรียก
let mockFormState: any = {};

// "watch (ปลอม)"
// เมื่อ Hook เรียก watch('fieldName'), มันจะมาดึงค่าจาก "ฟอร์มจำลอง" ของเรา
const mockWatch = vi.fn((fieldName: string) => {
  // Logic การดึงค่าแบบ Nested (เช่น 'rawMaterials.ncrGenmatsu.actual')
  const keys = fieldName.split('.');
  let value = mockFormState;
  for (const key of keys) {
    if (value === undefined || value === null) return null;
    value = value[key];
  }
  return value || null;
});

// "setValue (ปลอม)"
// เมื่อ Hook เรียก setValue('fieldName', value), มันจะมาอัปเดต "ฟอร์มจำลอง" ของเรา
const mockSetValue = vi.fn((fieldName: string, value: any) => {
  // Logic การตั้งค่าแบบ Nested
  const keys = fieldName.split('.');
  let current = mockFormState;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
});


// --- 3. เริ่มกลุ่มเทส ---
describe('FormStep2 - useExcelFormulaCalculations (Logic การคำนวณ)', () => {

  // "beforeEach" = ล้าง "ฟอร์มจำลอง" และ "สายลับ" ให้สะอาดก่อนเริ่มทุกเทส
  beforeEach(() => {
    mockFormState = {}; // ล้างฟอร์ม
    mockWatch.mockClear(); // ล้างประวัติ watch
    mockSetValue.mockClear(); // ล้างประวัติ setValue
  });

  // --- เทสที่ 1: สถานการณ์ "กรอกข้อมูลครบ" (Happy Path) ---
  it('เทส 1: ควรคำนวณทุก field ถูกต้อง เมื่อกรอกข้อมูลครบ (Happy Path)', () => {

    // Arrange (จัดเตรียม): 
    // 1. "พิมพ์" ค่าเริ่มต้นลงใน "ฟอร์มจำลอง"
    mockFormState = {
      calculations: {
        naclBrewingTable: 10,
        nacl15SpecGrav: 1.1,
      },
      cg1cWeighting: {
        total: 100,
      },
      rawMaterials: {
        magnesiumHydroxide: 5,
        ncrGenmatsu: { actual: 2 },
      }
    };

    // Act (กระทำ):
    // 2. "Render" Hook (มันจะดึงค่าจากฟอร์มจำลองผ่าน mockWatch)
    renderHook(() => useExcelFormulaCalculations(mockWatch as any, mockSetValue as any));

    // Assert (ตรวจสอบ):
    // 3. ตรวจสอบว่า "ฟอร์มจำลอง" ของเรา ได้รับการอัปเดตค่าที่ถูกต้องหรือไม่

    // --- สูตรดั้งเดิม (Sodium Chloride) ---
    // (100 * 10) / (800 * 1.1) = 1000 / 880 = 1.136... -> toFixed(2) = 1.14
    expect(mockFormState.rawMaterials.sodiumChloride).toBeCloseTo(1.14, 2);

    // --- สูตร 1 & 2 (naclWaterCalc) ---
    // (100 * 10) / 800 = 1.25
    expect(mockFormState.calculations.naclWaterCalc).toBe(1.25);

    // --- สูตร 3 (waterCalc) ---
    // 1.25 * 0.96 = 1.2 (โค้ดจริงใช้ 0.96 ไม่ใช่ 0.85)
    expect(mockFormState.calculations.waterCalc).toBeCloseTo(1.2, 2);

    // --- สูตร 4 (saltCalc) ---
    // 1.25 * 0.04 = 0.05 (โค้ดจริงใช้ 0.04 ไม่ใช่ 0.15)
    expect(mockFormState.calculations.saltCalc).toBeCloseTo(0.05, 2);

    // --- สูตร 5 (finalTotalWeight) ---
    // 100 (total) + 1.25 (naclWaterCalc) + 5 (magnesium) + 2 (ncr) = 108.25
    expect(mockFormState.calculations.finalTotalWeight).toBeCloseTo(108.25, 2);
  });


  // --- เทสที่ 2: สถานการณ์ "ค่าว่าง" (Zero/Null Path) ---
  it('เทส 2: ควรคืนค่า null หรือ 0 เมื่อค่า Input เป็น null หรือ 0', () => {

    // Arrange: (ไม่ต้องทำอะไร, mockFormState เป็น {} (ว่าง) อยู่แล้ว)

    // Act:
    renderHook(() => useExcelFormulaCalculations(mockWatch as any, mockSetValue as any));

    // Assert:
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(null);
    expect(mockFormState.calculations.naclWaterCalc).toBe(null);
    expect(mockFormState.calculations.waterCalc).toBe(null);
    expect(mockFormState.calculations.saltCalc).toBe(null);
    expect(mockFormState.calculations.finalTotalWeight).toBe(null);// (เพราะ 0 + 0 + 0 + 0 = 0)
  });


  // --- เทสที่ 3: สถานการณ์ "ผู้ใช้พิมพ์" (Dynamic Change) ---
  it('เทส 3: ควรคำนวณใหม่ เมื่อค่าที่ดักฟัง (dependency) เปลี่ยนแปลง', () => {

    // --- Render ครั้งที่ 1 (ค่าว่าง) ---
    // (เราต้องใช้ rerender เพื่อจำลองการอัปเดต)
    const { rerender } = renderHook(() =>
      useExcelFormulaCalculations(mockWatch as any, mockSetValue as any)
    );

    // Assert ครั้งที่ 1 (ทุกอย่างเป็น null/0)
    expect(mockFormState.calculations.finalTotalWeight).toBe(null);
    // ล้างประวัติการเรียก setValue (ให้เริ่มนับ 1 ใหม่)
    mockSetValue.mockClear();

    // --- Act 2: จำลองการ "พิมพ์" (เปลี่ยนค่าในฟอร์มจำลอง) ---
    act(() => {
      mockFormState.cg1cWeighting = { total: 100 };
      mockFormState.calculations = { naclBrewingTable: 10 };
      mockFormState.rawMaterials = { magnesiumHydroxide: 5, ncrGenmatsu: { actual: 2 } };
      // (จงใจเว้น nacl15SpecGrav)
    });

    // --- Render ครั้งที่ 2 (จำลอง React อัปเดต) ---
    rerender();

    // Assert ครั้งที่ 2:
    // 1. Sodium Chloride ต้องเป็น "null" (เพราะ W23 หรือ nacl15SpecGrav เป็น 0)
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(null);

    // 2. แต่ Final Total Weight ต้องคำนวณ (เพราะไม่ขึ้นกับ nacl15SpecGrav)
    // 100 (total) + 1.25 (naclWaterCalc) + 5 (magnesium) + 2 (ncr) = 108.25
    expect(mockFormState.calculations.finalTotalWeight).toBeCloseTo(108.25, 2);
  });

});