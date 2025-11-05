// 📁 path: src/components/formGen/pages/GEN_B/BZ5-C_Form/BZ5-CFormStep2.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// 1. 🚀 Import "สมอง" (Custom Hook) ที่เราจะเทส
// (เราต้อง Export 'useBZ5_CCalculations' จากไฟล์ FormStep2.tsx ของคุณก่อน)
// (ถ้ายังไม่ได้ Export, ให้เพิ่ม 'export' หน้า const useBZ5_CCalculations)
import { useBZ5_CCalculations } from './FormStep2';

// --- 2. 🚀 สร้าง "ห้องทดลอง" (Mock Environment) ---

// "ฟอร์มจำลอง" ของเรา
let mockFormState: any = {};

// "watch (ปลอม)" (เหมือนของคุณ)
const mockWatch = vi.fn((fieldName: string) => {
  const keys = fieldName.split('.');
  let value = mockFormState;
  for (const key of keys) {
    if (value === undefined || value === null) return null;
    value = value[key];
  }
  return value || null;
});

// "setValue (ปลอม)" (เหมือนของคุณ)
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
describe('FormStep2 (BZ5-C) - useBZ5_CCalculations (Logic การคำนวณ)', () => {

  // "beforeEach" = ล้าง "ฟอร์มจำลอง"
  beforeEach(() => {
    mockFormState = {
      // (ใส่ค่าคงที่ Default ที่มีในฟอร์มจริง)
      bz5cCalculations: {
        stdMeanMoisture: 33.94,
        naclWater: 15,
      }
    };
    mockWatch.mockClear();
    mockSetValue.mockClear();
  });

  it('เทส 1: ควรคำนวณทุก field ถูกต้อง เมื่อกรอกข้อมูลครบ (Happy Path)', async () => {

    // Arrange (เหมือนเดิม)
    mockFormState = {
      ...mockFormState,
      rc417Weighting: { total: 1000 },
      rawMaterials: {
        magnesiumHydroxide: 50,
        activatedcarbon: 20,
        gypsumplaster: 5,
        ncrGenmatsu: { actual: 300 },
      },
      bz5cCalculations: {
        ...mockFormState.bz5cCalculations,
        rc417WaterContentMoisture: 10,
        naclWaterSpecGrav: 1.1,
      }
    };

    // Act (เหมือนเดิม)
    renderHook(() => useBZ5_CCalculations(mockWatch as any, mockSetValue as any));

    // Assert (รอให้ 'useEffect' ทำงานเสร็จ)
    // (เรารอ 'totalWeightWithNcr' เพราะมันคือตัวสุดท้าย)
    await waitFor(() => {
      // [E-2] = 1075 (A) + 614.385 (D) + 300 (NCR) = 1989.385 -> 1989.38
      expect(mockFormState.bz5cCalculations.totalWeightWithNcr).toBe(1989.38); // 👈 (FIX)
    });

    // --- ตอนนี้ 'useEffect' ทำงานเสร็จแล้ว ---
    // (เช็คค่าที่เหลือ)

    // [NEW ✨] P22 (เหมือนเดิม)
    expect(mockFormState.bz5cCalculations.rc417WaterContentweight).toBe(100.000);
    // [A] Total Materials (เหมือนเดิม)
    expect(mockFormState.bz5cCalculations.totalWeightOfMaterials).toBe('1075.00');

    // [D] Total NaCl Water (นี่คือจุดที่พัง)
    // (ค่าจริงคือ 614.385... -> ปัดเศษ 614.38)
    expect(mockFormState.bz5cCalculations.totalNaclWater).toBe(614.38); // 👈 (FIX)

    // [E-1] (L) naclWater4
    // (614.385 / 1.1 = 558.53... -> ปัดเศษ 559)
    expect(mockFormState.bz5cCalculations.naclWater4).toBe(559); // 👈 (FIX)
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(559); // 👈 (FIX)

    // [E-1] (L/min) lminRate
    // (558.53... / 20 = 27.92... -> ปัดเศษ 28)
    expect(mockFormState.bz5cCalculations.lminRate).toBe('28'); // (ตัวนี้ถูกอยู่แล้ว)
  });

  // --- เทสที่ 2: สถานการณ์ "ค่าว่าง" (Zero/Null Path) ---
  it('เทส 2: ควรคืนค่า null เมื่อค่า Input เป็น null', async () => {
    // Arrange: (mockFormState มีแค่ค่า Default)

    // Act:
    renderHook(() => useBZ5_CCalculations(mockWatch as any, mockSetValue as any));

    // Assert: (ทุกค่าที่คำนวณต้องเป็น null)
    expect(mockFormState.bz5cCalculations.rc417WaterContentweight).toBe(null);
    expect(mockFormState.bz5cCalculations.totalWeightOfMaterials).toBe(null);
    expect(mockFormState.bz5cCalculations.totalNaclWater).toBe(null);
    expect(mockFormState.bz5cCalculations.naclWater4).toBe(null);
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(null);
    expect(mockFormState.bz5cCalculations.lminRate).toBe(''); // (เพราะ 0 ถูกแปลงเป็น '')
    expect(mockFormState.bz5cCalculations.totalWeightWithNcr).toBe(null);
  });


  // --- เทสที่ 3: สถานการณ์ "ผู้ใช้พิมพ์" (Dynamic Change) ---
  it('เทส 3: ควรคำนวณใหม่ เมื่อค่าที่ดักฟัง (dependency) เปลี่ยนแปลง', async () => {

    // --- Render ครั้งที่ 1 (ค่าว่าง) ---
    const { rerender } = renderHook(() =>
      useBZ5_CCalculations(mockWatch as any, mockSetValue as any)
    );

    // Assert ครั้งที่ 1 (ทุกอย่างเป็น null)
    expect(mockFormState.bz5cCalculations.totalWeightWithNcr).toBe(null);

    // --- Act 2: จำลองการ "พิมพ์" (เปลี่ยนค่าในฟอร์มจำลอง) ---
    act(() => {
      // (ใส่ค่าเหมือนเทส 1 แต่ "จงใจเว้น" P21 (WaterContent))
      mockFormState = {
        ...mockFormState,
        rc417Weighting: { total: 1000 }, // P20
        rawMaterials: {
          magnesiumHydroxide: 50,
          activatedcarbon: 20,
          gypsumplaster: 5,
          ncrGenmatsu: { actual: 300 },
        },
        bz5cCalculations: {
          ...mockFormState.bz5cCalculations,
          // rc417WaterContentMoisture: 10, // 👈 (เว้นไว้)
          naclWaterSpecGrav: 1.1,
        }
      };
    });

    // --- Render ครั้งที่ 2 (จำลอง React อัปเดต) ---
    rerender();

    // Assert ครั้งที่ 2:
    // [A] Total Materials (ไม่ขึ้นกับ P21) -> ต้องคำนวณ
    // = 1000 + 50 + 20 + 5 = 1075
    expect(mockFormState.bz5cCalculations.totalWeightOfMaterials).toBe('1075.00');

    // [NEW ✨] P22 (ขึ้นกับ P21) -> ต้องเป็น null
    expect(mockFormState.bz5cCalculations.rc417WaterContentweight).toBe(null);

    // [D] Total NaCl Water (ขึ้นกับ P22) -> ต้องเป็น null
    expect(mockFormState.bz5cCalculations.totalNaclWater).toBe(null);

    // [E-2] totalWeightWithNcr (ขึ้นกับ [D]) -> ต้องเป็น null
    expect(mockFormState.bz5cCalculations.totalWeightWithNcr).toBe(null);
  });

});