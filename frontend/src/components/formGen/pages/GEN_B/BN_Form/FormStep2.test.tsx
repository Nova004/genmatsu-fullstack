// path: frontend/src/components/formGen/pages/GEN_B/BN_Form/FormStep2.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 1. 🚀 Import "สมอง" ที่เราจะเทส (ตัวที่ export ออกมา)
// ตรวจสอบ path import ให้ตรงกับไฟล์จริงของคุณนะครับ
import { useExcelFormulaCalculations } from './FormStep2';

// --- 2. 🚀 สร้าง "ห้องทดลอง" (Mock Environment) ---

// "ฟอร์มจำลอง" ของเรา (เป็น Object ธรรมดา)
let mockFormState: any = {};

// "watch (ปลอม)"
const mockWatch = vi.fn((fieldName: string) => {
  const keys = fieldName.split('.');
  let value = mockFormState;
  for (const key of keys) {
    if (value === undefined || value === null) return null;
    value = value[key];
  }
  return value || null;
});

// "setValue (ปลอม)"
const mockSetValue = vi.fn((fieldName: string, value: any) => {
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

  // "beforeEach" = ล้างค่าก่อนเริ่มทุกเทส
  beforeEach(() => {
    mockFormState = {};
    mockWatch.mockClear();
    mockSetValue.mockClear();
  });

  // --- เทสที่ 1: สถานการณ์ "กรอกข้อมูลครบ" (Happy Path) ---
  it('เทส 1: ควรคำนวณทุก field ถูกต้อง เมื่อกรอกข้อมูลครบ (ใช้ Yield 1200)', () => {

    // Arrange (จัดเตรียม): 
    mockFormState = {
      calculations: {
        naclBrewingTable: 10,  // Y20
        nacl15SpecGrav: 1.1,   // Q19
      },
      cg1cWeighting: {
        total: 100,            // Q18
      },
      rawMaterials: {
        magnesiumHydroxide: 5,
        ncrGenmatsu: { actual: 2 },
      }
    };

    // Act (กระทำ):
    renderHook(() => useExcelFormulaCalculations(mockWatch as any, mockSetValue as any));

    // Assert (ตรวจสอบ): 
    // หมายเหตุ: คำนวณโดยใช้ STD Yield = 1200

    // --- A. Sodium Chloride (W24) ---
    // สูตร: (Total * Table) / (Yield * SG)
    // คำนวณ: (100 * 10) / (1200 * 1.1) = 1000 / 1320 = 0.7575... 
    // ปัดเศษ (2) -> 0.76
    expect(mockFormState.rawMaterials.sodiumChloride).toBe('0.76');

    // --- B. naclWaterCalc (W23) ---
    // สูตร: (Total * Table) / Yield
    // คำนวณ: (100 * 10) / 1200 = 0.83333...
    // ปัดเศษ (2) -> 0.83
    expect(mockFormState.calculations.naclWaterCalc).toBe('0.83');

    // --- C. waterCalc ---
    // สูตร: naclWaterCalc(Raw) * 0.96
    // คำนวณ: 0.83333... * 0.96 = 0.8
    // ปัดเศษ (2) -> 0.80
    expect(mockFormState.calculations.waterCalc).toBe('0.80');

    // --- D. saltCalc ---
    // สูตร: naclWaterCalc(Raw) * 0.04
    // คำนวณ: 0.83333... * 0.04 = 0.0333...
    // ปัดเศษ (2) -> 0.03
    expect(mockFormState.calculations.saltCalc).toBe('0.03');

    // --- E. finalTotalWeight ---
    // สูตร: Total + naclWaterCalc(Raw) + Mg + NCR
    // คำนวณ: 100 + 0.8333... + 5 + 2 = 107.8333...
    // ปัดเศษ (2) -> 107.83
    expect(mockFormState.calculations.finalTotalWeight).toBe('107.83');
  });


  // --- เทสที่ 2: สถานการณ์ "ค่าว่าง" (Zero/Null Path) ---
  it('เทส 2: ควรคืนค่า null หรือ 0 เมื่อค่า Input เป็น null หรือ 0', () => {
    // Act:
    renderHook(() => useExcelFormulaCalculations(mockWatch as any, mockSetValue as any));

    // Assert:
    expect(mockFormState.rawMaterials?.sodiumChloride || null).toBe(null);
    expect(mockFormState.calculations?.naclWaterCalc || null).toBe(null);
    expect(mockFormState.calculations?.waterCalc || null).toBe(null);
    expect(mockFormState.calculations?.saltCalc || null).toBe(null);
    expect(mockFormState.calculations?.finalTotalWeight || null).toBe(null);
  });


  // --- เทสที่ 3: สถานการณ์ "ผู้ใช้พิมพ์" (Dynamic Change) ---
  it('เทส 3: ควรคำนวณใหม่ เมื่อค่าที่ดักฟัง (dependency) เปลี่ยนแปลง', () => {

    // 1. Render ครั้งแรก (ค่าว่าง)
    const { rerender } = renderHook(() =>
      useExcelFormulaCalculations(mockWatch as any, mockSetValue as any)
    );

    // เช็คค่าเริ่มต้น
    expect(mockFormState.calculations?.finalTotalWeight || null).toBe(null);
    mockSetValue.mockClear();

    // 2. จำลองการ "พิมพ์" (เปลี่ยนค่าในฟอร์มจำลอง)
    act(() => {
      mockFormState.cg1cWeighting = { total: 100 };
      mockFormState.calculations = { naclBrewingTable: 10 }; // ใส่ Table แต่ไม่ใส่ SG
      mockFormState.rawMaterials = { magnesiumHydroxide: 5, ncrGenmatsu: { actual: 2 } };
    });

    // 3. Render ครั้งที่ 2 (เพื่อให้ useEffect ทำงานใหม่)
    rerender();

    // Assert:
    // A. Sodium Chloride ต้องเป็น null (เพราะขาด SG)
    expect(mockFormState.rawMaterials?.sodiumChloride || null).toBe(null);

    // B. แต่ Final Total Weight ต้องคำนวณได้ (เพราะไม่ต้องใช้ SG)
    // 100 + (1000/1200) + 5 + 2 = 107.833 -> 107.83
    expect(mockFormState.calculations.finalTotalWeight).toBe('107.83');
  });

});