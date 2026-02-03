// src/components/formGen/pages/Master/UserMaster.tsx

import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb';
import EditUserModal from './EditUserModal';
import axios from 'axios';
import { fireToast } from '../../../../hooks/fireToast';
import apiClient from '../../../../services/apiService';
import { useLevelGuard } from '../../../../hooks/useLevelGuard';

import { useAuth } from '../../../../context/AuthContext'; // Import useAuth

interface AgtMember {
  agt_member_id: string;
  agt_member_nameEN: string;
  agt_position_name: string;
  agt_member_shift: string;
  agt_status_job: string;
  name_section: string;
  Gen_Manu_mem_No: string | null;
  LV_Approvals: string | null;
}

const UserMaster: React.FC = () => {
  const [users, setUsers] = useState<AgtMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgtMember | null>(null);
  const { user } = useAuth(); // Get user context
  useLevelGuard(2);

  // ... (search term code skipped for brevity if unchanged) ...
  const [searchTerm, setSearchTerm] = useState('');
  // 🆕 Filter States
  const [filterSection, setFilterSection] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/all-with-gen-manu');
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      fireToast('error', 'Failed to load user data.');
      setUsers([]);
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

  const handleSaveUser = async (userId: string, newEmployeeNo: string, newLevel: number) => {
    try {
      // 1. ใช้ apiService.put และ API Endpoint "ใหม่"
      await apiClient.put(`/users/gen-manu-data`, {
        // 2. ส่ง Body ตามที่ Backend (updateUserGenManuData) รอรับ
        agtMemberId: userId,
        genManuMemNo: newEmployeeNo,
        lvApprovals: newLevel,
        updatedBy: user?.id || 'Admin' // Send updatedBy
      });

      fireToast('success', 'User data updated successfully!');
      handleCloseModal();
      fetchUsers(); // รีเฟรชข้อมูล

    } catch (error: any) {
      console.error("Error saving user:", error);
      const errorMessage = error.response?.data?.message || 'Failed to update user data.';
      fireToast('error', errorMessage);
    }
  };

  // --- 2. สร้าง Array ใหม่สำหรับเก็บผลลัพธ์ที่ฟิลเตอร์แล้ว ---
  // 🆕 คำนวณ Unique Options สำหรับ Dropdown
  const uniqueSections = [...new Set(users.map(u => u.name_section).filter(Boolean))].sort();
  const uniquePositions = [...new Set(users.map(u => u.agt_position_name).filter(Boolean))].sort();
  const uniqueShifts = [...new Set(users.map(u => u.agt_member_shift).filter(Boolean))].sort();
  const uniqueLevels = [...new Set(users.map(u => u.LV_Approvals ? String(u.LV_Approvals) : null).filter(Boolean))].sort();

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      user.agt_member_id.toLowerCase().includes(term) ||
      user.agt_member_nameEN.toLowerCase().includes(term) ||
      (user.Gen_Manu_mem_No && user.Gen_Manu_mem_No.toLowerCase().includes(term)) ||
      user.agt_position_name.toLowerCase().includes(term)
    );

    const matchesSection = filterSection ? user.name_section === filterSection : true;
    const matchesPosition = filterPosition ? user.agt_position_name === filterPosition : true;
    const matchesShift = filterShift ? user.agt_member_shift === filterShift : true;
    const matchesLevel = filterLevel ? String(user.LV_Approvals) === filterLevel : true;

    return matchesSearch && matchesSection && matchesPosition && matchesShift && matchesLevel;
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:w-64"
            />
          </div>
        </div>

        {/* 🆕 Filter Dropdowns Section */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Section Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Position</label>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Positions</option>
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Shift</label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Shifts</option>
              {uniqueShifts.map((shift) => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Level (LV)</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">All Levels</option>
              {/* <option value="null">No Level</option> */}
              {uniqueLevels.map((lv) => (
                <option key={String(lv)} value={String(lv)}>{lv}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-medium text-black dark:text-white">ID</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Employee No.</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Name (EN)</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Section</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Position</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Shift</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">LV.</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center p-10">Loading users...</td></tr>
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
                      <p className="text-black dark:text-white">{user.name_section}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.agt_position_name}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.agt_member_shift}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{user.LV_Approvals}</p>
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