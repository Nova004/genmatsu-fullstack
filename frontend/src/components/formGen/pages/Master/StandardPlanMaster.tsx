import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb'; // ตรวจสอบ path ให้ถูกต้อง
import EditStandardPlanModal from './EditStandardPlanModal'; // Import Modal ที่สร้างใหม่

interface StandardPlan {
  id: number;
  form_type: string;
  target_value: number;
  updated_at: string;
}

const StandardPlanMaster: React.FC = () => {
  const [plans, setPlans] = useState<StandardPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<StandardPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
        updated_by: 'Admin' // อนาคตเปลี่ยนเป็น user context
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

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-4 top-3 text-bodydark2">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded bg-gray-50 border border-stroke py-2.5 pl-10 pr-4 outline-none focus:border-primary dark:bg-meta-4 dark:border-strokedark dark:focus:border-primary"
            />
          </div>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            <span><FaPlus /></span>
            Add New Plan
          </button>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                  Form Type (Product)
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  ST. Plan Target (Kg)
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  Last Updated
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    <div className="flex justify-center items-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-bodydark2">
                    No Standard Plans found.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <h5 className="font-medium text-black dark:text-white">
                        {plan.form_type}
                      </h5>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                        {plan.target_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-sm text-bodydark2">
                        {new Date(plan.updated_at).toLocaleDateString('th-TH')}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center justify-center space-x-3.5">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="hover:text-danger transition-colors"
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
    </>
  );
};

export default StandardPlanMaster;