import React, { useState, useEffect } from 'react';

interface UserData {
  agt_member_id: string;
  agt_member_nameEN: string;
  Gen_Manu_mem_No: string | null;
  LV_Approvals: number | string | null;
}

interface Props {
  isOpen: boolean;
  user: UserData | null;
  onClose: () => void;
  // 👈 [แก้ไข] อัปเกรด onSave ให้รับ newLevel ด้วย
  onSave: (userId: string, newEmployeeNo: string, newLevel: number) => void;
}

const EditUserModal: React.FC<Props> = ({ isOpen, user, onClose, onSave }) => {
  const [employeeNo, setEmployeeNo] = useState('');
  // 👈 [เพิ่ม] สร้าง State ใหม่สำหรับ LV
  const [level, setLevel] = useState('0');

  useEffect(() => {
    if (user) {
      setEmployeeNo(user.Gen_Manu_mem_No || '');
      // 👈 [แก้ไข] ตั้งค่า level state (แปลงเป็น string สำหรับ <input>)
      setLevel(String(user.LV_Approvals || 0));
    }
  }, [user]);

  if (!isOpen || !user) {
    return null;
  }

  const handleSave = () => {
    // 👈 [แก้ไข] แปลง LV กลับเป็นตัวเลขก่อนส่ง
    const newLevelAsNumber = parseInt(level, 10) || 0;
    onSave(user.agt_member_id, employeeNo, newLevelAsNumber);
  };

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-default dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Edit User: {user.agt_member_nameEN}
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

          {/* 🚀 [แก้ไข] แก้ไข Input ของ LV ให้ถูกต้อง */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Approval Level (0-3)</label>
            <input
              type="number" 
              value={level} 
              onChange={(e) => setLevel(e.target.value)} 
              placeholder="0"
              min="0"
              max="3"
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