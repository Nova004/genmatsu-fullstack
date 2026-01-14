// 📁 path: src/components/formGen/pages/GEN_B/BS5-C_Form/FormStep2.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// 1. 🚀 Import "สมอง" (Custom Hook)
import { useBS5_CCalculations } from './FormStep2';

// --- 2. 🚀 สร้าง "ห้องทดลอง" (Mock Environment) ---

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
describe('FormStep2 (BS5-C) - useBS5_CCalculations (Logic การคำนวณ)', () => {

  // "beforeEach" = ล้าง "ฟอร์มจำลอง"
  beforeEach(() => {
    mockFormState = {
      // (ใส่ค่าคงที่ Default ที่มีในฟอร์มจริง)
      bs5cCalculations: {
        // (Hardcoded in component)
        netweightofwaterper: 649.8144, // S24
        stdMeanMoisture: 37,
        naclWater: 4,
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
        total: 1000, // (S19 / P20)
      },
      rawMaterials: {
        magnesiumHydroxide: 50,
        activatedcarbon: 20,
        gypsumplaster: 5, // 👈 BS5-C รวม Gypsum
        ncrGenmatsu: { actual: 300 },
      },
      bs5cCalculations: {
        ...mockFormState.bs5cCalculations,
        rc417WaterContentMoisture: 10, // (P21 และ AD20)
        naclWaterSpecGrav: 1.1, // (W23)
      }
    };

    // Act (กระทำ):
    // 2. "Render" Hook
    renderHook(() => useBS5_CCalculations(mockWatch as any, mockSetValue as any));

    // Assert (ตรวจสอบ):
    // 🚀 "รอ" จนกว่า 'setValue' ตัวสุดท้าย (totalWeightWithNcr) จะถูกเรียก
    await waitFor(() => {
      expect(mockFormState.bs5cCalculations.totalWeightWithNcr).not.toBeUndefined();
    });

    // --- ตอนนี้ 'useEffect' ทำงานเสร็จแล้ว ---

    // --- [NEW ✨] P22 (WaterContentWeight) ---
    // P20 * (P21 / 100) = 1000 * 0.10 = 100
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bs5cCalculations.rc417WaterContentweight).toBe('100.00');

    // --- [A] Total Materials ---
    // P20 + Mg + Carbon + Gypsum = 1000 + 50 + 20 + 5 = 1075
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bs5cCalculations.totalWeightOfMaterials).toBe('1075.00');

    // --- คำนวณในใจตามเทส (BS5-C Formula) ---
    // (ค่าคงที่)
    const S24 = 649.8144;
    const AD19 = 1000;
    const O23_B_dec = 0.04; // (4%)
    const O23_C_dec = 0.04; // (naclWater = 4%)

    // (ค่าจาก Form)
    const S19 = 1000;
    const P21 = 10;
    // (ค่าที่คำนวณใน [P22])
    const AD20_raw = (S19 * (P21 / 100)); // = 100

    // [B] Initial NaCl
    // part1 = S19 - AD20_raw = 1000 - 100 = 900
    // part2 = S24 / AD19 = 649.8144 / 1000 = 0.6498144
    // part3 = O23_B_dec / (1 - O23_B_dec) = 0.04 / 0.96 = 0.041666...
    // rawInitialNaclWater15_RAW = 900 * 0.6498144 * 0.041666... = 24.36804
    // (roundSafe) -> 24.36804

    // [C] Intermediate
    // (T24_raw = 24.36804)
    // (O23_C_dec = 0.04)
    // rawIntermediateWater_RAW = (24.36804 / 0.04) * (1 - 0.04) = 609.201 * 0.96 = 584.83296
    // (roundSafe) -> 584.83296

    // [D] Total NaCl
    // [B] + [C] = 24.36804 + 584.83296 = 609.201
    // (roundSafe) -> 609.201
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bs5cCalculations.totalNaclWater).toBe('609.20'); // 👈 (FIX)

    // [E-1] Final NaCl (L) (naclWater4)
    // [D] / SpecGrav = 609.201 / 1.1 = 553.819...
    // (roundSafe) -> 553.819
    // (ปัดเศษ .toFixed(0))
    expect(mockFormState.bs5cCalculations.naclWater4).toBe(554); // 👈 (FIX)
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(554); // 👈 (FIX)

    // [E-1] (L/min) lminRate
    // L / 20 = 553.819 / 20 = 27.69...
    // (roundSafe) -> 27.69095
    // (ปัดเศษ Math.round())
    expect(mockFormState.bs5cCalculations.lminRate).toBe('28'); // 👈 (FIX)

    // [E-2] totalWeightWithNcr
    // [A] + [D] + NCR = 1075 + 609.201 + 300 = 1984.201
    // (roundSafe) -> 1984.201
    // (ปัดเศษ .toFixed(2))
    expect(mockFormState.bs5cCalculations.totalWeightWithNcr).toBe('1984.20'); // 👈 (FIX)
  });


  // --- เทสที่ 2: สถานการณ์ "ค่าว่าง" (Zero/Null Path) ---
  it('เทส 2: ควรคืนค่า null หรือ "" เมื่อค่า Input เป็น null', async () => {
    // Arrange: (mockFormState มีแค่ค่า Default)

    // Act:
    renderHook(() => useBS5_CCalculations(mockWatch as any, mockSetValue as any));

    // Assert: (รอให้ useEffect ทำงานเสร็จ)
    await waitFor(() => {
      // (ตัวสุดท้ายที่ถูก Set คือ totalWeightWithNcr)
      expect(mockFormState.bs5cCalculations.totalWeightWithNcr).toBe(null);
    });

    // (เช็คที่เหลือ)
    expect(mockFormState.bs5cCalculations.rc417WaterContentweight).toBe(null);
    expect(mockFormState.bs5cCalculations.totalWeightOfMaterials).toBe(null);
    expect(mockFormState.bs5cCalculations.totalNaclWater).toBe(null);
    expect(mockFormState.bs5cCalculations.naclWater4).toBe(null);
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(null);
    expect(mockFormState.bs5cCalculations.lminRate).toBe(''); // (เพราะ 0 ถูกแปลงเป็น '')
  });

});