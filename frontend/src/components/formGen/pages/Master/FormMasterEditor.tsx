// src/components/formGen/pages/Master/FormMasterEditor.tsx

import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb';
// Import Type จาก BZ_Form มาใช้ร่วมกัน
import { IMasterFormItem } from '../BZ_Form/types';

interface TemplateInfo {
  template_id: number;
  template_name: string;
  description: string;
}

const FormMasterEditor: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // --- State ที่เพิ่มเข้ามาใหม่ ---
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateItems, setTemplateItems] = useState<IMasterFormItem[]>([]);
  const [isItemsLoading, setIsItemsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await fetch('http://localhost:4000/api/master/templates');
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // --- ฟังก์ชันใหม่สำหรับจัดการเมื่อ User เลือก Template ---
  const handleTemplateChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = event.target.value;
    setSelectedTemplate(templateName);

    if (!templateName) {
      setTemplateItems([]); // ถ้าไม่ได้เลือกอะไร ให้เคลียร์รายการ
      return;
    }

    setIsItemsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/master/template/${templateName}/latest`);
      const data = await response.json();
      setTemplateItems(data.items); // เก็บเฉพาะ array 'items'
    } catch (error) {
      console.error(`Failed to fetch items for template ${templateName}`, error);
      setTemplateItems([]);
    } finally {
      setIsItemsLoading(false);
    }
  };
  
  // --- ฟังก์ชันเล็กๆ ช่วยดึงข้อความหลักของแต่ละแถวมาแสดง ---
  const getDisplayValue = (item: IMasterFormItem): string => {
    try {
      const config = item.config_json as any;
      // สำหรับ Step 3
      if (config.columns && config.columns[0]) {
        const firstColumn = config.columns[0];
        return firstColumn.description || firstColumn.value || `(Complex Row)`;
      }
      // สำหรับ Step 2
      if (config.label) {
        return config.label;
      }
      return `Item ID: ${item.item_id}`;
    } catch {
      return `Invalid Config for Item ID: ${item.item_id}`;
    }
  };

  return (
    <>
      <Breadcrumb pageName="Form Master Editor" />

      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Master Template Editor
          </h3>
        </div>
        
        <div className="p-6.5">
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Select Template to Edit
            </label>
            <div className="relative z-20 bg-transparent dark:bg-form-input">
              <select 
                value={selectedTemplate}
                onChange={handleTemplateChange}
                disabled={isLoadingTemplates} // ปิดการใช้งานตอนกำลังโหลด
                className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                <option value="">-- Select a Template --</option>
                {templates.map(template => (
                  <option key={template.template_id} value={template.template_name}>
                    {template.description} ({template.template_name})
                  </option>
                ))}
              </select>
              <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
                {/* SVG Icon */}
              </span>
            </div>
          </div>

          <div className="mt-10">
             <h4 className="font-medium text-black dark:text-white">
                Template Items
             </h4>
             <div className="mt-4 p-4 border border-stroke rounded-md">
                {isItemsLoading ? (
                  <p className="text-center">Loading Items...</p>
                ) : selectedTemplate && templateItems.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {templateItems.map((item, index) => (
                      <li key={item.item_id} className="flex items-center gap-4 rounded-md bg-gray-100 p-3 dark:bg-meta-4">
                        <div className="font-bold text-gray-500 dark:text-gray-400">#{index + 1}</div>
                        <div className="flex-1 text-black dark:text-white">
                          {getDisplayValue(item)}
                        </div>
                        <div className="flex gap-2">
                           <button className="text-primary hover:underline">Edit</button>
                           <button className="text-danger hover:underline">Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500">
                      {isLoadingTemplates ? 'Loading Templates...' : 'Select a template to view and edit its items.'}
                  </p>
                )}
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FormMasterEditor;