// src/components/formGen/pages/Master/EditItemModal.tsx

import React, { useState, useEffect } from 'react';
import { IMasterFormItem, IStep2ConfigJson, IConfigJson } from '../BZ_Form/types';

interface Props {
  isOpen: boolean;
  item: IMasterFormItem | null;
  onClose: () => void;
  onSave: (updatedItem: IMasterFormItem) => void;
}

// --- Component ย่อยสำหรับ Input Field ---
const FormInput = ({ label, value, onChange, type = 'text' }: { label: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
    <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-black dark:text-white">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={onChange}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        />
    </div>
);

// --- Component ย่อยสำหรับ Toggle Switch ---
const FormToggle = ({ label, enabled, onChange }: { label: string, enabled: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-black dark:text-white">{label}</label>
        <input 
            type="checkbox" 
            checked={enabled} 
            onChange={onChange}
            className="relative h-5 w-10 cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors checked:bg-primary focus:outline-none dark:bg-gray-600"
        />
    </div>
);

// --- Component ย่อยสำหรับ Dropdown Select ---
const FormSelect = ({ label, value, onChange, options }: { label: string, value: any, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: { value: string, label: string }[] }) => (
    <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-black dark:text-white">{label}</label>
        <select
            value={value || ''}
            onChange={onChange}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-4 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// --- Component ย่อยสำหรับส่วน Validation (เวอร์ชันเรียบง่าย) ---
const ValidationFields = ({ validation, path, onConfigChange }: { validation: any, path: string, onConfigChange: (path: string, value: any) => void }) => {
    if (!validation) return null; // ถ้าไม่มี validation ก็ไม่ต้องแสดงผล

    const validationTypes = [
        { value: 'RANGE_DIRECT', label: 'Direct Range (min-max)' },
        { value: 'RANGE_TOLERANCE', label: 'Tolerance Range (min-max)' },
        { value: 'MAX_VALUE', label: 'Maximum Value' },
    ];

    return (
        <div className="mt-4 rounded-md border border-stroke p-4 dark:border-strokedark">
            <h5 className="font-semibold text-black dark:text-white">Validation Rules</h5>
            <FormSelect
                label="Validation Type"
                value={validation.type}
                onChange={e => onConfigChange(`${path}.type`, e.target.value)}
                options={validationTypes}
            />
            <FormInput 
                label="Error Message" 
                value={validation.errorMessage} 
                onChange={e => onConfigChange(`${path}.errorMessage`, e.target.value)} 
            />
            <div className="grid grid-cols-2 gap-4">
                {(validation.type === 'RANGE_DIRECT' || validation.type === 'RANGE_TOLERANCE') && (
                    <FormInput 
                        label="Min Value" 
                        type="number" 
                        value={validation.min} 
                        onChange={e => onConfigChange(`${path}.min`, parseFloat(e.target.value) || null)} 
                    />
                )}
                {(validation.type === 'RANGE_DIRECT' || validation.type === 'RANGE_TOLERANCE' || validation.type === 'MAX_VALUE') && (
                    <FormInput 
                        label="Max Value" 
                        type="number" 
                        value={validation.max} 
                        onChange={e => onConfigChange(`${path}.max`, parseFloat(e.target.value) || null)} 
                    />
                )}
            </div>
        </div>
    );
};

const EditItemModal: React.FC<Props> = ({ isOpen, item, onClose, onSave }) => {
  const [editedItem, setEditedItem] = useState<IMasterFormItem | null>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (item) {
      const newItem = JSON.parse(JSON.stringify(item));
      setEditedItem(newItem);
      setConfig(newItem.config_json);
    }
  }, [item]);

  if (!isOpen || !editedItem || !config) {
    return null;
  }
  
  const handleConfigChange = (path: string, value: any) => {
    setConfig((prevConfig: any) => {
      const newConfig = JSON.parse(JSON.stringify(prevConfig));
      let current = newConfig;
      const keys = path.split('.');
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const handleSave = () => {
    const updatedItem = { ...editedItem, config_json: config };
    onSave(updatedItem);
  };

  const renderEditForm = () => {
    // --- Logic สำหรับ Step 2 ---
    if ('row_type' in config) {
      const step2Config = config as IStep2ConfigJson;
      return (
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
            <h4 className="mb-2 font-semibold">General Info</h4>
            <FormInput label="Label" value={step2Config.label} onChange={e => handleConfigChange('label', e.target.value)} />
            <FormInput label="Standard Value (STD)" value={step2Config.std_value} onChange={e => handleConfigChange('std_value', e.target.value)} />
            <FormInput label="Unit" value={step2Config.unit} onChange={e => handleConfigChange('unit', e.target.value)} />
          </div>

          <ValidationFields validation={step2Config.validation} path="validation" onConfigChange={handleConfigChange} />

          {step2Config.inputs?.map((input, index) => (
            <div key={index} className="rounded-md border border-stroke p-4 dark:border-strokedark">
                <p className="font-medium">Input #{index + 1}: ({input.field_name})</p>
                <ValidationFields validation={input.validation} path={`inputs.${index}.validation`} onConfigChange={handleConfigChange} />
            </div>
          ))}
        </div>
      );
    }

    // --- Logic สำหรับ Step 3 ---
    if ('columns' in config) {
      const step3Config = config as IConfigJson;
      return (
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
            <h4 className="mb-4 font-semibold">Row Time Settings</h4>
            <div className="flex gap-8">
              <FormToggle 
                label="Enable Start Time"
                enabled={step3Config.inputs?.startTime?.enabled ?? false}
                onChange={e => handleConfigChange('inputs.startTime.enabled', e.target.checked)}
              />
              <FormToggle 
                label="Enable Finish Time"
                enabled={step3Config.inputs?.finishTime?.enabled ?? false}
                onChange={e => handleConfigChange('inputs.finishTime.enabled', e.target.checked)}
              />
            </div>
          </div>

          {step3Config.columns.map((column, index) => (
            <div key={index} className="rounded-md border border-stroke p-4 dark:border-strokedark">
              <h4 className="mb-2 font-semibold">Column #{index + 1} (Type: {column.type})</h4>
              {column.type === 'DESCRIPTION' && (
                <FormInput label="Display Text" value={column.value} onChange={e => handleConfigChange(`columns.${index}.value`, e.target.value)} />
              )}
              {column.type === 'SINGLE_INPUT_GROUP' && column.input && (
                <>
                  <FormInput label="Label" value={column.input.label} onChange={e => handleConfigChange(`columns.${index}.input.label`, e.target.value)} />
                  <FormInput label="Unit" value={column.input.unit} onChange={e => handleConfigChange(`columns.${index}.input.unit`, e.target.value)} />
                  <ValidationFields validation={column.input.validation} path={`columns.${index}.input.validation`} onConfigChange={handleConfigChange} />
                </>
              )}
              {column.type === 'MULTI_INPUT_GROUP' && (
                <>
                  <FormInput label="Row Description" value={column.description} onChange={e => handleConfigChange(`columns.${index}.description`, e.target.value)} />
                  <ValidationFields validation={column.validation} path={`columns.${index}.validation`} onConfigChange={handleConfigChange} />
                  {column.inputs?.map((input, inputIdx) => (
                    <div key={inputIdx} className="mt-2 rounded-md border border-dashed p-3 dark:border-strokedark">
                      <p className="font-medium">Sub-Input #{inputIdx + 1}</p>
                      <FormInput label="Label" value={input.label} onChange={e => handleConfigChange(`columns.${index}.inputs.${inputIdx}.label`, e.target.value)} />
                      <FormInput label="Unit" value={input.unit} onChange={e => handleConfigChange(`columns.${index}.inputs.${inputIdx}.unit`, e.target.value)} />
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <p>This item type is not editable yet.</p>;
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-default dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Edit Item (ID: {editedItem.item_id})
          </h3>
        </div>
        <div className="p-6.5 max-h-[70vh] overflow-y-auto">
          {renderEditForm()}
        </div>
        <div className="flex justify-end gap-4 border-t border-stroke py-4 px-6.5 dark:border-strokedark">
          <button onClick={onClose} className="rounded-md border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white">
            Cancel
          </button>
          <button onClick={handleSave} className="rounded-md bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;