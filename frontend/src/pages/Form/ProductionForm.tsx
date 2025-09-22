// frontend/src/pages/Form/ProductionForm.tsx
import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import axios from 'axios';


// สร้าง Type เพื่อให้ TypeScript รู้จักโครงสร้างของข้อมูลเรา
interface Field {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
}

interface Section {
  id: string;
  title: string;
  type?: 'table';
  fields?: Field[];
  columns?: any[];
  defaultRows?: any[];
}

interface FormStructure {
  FormName: string;
  StructureDefinition: {
    title: string;
    sections: Section[];
  };
}

const ProductionForm = () => {
  const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
  const [formData, setFormData] = useState<any>({}); // <-- STATE ใหม่สำหรับเก็บข้อมูลที่กรอก
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formTemplateId = 1;

  useEffect(() => {
    const fetchFormTemplate = async () => {
      try {
        // 1. ใช้ axios.get และ URL ที่สั้นลง
        const response = await axios.get(`/api/forms/templates/${formTemplateId}`);

        // 2. ข้อมูล form template จะอยู่ใน response.data โดยตรง
        const data = response.data;
        setFormStructure(data);

        // --- Logic การสร้าง formData เริ่มต้นยังคงเหมือนเดิมทุกประการ ---
        const initialData: any = {};
        data.StructureDefinition.sections.forEach((section: Section) => {
          if (section.type === 'table') {
            initialData[section.id] = section.defaultRows || [];
          } else if (section.fields) {
            initialData[section.id] = {};
            section.fields.forEach((field: Field) => {
              initialData[section.id][field.name] = '';
            });
          }
        });
        setFormData(initialData);
        // ------------------------------------------------------------------

      } catch (err: any) {
        // 3. catch จะทำงานทันทีถ้า API มีปัญหา (เช่น หา template ไม่เจอ)
        console.error("Failed to fetch form template:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFormTemplate();
  }, [formTemplateId]);

  // --- ฟังก์ชันใหม่: จัดการการเปลี่ยนแปลงของ Input ทั่วไป ---
  const handleInputChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [sectionId]: {
        ...prevData[sectionId],
        [fieldName]: value,
      },
    }));
  };

  // --- ฟังก์ชันใหม่: จัดการการเปลี่ยนแปลงของ Input ในตาราง ---
  const handleTableChange = (sectionId: string, rowIndex: number, columnName: string, value: any) => {
    setFormData((prevData: any) => {
      const updatedTable = [...prevData[sectionId]];
      updatedTable[rowIndex] = { ...updatedTable[rowIndex], [columnName]: value };
      return {
        ...prevData,
        [sectionId]: updatedTable,
      };
    });
  };

  // --- ฟังก์ชันใหม่: สำหรับ Render Input แต่ละประเภท ---
  const renderField = (sectionId: string, field: Field) => {
    const value = formData[sectionId]?.[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'time':
        return (
          <div className="mb-4.5" key={field.name}>
            <label className="mb-2.5 block text-black dark:text-white">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={value}
              onChange={(e) => handleInputChange(sectionId, field.name, e.target.value)}
              placeholder={field.placeholder || ''}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
        );
      case 'radio':
        return (
          <div className="mb-4.5" key={field.name}>
            <label className="mb-2.5 block text-black dark:text-white">{field.label}</label>
            <div className="flex items-center space-x-4">
              {field.options?.map((option: string) => (
                <label key={option} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`${sectionId}-${field.name}`}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleInputChange(sectionId, field.name, e.target.value)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );
      default:
        return <p key={field.name}>Unsupported field type: {field.type}</p>;
    }
  };

  // --- ฟังก์ชันใหม่: สำหรับ Render ตาราง ---
  const renderTable = (section: Section) => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-2 dark:bg-meta-4">
            {section.columns?.map(col => (
              <th key={col.name} className="py-4 px-4 font-medium text-black dark:text-white">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formData[section.id]?.map((row: any, rowIndex: number) => (
            <tr key={rowIndex}>
              {section.columns?.map(col => (
                <td key={col.name} className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  {col.type === 'readonly' ? (
                    <p className="text-black dark:text-white">{row[col.name]}</p>
                  ) : (
                    <input
                      type={col.type}
                      value={row[col.name] || ''}
                      onChange={(e) => handleTableChange(section.id, rowIndex, col.name, e.target.value)}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <Breadcrumb pageName="Production Record" />

      {loading && <div className="text-center p-10">Loading Form...</div>}
      {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}

      {formStructure && formData && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">{formStructure.FormName}</h3>
          </div>

          <div className="p-6.5">
            {formStructure.StructureDefinition.sections.map((section: Section) => (
              <div key={section.id} className="mb-10">
                <h4 className="text-xl font-semibold text-black dark:text-white mb-6 border-b border-stroke pb-2">
                  {section.title}
                </h4>

                {section.type === 'table' && renderTable(section)}
                {section.fields && section.fields.map((field: Field) => renderField(section.id, field))}
              </div>
            ))}

            {/* ปุ่มสำหรับดูข้อมูลที่กรอก (เพื่อ Debug) */}
            <div className="mt-10">
              <h4 className="text-lg font-semibold mb-4">Debug: Form Data State</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-xs overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ProductionForm;