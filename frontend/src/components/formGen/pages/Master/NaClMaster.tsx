import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Breadcrumb from '../../../../components/Breadcrumbs/Breadcrumb';
import EditNaClModal from './EditNaClModal';
import { fireToast } from '../../../../hooks/fireToast';
import { useAuth } from '../../../../context/AuthContext'; // Import useAuth
import { useLevelGuard } from '../../../../hooks/useLevelGuard';

const NaClMaster = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const { user } = useAuth(); // Get user context

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [percentFilter, setPercentFilter] = useState(''); // สำหรับ NaCl %
  const [chemicalTypeFilter, setChemicalTypeFilter] = useState(''); // สำหรับ Chemicals Type
  useLevelGuard(2);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/genmatsu/api/nacl');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch NaCl data:', error);
      fireToast('error', 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (record: any | null = null) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSave = async (recordData: any) => {
    try {
      if (recordData.NaCl_id) {
        // Update
        await axios.put(`/genmatsu/api/nacl/${recordData.NaCl_id}`, {
          ...recordData,
          userId: user?.id || 'Admin' // Send userId
        });
        fireToast('success', 'Record updated successfully!');
      } else {
        // Create
        await axios.post('/genmatsu/api/nacl', {
          ...recordData,
          userId: user?.id || 'Admin' // Send userId
        });
        fireToast('success', 'Record created successfully!');
      }
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to save record:', error);
      fireToast('error', 'Failed to save record.');
    } finally {
      handleCloseModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/genmatsu/api/nacl/${id}`);
        fireToast('success', 'Record deleted successfully!');
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete record:', error);
        fireToast('error', 'Failed to delete record.');
      }
    }
  };

  // ใช้ States ใหม่: percentFilter และ chemicalTypeFilter
  const filteredUsers = data.filter(dataItem => {
    // --- 1. ตรวจสอบเงื่อนไข Search Term (ช่องค้นหา) ---
    const term = searchTerm.toLowerCase();
    const matchesSearchTerm = term === '' ? true : (
      // ... (ส่วนนี้ใช้ได้แล้ว)
      String(dataItem.NaCl_id || '').toLowerCase().includes(term) ||
      String(dataItem.NaCl_CG_Water || '').toLowerCase().includes(term) ||
      String(dataItem.NaCl_NaCl_Water || '').toLowerCase().includes(term) ||
      String(dataItem.Chemicals_Type || '').toLowerCase().includes(term)
    );

    // --- 2. ตรวจสอบเงื่อนไข NaCl % Filter (Dropdown 1) ---
    const percentValue = String(dataItem['NaCl_per_centum'] || '');
    const matchesPercentFilter = percentFilter === '' ? true : (
      percentValue === percentFilter
    );

    // --- 3. ตรวจสอบเงื่อนไข Chemicals Type Filter (Dropdown 2) ---
    const chemicalTypeValue = String(dataItem['Chemicals_Type'] || '');
    const matchesChemicalTypeFilter = chemicalTypeFilter === '' ? true : (
      chemicalTypeValue === chemicalTypeFilter
    );

    // --- 4. ต้องเป็นจริงทั้ง 3 เงื่อนไข (AND) ---
    return matchesSearchTerm && matchesPercentFilter && matchesChemicalTypeFilter;
  });

  return (
    <>
      <Breadcrumb pageName="NaCl Master" />
      <div className="flex flex-col gap-10">
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              NaCl Management
            </h4>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
            >
              Add New Record
            </button>
          </div>

          <div className="mb-6 sm:mb-0 flex flex-col sm:flex-row justify-end items-center gap-4">
            {/* ===== 🔽 Dropdown อัปเดตตัวเลือกใหม่ ===== */}
            <select
              value={percentFilter}
              onChange={(e) => setPercentFilter(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:w-48"
            >
              <option value="">All Types</option>
              {/* ⬇️ อัปเดตตัวเลือกที่นี่ */}
              <option value="15%">15%</option>
              <option value="4%">4%</option>
              <option value="13%">13%</option>
            </select>

            <select
              value={chemicalTypeFilter} // 👈 ใช้ State ใหม่
              onChange={(e) => setChemicalTypeFilter(e.target.value)} // 👈 ใช้ Setter ใหม่
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:w-48"
            >
              <option value="">Chemicals Type</option>
              <option value="Zeolite">Zeolite</option>
            </select>
            {/* ===== 🔼 สิ้นสุด Dropdown ===== */}

            {/* Input ค้นหาเดิม */}
            <input
              type="text"
              placeholder="Filter by ID, Name, No., Position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary sm:w-64"
            />
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    ID
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    CG Water
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    NaCl Water
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    NaCl %
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Chemicals Type
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((data) => (
                    <tr key={data.NaCl_id}>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {data.NaCl_id}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {data.NaCl_CG_Water}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {data.NaCl_NaCl_Water}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {data.NaCl_per_centum}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {data.Chemicals_Type}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center space-x-3.5">
                          <button
                            onClick={() => handleOpenModal(data)}
                            className="hover:text-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(data.NaCl_id)}
                            className="hover:text-danger"
                          >
                            Delete
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
      </div>
      <EditNaClModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingRecord}
      />
    </>
  );
};

export default NaClMaster;