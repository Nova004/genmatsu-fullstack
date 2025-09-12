// src/components/formGen/pages/Master/AddItemModal.tsx

import React, { useState } from 'react';
import { IMasterFormItem, IStep2ConfigJson, IConfigJson } from '../BZ_Form/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: Partial<IMasterFormItem>) => void;
  templateType: 'BZ_Step2_RawMaterials' | 'BZ_Step3_Operations' | string;
}

// --- โครงสร้างตั้งต้นสำหรับแต่ละ row_type ของ Step 2 ---
const step2RowTypeTemplates: { [key: string]: IStep2ConfigJson } = {
  SINGLE_INPUT: {
    row_type: 'SINGLE_INPUT', label: 'New Single Input', std_value: 'N/A', unit: 'Unit',
    inputs: [{ type: 'text', field_name: 'new.field.name' }],
    validation: { type: 'RANGE_DIRECT', min: 0, max: 100, errorMessage: 'Value out of range' },
  },
  DUAL_INPUT: {
    row_type: 'DUAL_INPUT', label: 'New Dual Input', std_value: 'N/A', unit: 'Unit',
    inputs: [
      { type: 'text', field_name: 'new.field.lot' },
      { type: 'number', field_name: 'new.field.actual', validation: { type: 'MAX_VALUE', max: 100, errorMessage: 'Value too high' } }
    ],
  },
  SUB_ROW: {
    row_type: 'SUB_ROW', label: 'New Sub Row Text', std_value: 'N/A', unit: 'Unit', inputs: [],
  }
};

// --- โครงสร้างตั้งต้นสำหรับแต่ละ column_type ของ Step 3 ---
const step3ColumnTypeTemplates: { [key: string]: Partial<IConfigJson> } = {
    DESCRIPTION: {
        columns: [{ type: 'DESCRIPTION', value: 'New Description Text', span: 2 }],
        inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
    },
    SINGLE_INPUT_GROUP: {
        columns: [
            { type: 'DESCRIPTION', value: 'New Action Description', span: 1 },
            {
                type: 'SINGLE_INPUT_GROUP', span: 1,
                input: {
                    label: 'New Value', unit: '%', type: 'number', step: '0.1',
                    field_name: 'operationResults.{index}.newValue',
                    validation: { type: 'RANGE_DIRECT', min: 0, max: 100, errorMessage: 'Value out of range' }
                }
            }
        ],
        inputs: { startTime: { enabled: true }, finishTime: { enabled: true } },
    },
};


const AddItemModal: React.FC<Props> = ({ isOpen, onClose, onSave, templateType }) => {
  const [selectedType, setSelectedType] = useState<string>('');

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (!selectedType) {
      alert('Please select a type to add.');
      return;
    }
    
    let newItemConfig;
    if (templateType === 'BZ_Step2_RawMaterials') {
        newItemConfig = step2RowTypeTemplates[selectedType];
    } else if (templateType === 'BZ_Step3_Operations') {
        newItemConfig = step3ColumnTypeTemplates[selectedType];
    } else {
        alert('This template type is not supported for adding new items.');
        return;
    }

    const newItem: Partial<IMasterFormItem> = {
      display_order: 0,
      config_json: newItemConfig,
      is_active: true,
    };
    onSave(newItem);
    setSelectedType(''); // Reset ค่า
  };

  const getTemplateOptions = () => {
      if (templateType === 'BZ_Step2_RawMaterials') {
          return Object.keys(step2RowTypeTemplates);
      }
      if (templateType === 'BZ_Step3_Operations') {
          return Object.keys(step3ColumnTypeTemplates);
      }
      return [];
  };

  const options = getTemplateOptions();

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-default dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">Add New Item to {templateType}</h3>
        </div>
        <div className="p-6.5 max-h-[70vh] overflow-y-auto">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Select Type to Add
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">-- Choose a type --</option>
              {options.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-stroke py-4 px-6.5 dark:border-strokedark">
          <button onClick={() => { onClose(); setSelectedType(''); }} className="rounded-md border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!selectedType} className="rounded-md bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50">
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;