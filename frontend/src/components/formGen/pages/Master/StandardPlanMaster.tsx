// local src/components/formGen/pages/Master/StandardPlanMaster.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb'; // ตรวจสอบ path ให้ถูกต้อง
import EditStandardPlanModal from './EditStandardPlanModal'; // Import Modal ที่สร้างใหม่
import { useAuth } from '../../../../context/AuthContext';
import { useLevelGuard } from '../../../../hooks/useLevelGuard';

interface StandardPlan {
  id: number;
  form_type: string; // This is now Gen_Id
  product_name?: string; // ✅ Added (from Join)
  target_value: number;
  updated_by: string;
  updated_at: string;
}

const StandardPlanMaster: React.FC = () => {
  const [plans, setPlans] = useState<StandardPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<StandardPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); // 👈 Call hook
  useLevelGuard(2);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StandardPlan | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/genmatsu/api/master/standard-plans`);
      setPlans(res.data);
      setFilteredPlans(res.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
      Swal.fire('Error', 'Failed to fetch data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Search Logic
  useEffect(() => {
    const results = plans.filter((plan) =>
      plan.form_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlans(results);
  }, [searchTerm, plans]);

  const handleEdit = (plan: StandardPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/genmatsu/api/master/standard-plans/${id}`);
        Swal.fire('Deleted!', 'Record has been deleted.', 'success');
        fetchPlans();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete record', 'error');
      }
    }
  };

  const handleSave = async (data: { form_type: string; target_value: number }) => {
    try {
      await axios.post(`/genmatsu/api/master/standard-plans`, {
        ...data,
        updated_by: user?.id || 'Admin' // 👈 Use real user ID (mapped as 'id' in AuthContext)
      });
      Swal.fire('Success', 'Data saved successfully', 'success');
      fetchPlans();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to save data', 'error');
      throw error; // ให้ Modal รู้ว่า Error
    }
  };

  return (
    <>
      <Breadcrumb pageName="Standard Plan Master" />

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
              Filter Standard Plan
            </h2>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-6 font-medium text-white hover:bg-opacity-90 transition-all shadow-md shadow-primary/20"
            >
              <FaPlus size={14} />
              Add New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Box */}
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search Product or Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* 📋 Data Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-strokedark flex justify-between items-center bg-gray-50/50 dark:bg-meta-4/30">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Standard Plans
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                {filteredPlans.length} Records
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 dark:bg-meta-4">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">GEN Type / Product</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target (Kg)</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Updated By</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Updated</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-strokedark">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <span className="mt-2 text-base text-gray-500">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 flex flex-col items-center">
                      <div className="bg-gray-100 p-3 rounded-full mb-3 dark:bg-meta-4">
                        <FaSearch className="text-gray-400 text-xl" />
                      </div>
                      <span className="text-base">No Standard Plans found.</span>
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <h5 className="font-medium text-black dark:text-white text-base flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary/80"></span>
                          {plan.product_name || plan.form_type}
                        </h5>
                        {plan.product_name && plan.form_type !== plan.product_name && (
                          <p className="text-sm text-gray-500 ml-4 mt-0.5">{plan.form_type}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <span className="inline-flex rounded-full bg-success/10 py-1 px-3 text-base font-medium text-success border border-success/20">
                          {plan.target_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-gray-700 dark:text-gray-300">{plan.updated_by}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark">
                        <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(plan.updated_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-gray-100 dark:border-strokedark text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(plan)}
                            className="p-2.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-meta-4 transition-all"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
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

        <EditStandardPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingPlan}
        />
      </div>
    </>
  );
};

export default StandardPlanMaster;