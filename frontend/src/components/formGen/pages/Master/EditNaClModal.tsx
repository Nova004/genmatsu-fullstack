import React, { useState, useEffect } from 'react';

// 1. สร้าง Interface เพื่อกำหนดโครงสร้างข้อมูลของ State
interface NaClFormData {
  NaCl_id?: number; // id อาจจะไม่มีในตอนสร้างใหม่
  NaCl_CG_Water: string | number;
  NaCl_NaCl_Water: string | number;
}

interface EditNaClModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NaClFormData) => void;
  // ใช้ Type `NaClFormData` กับ initialData ด้วย
  initialData: NaClFormData | null;
}

const EditNaClModal: React.FC<EditNaClModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  // 2. กำหนด Type ให้กับ useState
  const [formData, setFormData] = useState<NaClFormData>({
    NaCl_CG_Water: '',
    NaCl_NaCl_Water: '',
  });

  useEffect(() => {
    // ถ้ามี initialData (ตอนกด Edit) ให้ set state, ถ้าไม่ (ตอนกด Add) ให้ใช้ค่าว่าง
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ NaCl_CG_Water: '', NaCl_NaCl_Water: '' });
    }
  }, [initialData, isOpen]); // เพิ่ม isOpen เพื่อให้ state reset ทุกครั้งที่เปิด modal

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // TypeScript จะรู้ทันทีว่า prev คือ NaClFormData ทำให้ error หายไป
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-boxdark p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
          {initialData?.NaCl_id ? 'Edit' : 'Add'} NaCl Record
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2.5 block text-black dark:text-white">
              CG Water
            </label>
            <input
              type="number"
              name="NaCl_CG_Water"
              value={formData.NaCl_CG_Water}
              onChange={handleChange}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              required
              step="any" // อนุญาตให้ใส่ทศนิยม
            />
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block text-black dark:text-white">
              NaCl Water
            </label>
            <input
              type="number"
              name="NaCl_NaCl_Water"
              value={formData.NaCl_NaCl_Water}
              onChange={handleChange}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
              required
              step="any" // อนุญาตให้ใส่ทศนิยม
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded bg-gray-2 text-black dark:bg-meta-4 dark:text-white hover:bg-opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-primary text-white hover:bg-opacity-90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNaClModal;