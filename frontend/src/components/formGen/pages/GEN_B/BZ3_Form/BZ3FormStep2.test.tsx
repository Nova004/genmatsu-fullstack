// 📁 path: src/components/formGen/pages/GEN_B/BZ3_Form/FormStep2.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// 1. 🚀 Import "สมอง" (Custom Hook)
// (อย่าลืม 'export' const useBZ3Calculations จากไฟล์ FormStep2.tsx นะครับ)
import { useBZ3Calculations } from './FormStep2'; 

// --- 2. 🚀 สร้าง "ห้องทดลอง" (Mock Environment) ---

let mockFormState: any = {};

const mockWatch = vi.fn((fieldName: string) => {
  const keys = fieldName.split('.');
  let value = mockFormState;
  for (const key of keys) {
    if (value === undefined || value === null) return null;
    value = value[key];
  }
  return value || null;
});

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
describe('FormStep2 (BZ3) - useBZ3Calculations (Logic การคำนวณ)', () => {

  // "beforeEach" = ล้าง "ฟอร์มจำลอง"
  beforeEach(() => {
    mockFormState = {
      // (ใส่ค่าคงที่ Default ที่มีในฟอร์มจริง)
      bz3Calculations: {
        rc417WaterContent: 2,    // (Hardcoded in component)
        stdMeanMoisture: 39.5, // (Hardcoded in component)
        naclWater: 15,       // (Hardcoded in component)
      }
    };
    mockWatch.mockClear();
    mockSetValue.mockClear();
  });

  // --- เทสที่ 1: สถานการณ์ "กรอกข้อมูลครบ" (Happy Path) ---
  it('เทส 1: ควรคำนวณทุก field ถูกต้อง เมื่อกรอกข้อมูลครบ (Happy Path)', async () => {

    // Arrange (จัดเตรียม): 
    // 1. "พิมพ์" ค่าเริ่มต้นลงใน "ฟอร์มจำลอง"
    mockFormState = {
      ...mockFormState, // (เก็บค่าคงที่ไว้)
      rc417Weighting: {
        total: 1000, // (P20)
      },
      rawMaterials: {
        magnesiumHydroxide: 50,
        activatedcarbon: 20,
        ncrGenmatsu: { actual: 300 },
      },
      bz3Calculations: {
        ...mockFormState.bz3Calculations,
        naclWaterSpecGrav: 1.1, // (W23)
      }
    };

    // Act (กระทำ):
    // 2. "Render" Hook
    renderHook(() => useBZ3Calculations(mockWatch as any, mockSetValue as any));

    // Assert (ตรวจสอบ):
    // 🚀 "รอ" จนกว่า 'setValue' ตัวสุดท้าย (totalWeightWithNcr) จะถูกเรียก
    await waitFor(() => {
      expect(mockFormState.bz3Calculations.totalWeightWithNcr).not.toBeUndefined();
    });

    // --- ตอนนี้ 'useEffect' ทำงานเสร็จแล้ว ---
    
    // --- [A] Total Materials ---
    // P20 + Mg + Carbon = 1000 + 50 + 20 = 1070
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bz3Calculations.totalWeightOfMaterials).toBe('1070.00');

    // --- คำนวณในใจตามเทส (BZ3 Formula) ---
    // Q21_dec (WaterContent) = 0.02
    // Q20 (rc417Total) = 1000
    // AD21 (TotalMaterials) = 1070
    // Q22_dec (StdMeanMoisture) = 0.395
    // O23_dec (naclWater) = 0.15

    // [B] Initial NaCl
    // numerator = (1070 * 0.395) - (1000 * 0.02) = 422.65 - 20 = 402.65
    // denominator = 1 - 0.15 - 0.395 = 0.455
    // rawInitialNaclWater15 = (402.65 / 0.455) * 0.15 = 884.945... * 0.15 = 132.7417...

    // [C] Intermediate
    // (132.7417... / 0.15) * (1 - 0.15) = 884.945... * 0.85 = 752.203...

    // [D] Total NaCl
    // [B] + [C] = 132.7417... + 752.203... = 884.945...
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bz3Calculations.totalNaclWater).toBe(884.95);

    // [E-1] Final NaCl (L) (naclWater15)
    // [D] / SpecGrav = 884.945... / 1.1 = 804.495...
    // (ปัดเศษ .toFixed(1))
    expect(mockFormState.bz3Calculations.naclWater15).toBe(804.5);
    // (เช็ค field ที่มัน setValue ซ้ำด้วย)
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(804.5);

    // [E-1] (L/min) lminRate
    // L / 20 = 804.5 / 20 = 40.225
    // (ปัดเศษ .toFixed(0))
    expect(mockFormState.bz3Calculations.lminRate).toBe('40');

    // [E-2] totalWeightWithNcr
    // [A] + [D] + NCR = 1070 + 884.945... + 300 = 2254.945...
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bz3Calculations.totalWeightWithNcr).toBe(2254.95);
  });

  // --- เทสที่ 2: สถานการณ์ "ค่าว่าง" (Zero/Null Path) ---
  it('เทส 2: ควรคืนค่า null เมื่อค่า Input เป็น null', async () => {
    // Arrange: (mockFormState มีแค่ค่า Default)

    // Act:
    renderHook(() => useBZ3Calculations(mockWatch as any, mockSetValue as any));

    // Assert: (รอให้ useEffect ทำงานเสร็จ)
    await waitFor(() => {
      // (ตัวสุดท้ายที่ถูก Set คือ totalWeightWithNcr)
      expect(mockFormState.bz3Calculations.totalWeightWithNcr).toBe(null);
    });

    // (เช็คที่เหลือ)
    expect(mockFormState.bz3Calculations.totalWeightOfMaterials).toBe(null);
    expect(mockFormState.bz3Calculations.totalNaclWater).toBe(null);
    expect(mockFormState.bz3Calculations.naclWater15).toBe(null);
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(null);
    expect(mockFormState.bz3Calculations.lminRate).toBe(null);
  });

  // --- เทสที่ 3: สถานการณ์ "หารด้วย 0" (Denominator = 0) ---
  it('เทส 3: ควรเป็น null ถ้าสูตร [B] หารด้วย 0', async () => {
    
    // Arrange:
    // (เราจะทำให้ Q22_dec (StdMeanMoisture) + O23_dec (naclWater) = 1)
    act(() => {
      mockFormState.rc417Weighting = { total: 1000 };
      mockFormState.bz3Calculations.stdMeanMoisture = 85; // (0.85)
      mockFormState.bz3Calculations.naclWater = 15;     // (0.15)
      // (1 - 0.15 - 0.85 = 0)
    });

    // Act:
    renderHook(() => useBZ3Calculations(mockWatch as any, mockSetValue as any));

    // Assert: (รอให้ useEffect ทำงานเสร็จ)
    await waitFor(() => {
      // (TotalMaterials ยังคำนวณได้)
      expect(mockFormState.bz3Calculations.totalWeightOfMaterials).toBe('1000.00'); 
    });
    
    // (แต่ค่าที่เหลือ [B], [C], [D], [E]... ต้องเป็น null เพราะหารด้วย 0)
    expect(mockFormState.bz3Calculations.totalNaclWater).toBe(null);
    expect(mockFormState.bz3Calculations.totalWeightWithNcr).toBe(null);
  });
});