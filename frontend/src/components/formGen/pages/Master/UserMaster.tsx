// src/components/formGen/pages/Master/UserMaster.tsx

import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb';
import EditUserModal from './EditUserModal';

// 1. อัปเดต Type ให้มี Gen_Manu_mem_No
interface AgtMember {
  agt_member_id: string;
  agt_member_nameEN: string;
  agt_position_name: string;
  name_fullsection: string;
  agt_member_shift: string;
  agt_status_job: string;
  Gen_Manu_mem_No: string | null; // Field ใหม่จากตาราง Gen_Manu_Member
}

const UserMaster: React.FC = () => {
  const [users, setUsers] = useState<AgtMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgtMember | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
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
      const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Gen_Manu_mem_No: newEmployeeNo }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update employee number.');
      }
      
      alert('Employee number updated successfully!');
      handleCloseModal();
      fetchUsers(); // โหลดข้อมูลใหม่เพื่อรีเฟรชตาราง

    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <Breadcrumb pageName="User Employee No. Master" />
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
          Manage Employee Number for Production
        </h4>
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
                users.map((user) => (
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