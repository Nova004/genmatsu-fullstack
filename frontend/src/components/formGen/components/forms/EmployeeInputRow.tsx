// src/components/forms/EmployeeInputRow.tsx

import React, { useEffect, useState } from 'react';
import { EmployeeInputRowProps } from '../../pages/BZ_Form/types';

const EmployeeInputRow: React.FC<EmployeeInputRowProps> = ({ groupName, index, register, watch, setValue }) => {
  
  // 1. สร้าง "สายลับ" คอยแอบดูรหัสพนักงานที่ User พิมพ์
  const employeeId = watch(`${groupName}.${index}.id`);
  
  // (Optional) สร้าง State สำหรับแสดงสถานะ Loading...
  const [isLoading, setIsLoading] = useState(false);

  // 2. สร้าง "ยามเฝ้าระวัง" ที่จะทำงานเมื่อ "รหัสพนักงาน" เปลี่ยน
  useEffect(() => {
    // ถ้าไม่มีการพิมพ์รหัส หรือรหัสสั้นเกินไป ก็ไม่ต้องทำอะไร
    if (!employeeId || employeeId.length < 5) { // อาจจะกำหนดความยาวขั้นต่ำ
        setValue(`${groupName}.${index}.name`, '');
        setValue(`${groupName}.${index}.number`, '');
        return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 3. ยิง API ไปที่ Backend (นายต้องสร้าง API เส้นนี้ขึ้นมา)
        const response = await fetch(`http://localhost:4000/api/users/${employeeId}`); // <<-- แก้ URL ให้ถูกต้อง
        
        if (!response.ok) {
          // ถ้าหาไม่เจอ หรือมี Error
          setValue(`${groupName}.${index}.name`, 'ไม่พบข้อมูลพนักงาน');
          setValue(`${groupName}.${index}.number`, '');
          return;
        }

        const userData = await response.json();

        // 4. ถ้าเจอข้อมูล ให้ "ผู้สั่งการ" (setValue) นำข้อมูลไปใส่ในช่องต่างๆ
        setValue(`${groupName}.${index}.name`, userData.fullName); // สมมติว่า API trả về { fullName: '...', userNumber: '...' }
        setValue(`${groupName}.${index}.number`, userData.userNumber);

      } catch (error) {
        console.error("Error fetching user data:", error);
        setValue(`${groupName}.${index}.name`, 'การเชื่อมต่อผิดพลาด');
        setValue(`${groupName}.${index}.number`, '');
      } finally {
        setIsLoading(false);
      }
    };

    // หน่วงเวลาเล็กน้อย (Debounce) เพื่อไม่ให้ยิง API ทุกครั้งที่พิมพ์
    const delayDebounceFn = setTimeout(() => {
      fetchUserData();
    }, 500); // รอ 0.5 วินาทีหลังจากผู้ใช้หยุดพิมพ์

    return () => clearTimeout(delayDebounceFn); // Clear timeout ถ้ามีการพิมพ์ใหม่

  }, [employeeId, groupName, index, setValue]); // <-- ยามจะทำงานเมื่อค่าเหล่านี้เปลี่ยน

  const inputGroupClass = "flex w-full";
  const spanClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";
  const inputClass = "w-full rounded-r-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} dark:!bg-gray-700 !bg-gray-200`;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div className={inputGroupClass}> 
        <span className={spanClass}>รหัสพนักงาน</span> 
        <input type="text" className={inputClass} {...register(`${groupName}.${index}.id`)} /> 
      </div>
      <div className={inputGroupClass}> 
        <span className={spanClass}>ชื่อ-นามสกุล</span> 
        <input type="text" className={disabledInputClass} readOnly disabled value={isLoading ? "Loading..." : watch(`${groupName}.${index}.name`)} />
      </div>
      <div className={inputGroupClass}> 
        <span className={spanClass}>เลขที่</span> 
        <input type="text" className={disabledInputClass} readOnly disabled {...register(`${groupName}.${index}.number`)} /> 
      </div>
    </div>
  );
};

export default EmployeeInputRow;