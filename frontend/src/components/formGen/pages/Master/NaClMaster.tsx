// NaClMaster.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

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
              Filter NaCl Master
            </h2>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-6 font-medium text-white hover:bg-opacity-90 transition-all shadow-md shadow-primary/20"
            >
              <FaPlus size={14} />
              Add New Master
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Box */}
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FaSearch className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary transition-all"
              />
            </div>

            {/* Percent Filter */}
            <div className="relative">
              <select
                value={percentFilter}
                onChange={(e) => setPercentFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
              >
                <option value="">All Percentages</option>
                <option value="15%">15%</option>
                <option value="4%">4%</option>
                <option value="13%">13%</option>
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            {/* Chemical Type Filter */}
            <div className="relative">
              <select
                value={chemicalTypeFilter}
                onChange={(e) => setChemicalTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
              >
                <option value="">All Chemical Types</option>
                <option value="Zeolite">Zeolite</option>
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* 📋 Data Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-strokedark flex justify-between items-center bg-gray-50/50 dark:bg-meta-4/30">
            <h3 className="font-bold text-gray-900 dark:text-white">
              NaCl List
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                {filteredUsers.length} Records
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 dark:bg-meta-4">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">ID</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">CG Water</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">NaCl Water</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">NaCl %</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Chemicals Type</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-strokedark">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <span className="mt-2 text-base text-gray-500">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-500 flex flex-col items-center">
                      <div className="bg-gray-100 p-3 rounded-full mb-3 dark:bg-meta-4">
                        <FaSearch className="text-gray-400 text-xl" />
                      </div>
                      <span className="text-base">No records found.</span>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item.NaCl_id} className="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base font-medium text-gray-900 dark:text-white">
                          {item.NaCl_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-700 dark:text-gray-300">
                          {item.NaCl_CG_Water}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-700 dark:text-gray-300">
                          {item.NaCl_NaCl_Water}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="inline-flex rounded-full bg-primary/10 py-1 px-3 text-sm font-medium text-primary border border-primary/20">
                          {item.NaCl_per_centum}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="text-base text-gray-700 dark:text-gray-300">
                          {item.Chemicals_Type}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-meta-4 transition-all"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.NaCl_id)}
                            className="p-2.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-meta-4 transition-all"
                            title="Delete"
                          >
                            <FaTrash size={18} />
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