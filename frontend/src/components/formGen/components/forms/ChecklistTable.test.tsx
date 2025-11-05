// 📁 path: src/components/formGen/components/forms/ChecklistTable.test.tsx

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChecklistTable from './ChecklistTable';
import { FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm } from '../../pages/types';

// ====================================================================
// 1. ARRANGE (จัดเตรียม) - ส่วนที่ 1: สร้างข้อมูล Mock
// ====================================================================

const MOCK_ITEMS = [
  {
    id: 'item1_cleanliness',
    label: '1. Check Cleanliness',
    condition: 'Must be clean',
    isOperatorCheck: false,
  },
  {
    id: 'item2_operator_link',
    label: '2. Check Operator Name',
    condition: 'Linked to operator',
    isOperatorCheck: true,
  },
];

// ====================================================================
// 2. เริ่มกลุ่มเทส (Test Suite)
// ====================================================================
describe('ChecklistTable (Unit Test)', () => {
  // ====================================================================
  // 3. ARRANGE (จัดเตรียม) - ส่วนที่ 2: สร้าง Mock Props
  // ====================================================================

  let mockRegister: vi.Mock;
  let mockWatch: vi.Mock;
  let mockErrors: FieldErrors<IManufacturingReportForm>;

  // Helper Function (ตัวช่วย)
  const renderComponent = (props = {}) => {
    const defaultProps = {
      register: mockRegister,
      watch: mockWatch,
      errors: mockErrors,
      items: MOCK_ITEMS,
      ...props,
    };
    // เรา return container เผื่อใช้ unmount
    return render(<ChecklistTable {...defaultProps} />);
  };

  // 'beforeEach' จะรัน "ก่อน" ทุกๆ 'it' block
  beforeEach(() => {
    mockRegister = vi.fn((id: string) => ({
      name: id,
    }));
    mockWatch = vi.fn();
    mockErrors = {};
    vi.clearAllMocks();
  });

  // ====================================================================
  // 4. เริ่มเขียนเทสเคส (Test Cases)
  // ====================================================================

  // --- เทสที่ 1: (ผ่านแล้ว) ---
  it('เทส 1: ควรender Items, Labels, และ Conditions ถูกต้อง', () => {
    renderComponent();
    expect(screen.getByText('1. Check Cleanliness')).toBeTruthy();
    expect(screen.getByText('Must be clean')).toBeTruthy();
    expect(screen.getByText('2. Check Operator Name')).toBeTruthy();
    expect(screen.getByText('Linked to operator')).toBeTruthy();
    expect(mockRegister).toHaveBeenCalledWith('checklist.item1_cleanliness');
    expect(mockRegister).toHaveBeenCalledWith('checklist.item2_operator_link');
  });

  // --- เทสที่ 2: (ผ่านแล้ว) ---
  it('เทส 2: ควรแสดง Error message ถ้ามี error ใน props', () => {
    mockErrors = {
      checklist: {
        item1_cleanliness: {
          type: 'required',
          message: 'Field này là bắt buộc!',
        },
      },
    };
    renderComponent({ errors: mockErrors });
    expect(screen.getByText('Field này là bắt buộc!')).toBeTruthy();
  });

  // --- เทสที่ 3 (ใหม่): [แก้ไข] เปลี่ยนวิธีค้นหา ---
  it('เทส 3: Input ทุกช่องควรเป็น "readOnly" ตลอดเวลา (ตาม Logic ใหม่)', () => {
    // Arrange (เคสที่ 1: "มี" operatorName)
    mockWatch.mockImplementation((id: string) => {
      if (id === 'mcOperators.0.name') {
        return 'John Doe'; 
      }
      return undefined;
    });

    // Act
    const { container } = renderComponent();
    
    // ✨ FIX: เปลี่ยนจาก getByRole มาเป็น container.querySelector
    const input1 = container.querySelector('input[name="checklist.item1_cleanliness"]');
    const input2 = container.querySelector('input[name="checklist.item2_operator_link"]');

    // Assert
    expect(input1).toBeTruthy(); // เช็คว่าหาเจอก่อน
    expect(input2).toBeTruthy(); // เช็คว่าหาเจอก่อน
    expect((input1 as HTMLInputElement).readOnly).toBe(true);
    expect((input2 as HTMLInputElement).readOnly).toBe(true);
    
    // Arrange (เคสที่ 2: "ไม่มี" operatorName)
    mockWatch.mockImplementation((id: string) => {
      if (id === 'mcOperators.0.name') {
        return '';
      }
      return undefined;
    });
    
    // Act (Render ใหม่)
    container.remove(); // ลบของเก่า
    const { container: newContainer } = renderComponent(); // Render ใหม่

    // ✨ FIX: เปลี่ยนวิธีค้นหา
    const input3 = newContainer.querySelector('input[name="checklist.item1_cleanliness"]');
    const input4 = newContainer.querySelector('input[name="checklist.item2_operator_link"]');

    // Assert (ก็ยังต้อง readOnly อยู่ดี)
    expect(input3).toBeTruthy();
    expect(input4).toBeTruthy();
    expect((input3 as HTMLInputElement).readOnly).toBe(true);
    expect((input4 as HTMLInputElement).readOnly).toBe(true);
  });


  // --- เทสที่ 4: [แก้ไข] เปลี่ยนวิธีค้นหา ---
  it('เทส 4: ควรแสดง placeholder ถูกต้อง ตามค่า "currentValue"', () => {
    // Arrange
    mockWatch.mockImplementation((id: string) => {
      if (id === 'checklist.item1_cleanliness') {
        return 'มีค่าแล้ว'; 
      }
      if (id === 'checklist.item2_operator_link') {
        return ''; 
      }
      if (id === 'mcOperators.0.name') {
        return undefined;
      }
      return undefined;
    });

    // Act
    const { container } = renderComponent(); // 👈 เอา container มาด้วย
    
    // ✨ FIX: เปลี่ยนจาก getByRole มาเป็น container.querySelector
    const input1 = container.querySelector('input[name="checklist.item1_cleanliness"]');
    const input2 = container.querySelector('input[name="checklist.item2_operator_link"]');

    // Assert
    expect(input1).toBeTruthy(); // เช็คว่าหาเจอก่อน
    expect(input2).toBeTruthy(); // เช็คว่าหาเจอก่อน
    
    // Input 1 (มีค่า) -> placeholder ควรเป็น 'กรอกผลลัพธ์'
    expect(input1!.getAttribute('placeholder')).toBe('กรอกผลลัพธ์'); // เพิ่ม ! เพื่อบอกว่าไม่ null

    // Input 2 (ไม่มีค่า) -> placeholder ควรเป็น '-'
    expect(input2!.getAttribute('placeholder')).toBe('-'); // เพิ่ม ! เพื่อบอกว่าไม่ null
  });

});