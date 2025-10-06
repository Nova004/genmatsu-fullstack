// frontend/src/components/formGen/components/FormHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 1. Import useNavigate

// 2. ไม่ต้องรับ register มาแล้ว แต่รับค่าปัจจุบัน (currentValue) และ URL ของแต่ละฟอร์มมาแทน
interface FormHeaderProps {
  title: string;
  formTypes: { value: string; label: string; path: string; }[]; // 👈 3. เพิ่ม path เข้าไป
  currentValue: string; // 👈 4. รับค่าที่ถูกเลือกปัจจุบัน
  inputClass: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title, formTypes, currentValue, inputClass }) => {
  const navigate = useNavigate(); // 👈 5. เรียกใช้ hook

  // 6. สร้างฟังก์ชันที่จะทำงานเมื่อมีการเลือก Dropdown
  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    // ค้นหา path ที่ตรงกับค่าที่เลือก
    const selectedForm = formTypes.find(form => form.value === selectedValue);
    if (selectedForm) {
      navigate(selectedForm.path); // 👈 7. สั่งให้เปลี่ยนหน้าไปยัง path ที่กำหนด
    }
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark md:flex-row">
      <h4 className="text-lg font-semibold text-black dark:text-white">
        {title}
      </h4>
      
      {formTypes.length > 1 && (
        // 8. ใช้ onChange และ value แทน register
        <select 
          className={`${inputClass} max-w-xs`} 
          value={currentValue} 
          onChange={handleFormChange}
        >
          {formTypes.map((form) => (
            <option key={form.value} value={form.value}>
              {form.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default FormHeader;