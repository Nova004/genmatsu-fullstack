// locaint:frontend/src/components/formGen/components/forms/EmployeeInputRow.tsx

import React, { useEffect, useState } from 'react';
import { EmployeeInputRowProps } from '../../pages/types';
import axios from 'axios';


const EmployeeInputRow: React.FC<EmployeeInputRowProps> = ({ groupName, index, register, watch, setValue }) => {

  // 1. สร้าง "สายลับ" คอยแอบดูรหัสพนักงานที่ User พิมพ์
  const employeeId = watch(`${groupName}.${index}.id`);

  // (Optional) สร้าง State สำหรับแสดงสถานะ Loading...
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!employeeId || employeeId.length < 5) {
      setValue(`${groupName}.${index}.name`, '-');
      setValue(`${groupName}.${index}.number`, '-');
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 1. ใช้ axios.get และ URL ที่สั้นลง (เพราะมี Proxy)
        const response = await axios.get(`/genmatsu/api/users/${employeeId}`);

        // 2. ถ้าเจอข้อมูล ข้อมูลจะอยู่ใน response.data
        const userData = response.data;

        // 3. [‼️ แก้ไข] นำข้อมูลไปใส่ในฟอร์ม (เปลี่ยนจาก .agt_member_nameEN เป็น .fullName)
        setValue(`${groupName}.${index}.name`, userData.fullName);
        setValue(`${groupName}.${index}.number`, userData.userNumber);

      } catch (error) {
        // 4. catch ของ axios จะทำงานทั้งกรณีหาไม่เจอ (404) และเน็ตเวิร์คพัง
        console.error("Error fetching user data:", error);
        setValue(`${groupName}.${index}.name`, 'ไม่พบข้อมูลพนักงาน');
        setValue(`${groupName}.${index}.number`, '-');

      } finally {
        setIsLoading(false);
      }
    };

    // ส่วนของ Debounce (หน่วงเวลา) ยังคงทำงานเหมือนเดิม
    const delayDebounceFn = setTimeout(() => {
      fetchUserData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);

  }, [employeeId, groupName, index, setValue]);

  const inputGroupClass = "flex w-full";
  const spanClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";
  const inputClass = "w-full rounded-r-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} dark:!bg-gray-700 !bg-gray-200`;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-8">
      <div className={`md:col-span-2 ${inputGroupClass}`}>
        <span className={spanClass}>ID</span>
        <input
          type="text"
          className={inputClass}
          {...register(`${groupName}.${index}.id`)}
        />
      </div>
      <div className={`md:col-span-4 ${inputGroupClass}`}>
        <span className={spanClass}>Name</span>
        <input
          type="text"
          className={disabledInputClass}
          readOnly
          disabled
          value={isLoading ? "Loading..." : watch(`${groupName}.${index}.name`) || '-'}
        />
      </div>
      <div className={`md:col-span-2 ${inputGroupClass}`}>
        <span className={spanClass}>No.</span>
        <input
          type="text"
          className={disabledInputClass}
          readOnly
          disabled
          {...register(`${groupName}.${index}.number`)}
          value={watch(`${groupName}.${index}.number`) || '-'}
        />
      </div>
    </div>
  );
};

export default EmployeeInputRow;