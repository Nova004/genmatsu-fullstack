import React, { useState, useEffect } from 'react';
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
                Form Type (Product Name) <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                name="form_type"
                placeholder="Enter Product Code (e.g., AS2)"
                value={formData.form_type}
                onChange={handleChange}
                disabled={!!initialData} // ห้ามแก้ชื่อถ้าเป็นการ Edit
                className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                  initialData ? 'cursor-not-allowed opacity-70' : ''
                }`}
              />
              {initialData && (
                <p className="mt-1 text-xs text-bodydark2">
                  *Product Name cannot be changed. Delete and re-create if needed.
                </p>
              )}
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                Target Value (ST. Plan) <span className="text-meta-1">*</span>
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