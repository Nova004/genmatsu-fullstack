import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Breadcrumb from '../../../../components/Breadcrumbs/Breadcrumb';
import EditNaClModal from './EditNaClModal';
import { fireToast } from '../../../../hooks/fireToast';

const NaClMaster = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/nacl');
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
        await axios.put(`/api/nacl/${recordData.NaCl_id}`, recordData);
        fireToast('success', 'Record updated successfully!');
      } else {
        // Create
        await axios.post('/api/nacl', recordData);
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
        await axios.delete(`/api/nacl/${id}`);
        fireToast('success', 'Record deleted successfully!');
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete record:', error);
        fireToast('error', 'Failed to delete record.');
      }
    }
  };

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
                  data.map((row) => (
                    <tr key={row.NaCl_id}>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {row.NaCl_id}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {row.NaCl_CG_Water}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {row.NaCl_NaCl_Water}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center space-x-3.5">
                          <button
                            onClick={() => handleOpenModal(row)}
                            className="hover:text-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.NaCl_id)}
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