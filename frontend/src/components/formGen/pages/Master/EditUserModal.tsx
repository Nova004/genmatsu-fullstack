// src/components/formGen/pages/Master/EditUserModal.tsx

import React, { useState, useEffect } from 'react';

// Interface นี้ควรจะถูกย้ายไปที่ไฟล์ types.ts ในอนาคต
// สังเกตว่า Gen_Manu_mem_No อาจจะเป็น null ถ้ายังไม่มีข้อมูล
interface UserData {
  agt_member_id: string;
  agt_member_nameEN: string;
  Gen_Manu_mem_No: string | null;
}

interface Props {
  isOpen: boolean;
  user: UserData | null;
  onClose: () => void;
  onSave: (userId: string, newEmployeeNo: string) => void;
}

const EditUserModal: React.FC<Props> = ({ isOpen, user, onClose, onSave }) => {
  const [employeeNo, setEmployeeNo] = useState('');

  useEffect(() => {
    // เมื่อ user prop เปลี่ยน (เมื่อกด Edit), ให้อัปเดตค่าใน state ของ modal
    if (user) {
      setEmployeeNo(user.Gen_Manu_mem_No || ''); // ถ้าเป็น null ให้แสดงเป็นค่าว่าง
    }
  }, [user]);

  if (!isOpen || !user) {
    return null;
  }

  const handleSave = () => {
    // ส่งกลับไปแค่ ID และรหัสพนักงานใหม่
    onSave(user.agt_member_id, employeeNo);
  };

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-default dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Edit Employee No for: {user.agt_member_nameEN}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Member ID: {user.agt_member_id}</p>
        </div>
        <div className="p-6.5">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Production Employee No.</label>
            <input 
              type="text" 
              value={employeeNo} 
              onChange={(e) => setEmployeeNo(e.target.value)}
              placeholder="Enter employee number for production"
              className={inputClass} 
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-stroke py-4 px-6.5 dark:border-strokedark">
          <button onClick={onClose} className="rounded-md border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white">
            Cancel
          </button>
          <button onClick={handleSave} className="rounded-md bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;