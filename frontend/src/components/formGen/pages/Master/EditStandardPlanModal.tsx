import React, { useState, useEffect } from 'react';
import axios from 'axios'; // ✅ Added
import Swal from 'sweetalert2';

interface StandardPlan {
  id: number;
  form_type: string;
  target_value: number;
  updated_at: string;
}

interface EditStandardPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { form_type: string; target_value: number }) => Promise<void>;
  initialData: StandardPlan | null;
}

const EditStandardPlanModal: React.FC<EditStandardPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    form_type: '',
    target_value: '',
  });

  const [products, setProducts] = useState<any[]>([]); // ✅ Added Product List State

  useEffect(() => {
    // Fetch Products
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/genmatsu/api/products');
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        form_type: initialData.form_type,
        target_value: initialData.target_value.toString(),
      });
    } else {
      setFormData({ form_type: '', target_value: '' });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.form_type || !formData.target_value) {
      Swal.fire('Error', 'Please fill in all fields', 'error');
      return;
    }

    await onSave({
      form_type: formData.form_type,
      target_value: parseFloat(formData.target_value),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm outline-none">
      <div className="relative w-full max-w-lg rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header */}
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            {initialData ? 'Edit Standard Plan' : 'Add New Standard Plan'}
          </h3>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6.5">
            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                Select Product <span className="text-meta-1">*</span>
              </label>

              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select
                  name="form_type"
                  value={formData.form_type}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({ ...prev, [name]: value }));
                  }}
                  disabled={!!initialData} // Disable if editing
                  className={`relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${initialData ? 'cursor-not-allowed opacity-70' : ''
                    }`}
                >
                  <option value="" disabled>Select a Product</option>
                  {products.map((product) => (
                    <option key={product.Gen_Id} value={product.Gen_Id}>
                      {product.Gen_Name} 
                    </option>
                  ))}
                </select>
                <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
                  <svg
                    className="fill-current"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.8">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                        fill=""
                      ></path>
                    </g>
                  </svg>
                </span>
              </div>
              {initialData && (
                <p className="mt-1 text-xs text-bodydark2">
                  *Product cannot be changed. Delete and re-create if needed.
                </p>
              )}
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                Target Value (Std. Plan) <span className="text-meta-1">*</span>
              </label>
              <input
                type="number"
                name="target_value"
                step="0.01"
                placeholder="Enter Target Value (e.g., 2060.00)"
                value={formData.target_value}
                onChange={handleChange}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-4.5">
              <button
                type="button"
                onClick={onClose}
                className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStandardPlanModal;