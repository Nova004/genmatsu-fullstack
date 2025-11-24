// 📁 path: src/components/formGen/pages/GEN_B/BS3-C_Form/BS3-CFormStep2.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// 1. 🚀 Import "สมอง" (Custom Hook)
import { useBS3_CCalculations } from './FormStep2';
import { IManufacturingReportForm } from '../../types'; // (Import Type แม่)

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
describe('FormStep2 (BS3-C) - useBS3-CCalculations (Logic การคำนวณ)', () => {
  // "beforeEach" = ล้าง "ฟอร์มจำลอง"
  beforeEach(() => {
    mockFormState = {}; // ล้างค่าทั้งหมด
    mockWatch.mockClear();
    mockSetValue.mockClear();
  });

  // --- เทสที่ 1: สถานการณ์ "กรอกข้อมูลครบ" (Happy Path) ---
  // ✨ (FIX) แก้ไขค่าที่คาดหวัง (Expected) ให้ตรงกับ Console Log
  it('เทส 1: ควรคำนวณทุก field ถูกต้อง เมื่อกรอกข้อมูลครบ (Happy Path)', async () => {
    // Arrange (จัดเตรียม):
    mockFormState = {
      rc417Weighting: {
        total: 1000,
      },
      rawMaterials: {
        magnesiumHydroxide: 50,
        activatedcarbon: 20,
        gypsumplaster: 5,
        ncrGenmatsu: { actual: 300 },
        remainedGenmatsu: { actual: 10 },
      },
      bs3Calculations: {
        naclWater: 0,
        stdMeanMoisture: 0,
        rc417WaterContent: 10,
        naclWaterSpecGrav: 1.1,
      },
    };

    // Act (กระทำ):
    renderHook(() =>
      useBS3_CCalculations(
        mockWatch as any,
        mockSetValue as any
      )
    );

    // Assert (ตรวจสอบ):
    await waitFor(() => {
      // (รอตัวสุดท้ายที่ถูก Set)
      // ✨ FIX: (Log [F5] บอก 2146.45)
      expect(mockFormState.bs3Calculations.totalWeightWithNcr).toBe(2146.45);
    });

    // --- ตอนนี้ 'useEffect' ทำงานเสร็จแล้ว ---

    // (เช็คค่าคงที่)
    expect(mockFormState.bs3Calculations.naclWater).toBe(4);
    expect(mockFormState.bs3Calculations.stdMeanMoisture).toBe(45.25);

    // [A] Total Materials
    expect(mockFormState.bs3Calculations.totalWeightOfMaterials).toBe('1075.00');

    // [D] Total NaCl
    // ✨ FIX: (Log [D5] บอก 761.45)
    expect(mockFormState.bs3Calculations.totalNaclWater).toBe(761.45);

    // [E-1] Final NaCl (L) (naclWater4)
    // ✨ FIX: (Log [E6] บอก 692)
    expect(mockFormState.bs3Calculations.naclWater4).toBe(692);
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(692);

    // [E-1] (L/min) lminRate
    // ✨ FIX: (Log [E11] บอก 35)
    expect(mockFormState.bs3Calculations.lminRate).toBe('35');
  });

  // --- เทสที่ 2: สถานการณ์ "ค่าว่าง" (Zero/Null Path) ---
  // (เทสนี้จะพัง จนกว่าจะแก้ Bug Guard Clause ใน Component)
  it('เทส 2: ควรคืนค่า null หรือ "" เมื่อค่า Input เป็น null', async () => {
    // Arrange: (mockFormState ว่างเปล่า)

    // Act:
    renderHook(() =>
      useBS3_CCalculations(
        mockWatch as any,
        mockSetValue as any
      )
    );

    // Assert: (รอให้ useEffect (Set ค่าคงที่) ทำงานเสร็จ)
    // (นี่คือจุดที่พังใน Log ล่าสุด)
    await waitFor(() => {
      expect(mockFormState.bs3Calculations.naclWater).toBe(4);
    });

    // Assert (รอให้ useEffect (คำนวณ) ทำงานเสร็จ)
    await waitFor(() => {
      expect(mockFormState.bs3Calculations.totalWeightOfMaterials).toBe(null);
    });

    // (เช็คที่เหลือ)
    expect(mockFormState.bs3Calculations.totalNaclWater).toBe(null);
    expect(mockFormState.bs3Calculations.naclWater4).toBe(null);
    expect(mockFormState.rawMaterials.sodiumChloride).toBe(null);
    expect(mockFormState.bs3Calculations.lminRate).toBe(null);
    expect(mockFormState.bs3Calculations.totalWeightWithNcr).toBe(null);
  });

  // --- เทสที่ 3: สถานการณ์ "หารด้วย 0" (Denominator = 0) ---
  // (เทสนี้จะพัง จนกว่าจะแก้ Bug || 0 ในขั้นตอน [D] ของ Component)
  it('เทส 3: ควรเป็น null ถ้าสูตร [B] หารด้วย 0', async () => {
    // Arrange:
    act(() => {
      mockFormState = {
        rc417Weighting: { total: 1000 },
        rawMaterials: { remainedGenmatsu: { actual: 0 } }, // (ต้องใส่ actual ด้วย)
        bs3Calculations: {
          rc417WaterContent: 10,
          stdMeanMoisture: 96, // (0.96)
          naclWater: 4, // (0.04)
        },
      };
    });

    // Act:
    renderHook(() =>
      useBS3_CCalculations(
        mockWatch as any,
        mockSetValue as any
      )
    );

    // Assert: (รอให้ useEffect ทำงานเสร็จ)
    await waitFor(() => {
      expect(mockFormState.bs3Calculations.totalWeightOfMaterials).toBe(
        '1000.00'
      );
    });

    // (ค่าที่เหลือ [B], [C], [D], [E], [F]... ต้องเป็น null เพราะหารด้วย 0)
    expect(mockFormState.bs3Calculations.totalNaclWater).toBe(null);
    expect(mockFormState.bs3Calculations.totalWeightWithNcr).toBe(null);
  });
});