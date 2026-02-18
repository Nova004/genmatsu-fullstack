// src/components/formGen/pages/Master/UserMaster.tsx

import React, { useState, useEffect } from 'react';
import { FaEdit, FaSearch, FaUsers, FaFilter } from 'react-icons/fa';
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
  const uniqueLevels = [...new Set(users.map(u => u.LV_Approvals !== null && u.LV_Approvals !== undefined ? String(u.LV_Approvals) : null).filter(val => val !== null))].sort();

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

      <div className="flex flex-col gap-6">
        {/* 🔍 Controls Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </span>
              Filter User Master
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full dark:bg-meta-4 dark:text-gray-400">
                {users.length} Total Users
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Search Box */}
            <div className="relative xl:col-span-1">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <FaSearch className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Section Filter */}
            <div className="relative">
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
              >
                <option value="">All Sections</option>
                {uniqueSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <FaFilter className="w-3 h-3" />
              </span>
            </div>

            {/* Position Filter */}
            <div className="relative">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
              >
                <option value="">All Positions</option>
                {uniquePositions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <FaFilter className="w-3 h-3" />
              </span>
            </div>

            {/* Shift Filter */}
            <div className="relative">
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
              >
                <option value="">All Shifts</option>
                {uniqueShifts.map((shift) => (
                  <option key={shift} value={shift}>{shift}</option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <FaFilter className="w-3 h-3" />
              </span>
            </div>

            {/* Level Filter */}
            <div className="relative">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
              >
                <option value="">All Levels</option>
                {uniqueLevels.map((lv) => (
                  <option key={String(lv)} value={String(lv)}>Level {lv}</option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <FaFilter className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* 📋 Data Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-strokedark flex justify-between items-center bg-gray-50/50 dark:bg-meta-4/30">
            <h3 className="font-bold text-gray-900 dark:text-white">
              User List
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                {filteredUsers.length} Filtered
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 dark:bg-meta-4">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">ID</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Emp No.</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name (EN)</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Section</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Position</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Shift</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">Level</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-strokedark">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <span className="mt-2 text-base text-gray-500">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-500 flex flex-col items-center">
                      <div className="bg-gray-100 p-3 rounded-full mb-3 dark:bg-meta-4">
                        <FaSearch className="text-gray-400 text-xl" />
                      </div>
                      <span className="text-base">No users found.</span>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.agt_member_id} className="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-500 dark:text-gray-400 font-mono text-sm">
                          {user.agt_member_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="inline-flex rounded-full bg-primary/10 py-1 px-3 text-sm font-bold text-primary border border-primary/20">
                          {user.Gen_Manu_mem_No || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-medium text-gray-900 dark:text-white">
                            {user.agt_member_nameEN}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-700 dark:text-gray-300">
                          {user.name_section}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-700 dark:text-gray-300">
                          {user.agt_position_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-700 dark:text-gray-300">
                          {user.agt_member_shift}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark text-center">
                        {user.LV_Approvals !== null && user.LV_Approvals !== undefined ? (
                          <span className="inline-flex rounded-full bg-blue-100 text-blue-800 py-0.5 px-2.5 text-xs font-bold dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            LV.{user.LV_Approvals}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark text-center">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-meta-4 transition-all"
                          title="Edit User"
                        >
                          <FaEdit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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