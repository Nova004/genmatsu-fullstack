// src/components/formGen/pages/Master/UserMaster.tsx

import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb';
import EditUserModal from './EditUserModal';
import axios from 'axios';
import { fireToast } from '../../../../hooks/fireToast';


interface AgtMember {
  agt_member_id: string;
  agt_member_nameEN: string;
  agt_position_name: string;
  name_fullsection: string;
  agt_member_shift: string;
  agt_status_job: string;
  Gen_Manu_mem_No: string | null;
}

const UserMaster: React.FC = () => {
  const [users, setUsers] = useState<AgtMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgtMember | null>(null);

  // --- 1. เพิ่ม State สำหรับการค้นหา (Search Term) ---
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // 1. ใช้ axios.get และ URL ที่สั้นลง
      const response = await axios.get('/api/users');

      // 2. ข้อมูล users จะอยู่ใน response.data โดยตรง
      setUsers(response.data);

    } catch (error) {
      // 3. catch จะทำงานทันทีถ้า API มีปัญหา
      console.error("Failed to fetch users", error);
      fireToast('error', 'Failed to load user data.'); // แจ้งเตือนผู้ใช้
      setUsers([]); // กำหนดค่าว่างให้ State เพื่อป้องกัน Error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (userToEdit: AgtMember) => {
    setEditingUser(userToEdit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userId: string, newEmployeeNo: string) => {
    try {
      // 1. ใช้ axios.put และส่งข้อมูล (body) เป็น object ที่สอง
      await axios.put(`/api/users/${userId}`, {
        Gen_Manu_mem_No: newEmployeeNo
      });
      // 2. ถ้าสำเร็จ ให้แจ้งเตือนสวยๆ
      fireToast('success', 'Employee number updated successfully!');

      handleCloseModal();
      fetchUsers(); // รีเฟรชข้อมูลในตาราง

    } catch (error: any) {
      // 3. catch จะทำงานทันทีถ้า API ตอบกลับมาเป็น Error
      console.error("Error saving user:", error);

      // ดึงข้อความ error จากที่ backend ส่งมา (ถ้ามี)
      const errorMessage = error.response?.data?.message || 'Failed to update employee number.';

      fireToast('error', errorMessage);
    }
  };

  // --- 2. สร้าง Array ใหม่สำหรับเก็บผลลัพธ์ที่ฟิลเตอร์แล้ว ---
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.agt_member_id.toLowerCase().includes(term) ||
      user.agt_member_nameEN.toLowerCase().includes(term) ||
      (user.Gen_Manu_mem_No && user.Gen_Manu_mem_No.toLowerCase().includes(term)) ||
      user.agt_position_name.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Breadcrumb pageName="User Master" />
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
            All Members from AGT System
          </h4>
          {/* --- 3. เพิ่มช่อง Input สำหรับค้นหาใน JSX --- */}
          <div className="mb-6 sm:mb-0">
            <input
              type="text"
              placeholder="Filter by ID, Name, No., Position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:w-64"
            />
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-medium text-black dark:text-white">ID</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Employee No.</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Name (EN)</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Position</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Shift</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-10">Loading users...</td></tr>
              ) : (
                // --- 4. อัปเดตตารางให้แสดงผลจากข้อมูลที่ฟิลเตอร์แล้ว ---
                filteredUsers.map((user) => (
                  <tr key={user.agt_member_id}>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.agt_member_id}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="font-medium text-primary">{user.Gen_Manu_mem_No || '-'}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.agt_member_nameEN}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.agt_position_name}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.agt_member_shift}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <button onClick={() => handleEditClick(user)} className="text-primary hover:underline">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal
        isOpen={isModalOpen}
        user={editingUser}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
      />
    </>
  );
};

export default UserMaster;