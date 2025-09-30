// src/components/formGen/pages/Master/FormMasterEditor.tsx

import React, { useState, useEffect } from 'react';
import Breadcrumb from '../../../Breadcrumbs/Breadcrumb';
import { IMasterFormItem } from '../BZ_Form/types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import EditItemModal from './EditItemModal';
import axios from 'axios';
import { fireToast } from '../../../../hooks/fireToast';

interface TemplateInfo {
  template_id: number;
  template_name: string;
  description: string;
}

type GroupedTemplates = {
  [category: string]: TemplateInfo[];
};

const FormMasterEditor: React.FC = () => {
  const [groupedTemplates, setGroupedTemplates] = useState<GroupedTemplates>({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateItems, setTemplateItems] = useState<IMasterFormItem[]>([]);
  const [isItemsLoading, setIsItemsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [initialItemsOrder, setInitialItemsOrder] = useState<IMasterFormItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<IMasterFormItem | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        // 1. ใช้ axios.get และ URL ที่สั้นลง
        const response = await axios.get('/api/master/templates');
        // 2. ข้อมูล templates จะอยู่ใน response.data โดยตรง
        setGroupedTemplates(response.data);
      } catch (error) {
        // 3. catch จะทำงานทันทีถ้า API มีปัญหา
        console.error("Failed to fetch templates", error);
        setGroupedTemplates({}); // กำหนดค่าว่างให้ State เพื่อป้องกัน Error
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const category = event.target.value;
    setSelectedCategory(category);
    setSelectedTemplate('');
    setTemplateItems([]);
    setInitialItemsOrder([]);
  };

  const handleTemplateChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = event.target.value;
    setSelectedTemplate(templateName);

    if (!templateName) {
      setTemplateItems([]);
      setInitialItemsOrder([]);
      return;
    }

    setIsItemsLoading(true);
    try {
      // 1. ใช้ axios.get และ URL ที่สั้นลง
      const response = await axios.get(`/api/master/template/${templateName}/latest`);

      // 2. ข้อมูล items จะอยู่ใน response.data.items โดยตรง
      const items = response.data?.items || [];

      setTemplateItems(items);
      // 3. ทำ Deep copy จากข้อมูลที่ได้มาใหม่ เพื่อเก็บไว้เปรียบเทียบ
      setInitialItemsOrder(JSON.parse(JSON.stringify(items)));

    } catch (error) {
      // 4. catch จะทำงานทันทีถ้า API มีปัญหา
      console.error(`Failed to fetch items for template ${templateName}`, error);
      setTemplateItems([]);
      setInitialItemsOrder([]);
    } finally {
      setIsItemsLoading(false);
    }
  };

  const handleEditClick = (itemToEdit: IMasterFormItem) => {
    setEditingItem(itemToEdit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // ======================================================
  // === 1. แก้ไขฟังก์ชันนี้ให้ทำการอัปเดต State จริงๆ ===
  // ======================================================
  const handleUpdateItem = (updatedItem: IMasterFormItem) => {
    setTemplateItems(prevItems =>
      prevItems.map(item =>
        // ถ้า item_id ตรงกัน ให้แทนที่ด้วยข้อมูลใหม่,  item เดิม
        item.item_id === updatedItem.item_id ? updatedItem : item
      )
    );
    handleCloseModal();
  };

  const handleSaveChanges = async () => {
    if (!selectedTemplate || templateItems.length === 0) {
      // ใช้ fireToast แทน alert
      fireToast('warning', 'No template selected or no items to save.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. ใช้ axios.post และส่งข้อมูลเข้าไปได้เลย
      await axios.post('/api/master/template/update', {
        templateName: selectedTemplate,
        items: templateItems,
      });handleSaveChanges

      // 2. ถ้าสำเร็จ ให้แจ้งเตือนสวยๆ
      fireToast('success', 'A new version of the template has been created.');

      // 3. โหลดข้อมูล template เดิมซ้ำเพื่อรีเฟรชหน้า
      handleTemplateChange({ target: { value: selectedTemplate } } as any);

    } catch (error: any) {
      // 4. catch จะทำงานทันทีถ้า API ตอบกลับมาเป็น Error
      console.error("Error saving template:", error);
      const errorMessage = error.response?.data?.message || 'Failed to save changes.';
      fireToast('error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayValue = (item: IMasterFormItem): string => {
    try {
      const config = item.config_json as any;
      if (config.columns && config.columns[0]) {
        const firstColumn = config.columns[0];
        return firstColumn.description || firstColumn.value || `(Complex Row)`;
      }
      if (config.label) {
        return config.label;
      }
      return `Item ID: ${item.item_id}`;
    } catch {
      return `Invalid Config for Item ID: ${item.item_id}`;
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    const items = Array.from(templateItems);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    setTemplateItems(items);
  };

  // ======================================================
  // === 2. อัปเกรดฟังก์ชันนี้ให้ตรวจจับการเปลี่ยนแปลงทั้งหมด ===
  // ======================================================
  const hasUnsavedChanges = () => {
    if (templateItems.length !== initialItemsOrder.length) return true;

    // เปรียบเทียบข้อมูลทั้งหมดโดยแปลงเป็น String
    const currentItemsString = JSON.stringify(templateItems);
    const initialItemsString = JSON.stringify(initialItemsOrder);

    return currentItemsString !== initialItemsString;
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">1. Select Category</label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  disabled={isLoadingTemplates}
                  className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                >
                  <option value="">-- Select a Category --</option>
                  {Object.keys(groupedTemplates).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">{/* SVG Icon */}</span>
              </div>
            </div>
            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">2. Select Template to Edit</label>
              <div className="relative z-20 bg-transparent dark:bg-form-input">
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  disabled={!selectedCategory}
                  className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                >
                  <option value="">-- Select a Template --</option>
                  {selectedCategory && groupedTemplates[selectedCategory]?.map(template => (
                    <option key={template.template_id} value={template.template_name}>
                      {template.description}
                    </option>
                  ))}
                </select>
                <span className="absolute top-1/2 right-4 z-30 -translate-y-1/2">{/* SVG Icon */}</span>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-black dark:text-white">
                Template Items
              </h4>
              {/* 3. เปลี่ยนเงื่อนไขมาใช้ฟังก์ชันใหม่ */}
              {selectedTemplate && hasUnsavedChanges() && (
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="rounded-md bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
            <div className="mt-4 p-4 border border-stroke rounded-md">
              {isItemsLoading ? (
                <p className="text-center">Loading Items...</p>
              ) : selectedTemplate && templateItems.length > 0 ? (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="template-items">
                    {(provided) => (
                      <ul
                        className="flex flex-col gap-3"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {templateItems.map((item, index) => (
                          <Draggable key={item.item_id} draggableId={String(item.item_id)} index={index}>
                            {(provided, snapshot) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-4 rounded-md p-3 transition-colors ${snapshot.isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-meta-4'}`}
                              >
                                <div className="font-bold text-gray-500 dark:text-gray-400">{index + 1}.</div>
                                <div className="flex-1 text-black dark:text-white">
                                  {getDisplayValue(item)}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="text-primary hover:underline"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <p className="text-center text-gray-500">
                  {isLoadingTemplates ? 'Loading Templates...' : 'Select a template to view and edit its items.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <EditItemModal
        isOpen={isModalOpen}
        item={editingItem}
        onClose={handleCloseModal}
        onSave={handleUpdateItem}
      />
    </>
  );
};

export default FormMasterEditor;