// path: frontend/src/components/formGen/components/forms/SharedFormStep3.tsx

import React, { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors, Control, Controller, UseFormGetValues, UseFormTrigger } from 'react-hook-form';
import { getLatestTemplateByName } from '../../../../services/formService';
import { IManufacturingReportForm, IConfigJson } from '../../pages/types';
import InputMask from 'react-input-mask';


interface SharedFormStep3Props {
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
  control: Control<IManufacturingReportForm>;
  getValues: UseFormGetValues<IManufacturingReportForm>;
  trigger: UseFormTrigger<IManufacturingReportForm>;
  onTemplateLoaded: (templateInfo: any) => void;
  isReadOnly?: boolean;
  staticBlueprint?: any;
  templateName: 'BS3_Step3_Operations' | 'BZ3_Step3_Operations' | 'BZ_Step3_Operations' | 'BZ5-C_Step3_Operations' | string;
}

const SharedFormStep3: React.FC<SharedFormStep3Props> = ({
  register,
  errors,
  control,
  getValues,
  trigger,
  onTemplateLoaded,
  isReadOnly = false,
  staticBlueprint,
  templateName
}) => {

  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processBlueprint = (data: any) => {
      if (data && data.items) {
        setFields(data.items);
        if (onTemplateLoaded) {
          onTemplateLoaded(data.template);
        }
      } else {
        setError('โครงสร้าง Master ของ Step 3 ไม่ถูกต้อง');
      }
      setIsLoading(false);
    };

    const fetchLatestBlueprint = async () => {
      try {
        const data = await getLatestTemplateByName(templateName);
        processBlueprint(data);
      } catch (err) {
        setError(`ไม่สามารถโหลดข้อมูล Master (${templateName}) ของ Step 3 ได้`);
        setIsLoading(false);
      }
    };

    if (staticBlueprint) {
      processBlueprint(staticBlueprint);
    } else {
      fetchLatestBlueprint();
    }
  }, [onTemplateLoaded, staticBlueprint, templateName]);

  if (isLoading) return <div className="p-4">Loading Form Step 3...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = "w-full cursor-default rounded-lg border-[1.5px] border-stroke bg-gray-2 px-3 py-2 text-black outline-none dark:border-form-strokedark dark:bg-meta-4 dark:text-white";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-top pt-4`;
  const tdLeftClass = `${tdClass} align-top pt-4`;

  // ✨ 1. เพิ่มค่าคงที่ และฟังก์ชัน parseTime
  const MAX_SHIFT_DURATION_MINUTES = 12 * 60; // 12 ชั่วโมง

  const parseTime = (timeStr: string): number | null => {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  };

  // ==================================================================
  // ✨ 2. HELPER FUNCTION ค้นหาเวลาย้อนกลับ (Single Chain) ✨
  // ==================================================================
  const findPreviousEnabledTime = (currentIndex: number, currentSubIndex: number): { timeNum: number, timeStr: string } | null => {
    let searchIndex = currentIndex;
    let searchSubIndex = currentSubIndex;

    // 1. ถ้าเป็น Sub-Item (e.g., 1.2), ค้นหา 1.1 -> 1.0
    if (searchSubIndex > 0) {
      for (let i = searchSubIndex - 1; i >= 0; i--) {
        const subItem = fields[searchIndex]?.config_json?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems?.[i];
        if (subItem) {
          if (subItem.inputs?.finishTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.finishTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
          if (subItem.inputs?.startTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.startTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
        }
      }
    }

    // 2. ถ้าเป็น Sub-Item 1.0 (subIndex=0), ค้นหา Main Item 1
    if (searchSubIndex === 0) {
      const mainConfig = fields[searchIndex]?.config_json;
      if (mainConfig?.inputs?.finishTime?.enabled) {
        const timeStr = getValues(`operationResults.${searchIndex}.finishTime`);
        const timeNum = parseTime(timeStr);
        if (timeNum !== null) return { timeNum, timeStr };
      }
      if (mainConfig?.inputs?.startTime?.enabled) {
        const timeStr = getValues(`operationResults.${searchIndex}.startTime`);
        const timeNum = parseTime(timeStr);
        if (timeNum !== null) return { timeNum, timeStr };
      }
    }

    // 3. ถ้าเป็น Main Item (subIndex=-1) หรือ Sub-Item 1.0 (ที่หา 1 ไม่เจอ)
    // ให้เริ่มค้นหาจาก Main Item ก่อนหน้า (e.g., 0)
    searchIndex--;
    while (searchIndex >= 0) {
      const config = fields[searchIndex]?.config_json;
      const subItems = config?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems;

      // 3.1 ค้นหาจาก Sub-Items (จากล่างขึ้นบน 0.2 -> 0.1)
      if (subItems && subItems.length > 0) {
        for (let i = subItems.length - 1; i >= 0; i--) {
          const subItem = subItems[i];
          if (subItem.inputs?.finishTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.finishTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
          if (subItem.inputs?.startTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.startTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
        }
      }

      // 3.2 ค้นหาจาก Main Item (0)
      if (config?.inputs?.finishTime?.enabled) {
        const timeStr = getValues(`operationResults.${searchIndex}.finishTime`);
        const timeNum = parseTime(timeStr);
        if (timeNum !== null) return { timeNum, timeStr };
      }
      if (config?.inputs?.startTime?.enabled) {
        const timeStr = getValues(`operationResults.${searchIndex}.startTime`);
        const timeNum = parseTime(timeStr);
        if (timeNum !== null) return { timeNum, timeStr };
      }
      searchIndex--;
    }

    return null; // ไม่เจออะไรเลย
  };

  // ==================================================================
  // ✨ 3. HELPER FUNCTION ค้นหาเวลาถัดไป (Single Chain) ✨
  // ==================================================================
  const findNextEnabledTime = (currentIndex: number, currentSubIndex: number): { timeNum: number, timeStr: string } | null => {
    let searchIndex = currentIndex;
    let searchSubIndex = currentSubIndex;

    // 1. ถ้าเราเป็น Main Item (subIndex=-1), ให้ค้นหา Sub-Item ของตัวเองก่อน (1.1 -> 1.2)
    if (searchSubIndex === -1) {
      const config = fields[searchIndex]?.config_json;
      const subItems = config?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems;

      if (subItems && subItems.length > 0) {
        for (let i = 0; i < subItems.length; i++) {
          const subItem = subItems[i];
          if (subItem.inputs?.startTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.startTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
          if (subItem.inputs?.finishTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.finishTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
        }
      }
    }
    // 2. ถ้าเราเป็น Sub-Item (e.g. 1.1), ให้ค้นหา Sub-Item ถัดไป (1.2)
    else {
      // ✅ [FIX ts(7006)] แก้ไขบั๊ก TypeScript ที่จุดนี้
      const subItems = fields[searchIndex]?.config_json?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems;
      if (subItems) {
        for (let i = searchSubIndex + 1; i < subItems.length; i++) {
          const subItem = subItems[i];
          if (subItem.inputs?.startTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.startTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
          if (subItem.inputs?.finishTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.finishTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
        }
      }
    }

    // 3. ถ้ายังไม่เจอ (เราเป็น 1.2 หรือ 1 ที่ไม่มี subItem), ให้เริ่มค้นหาจาก Main Item ถัดไป (e.g., 2)
    searchIndex++;
    while (searchIndex < fields.length) {
      const config = fields[searchIndex]?.config_json;

      // 3.1 ค้นหาจาก Main Item (2)
      if (config?.inputs?.startTime?.enabled) {
        const timeStr = getValues(`operationResults.${searchIndex}.startTime`);
        const timeNum = parseTime(timeStr);
        if (timeNum !== null) return { timeNum, timeStr };
      }
      if (config?.inputs?.finishTime?.enabled) {
        const timeStr = getValues(`operationResults.${searchIndex}.finishTime`);
        const timeNum = parseTime(timeStr);
        if (timeNum !== null) return { timeNum, timeStr };
      }

      // 3.2 ค้นหาจาก Sub-Items (2.1 -> 2.2)
      const subItems = config?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems;
      if (subItems && subItems.length > 0) {
        for (let i = 0; i < subItems.length; i++) {
          const subItem = subItems[i];
          if (subItem.inputs?.startTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.startTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
          if (subItem.inputs?.finishTime?.enabled) {
            const timeStr = getValues(`operationResults.${searchIndex}.subItems.${i}.finishTime` as any);
            const timeNum = parseTime(timeStr);
            if (timeNum !== null) return { timeNum, timeStr };
          }
        }
      }
      searchIndex++;
    }

    return null; // ไม่เจออะไรเลย
  };


  const createValidator = (rules: any) => (value: any) => {
    // ... (โค้ด createValidator เหมือนเดิม) ...
    if (!rules) return true;
    if (value === 0 || value === '0' || value === '-') return true;
    if (value === null || value === '' || value === undefined) return true;
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return rules.errorMessage || 'กรุณากรอกเป็นตัวเลข';
    }
    switch (rules.type) {
      case 'RANGE_DIRECT':
        if (rules.min !== undefined && rules.max !== undefined) {
          return (numericValue >= rules.min && numericValue <= rules.max) || rules.errorMessage;
        }
        return true;
      case 'MAX_VALUE':
        if (rules.max !== undefined) {
          return (numericValue <= rules.max) || rules.errorMessage;
        }
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* ... (โค้ดส่วน Header และ Table Head เหมือนเดิม) ... */}
      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark">
        <h5 className="font-medium text-white text-lg">Operation result (รายละเอียดผลการผลิต)</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className={thClass}>No.</th>
                <th className={thClass} colSpan={2}>Details</th>
                <th className={thClass}>Start time</th>
                <th className={thClass}>Finish time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="text-center p-4">Loading Master Form...</td></tr>
              )}

              {fields.map((item, index) => {
                // ... (โค้ด config, isStartTimeDisabled, ฯลฯ เหมือนเดิม) ...
                const config = item.config_json as IConfigJson;
                if (!config || typeof config !== 'object' || !('columns' in config)) {
                  return <tr key={item.item_id}><td colSpan={5}>Invalid configuration for item</td></tr>;
                }
                const isStartTimeDisabled = !config.inputs.startTime?.enabled;
                const isFinishTimeDisabled = !config.inputs.finishTime?.enabled;

                return (
                  <tr key={item.item_id}>
                    <td className={tdCenterClass}>{index + 1}</td>

                    {config.columns.map((col, colIndex) => {
                      switch (col.type) {
                        case 'DESCRIPTION':
                          // ... (โค้ด render description.main และ map subItems เหมือนเดิม) ...
                          if (col.description && typeof col.description === 'object') {
                            return (
                              <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                                {col.description.main && <p className="mb-1">{col.description.main}</p>}
                                {Array.isArray(col.description.subItems) && col.description.subItems.length > 0 && (
                                  <ul className="flex flex-col gap-4 pl-4">
                                    {col.description.subItems.map((subItem: any, subIndex: number) => {
                                      const subItemStartTimeField = `operationResults.${index}.subItems.${subIndex}.startTime`;
                                      const subItemFinishTimeField = `operationResults.${index}.subItems.${subIndex}.finishTime`;

                                      const isSubStartTimeEnabled = subItem.inputs?.startTime?.enabled ?? false;
                                      const isSubFinishTimeEnabled = subItem.inputs?.finishTime?.enabled ?? false;
                                      const subItemsArray = col.description?.subItems || [];

                                      const timeInputClass = "w-full rounded-r-lg border-[1.5px] border-l-0 border-stroke bg-transparent px-3 py-1 text-sm text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
                                      const disabledTimeInputClass = "w-full cursor-default rounded-r-lg border-[1.5px] border-l-0 border-stroke bg-gray-2 px-3 py-1 text-sm text-black outline-none dark:border-form-strokedark dark:bg-meta-4 dark:text-white";
                                      const labelClass = "inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white";

                                      return (
                                        <li key={subIndex} className="flex flex-col gap-2 border-t border-stroke pt-3 dark:border-strokedark">
                                          <div>
                                            <span className="font-semibold">{subItem.id}</span>. {subItem.text}
                                          </div>

                                          {(isSubStartTimeEnabled || isSubFinishTimeEnabled) && (
                                            <div className="flex items-center justify-start gap-4">

                                              {/* ==================================================================
                                                ✨ 4. SUB ITEM - START TIME CONTROLLER (Logic ที่ถูกต้อง) ✨
                                                ==================================================================
                                              */}
                                              <div className="flex w-40">
                                                <span className={labelClass}>Start</span>
                                                <Controller
                                                  name={subItemStartTimeField as any}
                                                  control={control}
                                                  rules={{
                                                    validate: {
                                                      // 1. แนวตั้ง (Duration)
                                                      lessThanFinish: (value) => {
                                                        if (!isSubFinishTimeEnabled) return true;
                                                        const finishTime = getValues(subItemFinishTimeField as any);
                                                        const startTimeNum = parseTime(value);
                                                        const finishTimeNum = parseTime(finishTime);
                                                        if (startTimeNum === null || finishTimeNum === null) return true;

                                                        let duration: number;
                                                        if (startTimeNum <= finishTimeNum) {
                                                          duration = finishTimeNum - startTimeNum;
                                                        } else {
                                                          duration = (finishTimeNum + 1440) - startTimeNum;
                                                        }

                                                        if (duration === 0) return 'Start < Finish';
                                                        return duration <= MAX_SHIFT_DURATION_MINUTES || 'Start < Finish';
                                                      },
                                                      // 2. แนวนอน (ย้อนกลับ - ✨ อัปเดตเช็ค Duration)
                                                      afterPreviousTime: (value) => {
                                                        const currentTimeNum = parseTime(value);
                                                        if (currentTimeNum === null) return true;
                                                        const prevTime = findPreviousEnabledTime(index, subIndex);
                                                        if (!prevTime) return true;
                                                        const { timeNum: prevTimeNum, timeStr: prevTimeStr } = prevTime;

                                                        let duration: number;
                                                        if (currentTimeNum >= prevTimeNum) {
                                                          duration = currentTimeNum - prevTimeNum; // Same day
                                                        } else {
                                                          duration = (currentTimeNum + 1440) - prevTimeNum; // Overnight
                                                        }

                                                        return duration <= MAX_SHIFT_DURATION_MINUTES || `ต้องมากกว่า ${prevTimeStr}`;
                                                      },
                                                      // 3. แนวนอน (ไปข้างหน้า - ✨ อัปเดตเช็ค Duration)
                                                      beforeNextTime: (value) => {
                                                        const currentTimeNum = parseTime(value);
                                                        if (currentTimeNum === null) return true;
                                                        const nextTime = findNextEnabledTime(index, subIndex);
                                                        if (!nextTime) return true;
                                                        const { timeNum: nextTimeNum, timeStr: nextTimeStr } = nextTime;

                                                        let duration: number;
                                                        if (nextTimeNum >= currentTimeNum) {
                                                          duration = nextTimeNum - currentTimeNum; // Same day
                                                        } else {
                                                          duration = (nextTimeNum + 1440) - currentTimeNum; // Overnight
                                                        }

                                                        return duration <= MAX_SHIFT_DURATION_MINUTES || `Gap to ${nextTimeStr} > 12h`;
                                                      }
                                                    }
                                                  }}
                                                  render={({ field, fieldState: { error } }) => (
                                                    <div className="relative w-full">
                                                      <InputMask
                                                        {...field}
                                                        // (onChange Trigger - ถูกต้องแล้ว)
                                                        onChange={(e) => {
                                                          field.onChange(e);
                                                          trigger(`operationResults.${index}.startTime`);
                                                          trigger(`operationResults.${index}.finishTime`);
                                                          if (subIndex > 0) {
                                                            trigger(`operationResults.${index}.subItems.${subIndex - 1}.startTime` as any);
                                                            trigger(`operationResults.${index}.subItems.${subIndex - 1}.finishTime` as any);
                                                          }
                                                          if (subIndex < subItemsArray.length - 1) {
                                                            trigger(`operationResults.${index}.subItems.${subIndex + 1}.startTime` as any);
                                                            trigger(`operationResults.${index}.subItems.${subIndex + 1}.finishTime` as any);
                                                          }
                                                        }}
                                                        mask="99:99"
                                                        className={(!isSubStartTimeEnabled || isReadOnly) ? disabledTimeInputClass : timeInputClass}
                                                        disabled={!isSubStartTimeEnabled || isReadOnly}
                                                      />
                                                      {error && <span className="absolute left-1 -bottom-5 text-xs text-meta-1">{error.message}</span>}
                                                    </div>
                                                  )}
                                                />
                                              </div>

                                              {/* ==================================================================
                                                ✨ 5. SUB ITEM - FINISH TIME CONTROLLER (Logic ที่ถูกต้อง) ✨
                                                ==================================================================
                                              */}
                                              <div className="flex w-40">
                                                <span className={labelClass}>Finish</span>
                                                <Controller
                                                  name={subItemFinishTimeField as any}
                                                  control={control}
                                                  rules={{
                                                    validate: {
                                                      // 1. แนวตั้ง (Duration)
                                                      greaterThanStart: (value) => {
                                                        if (!isSubStartTimeEnabled) return true;
                                                        const startTime = getValues(subItemStartTimeField as any);
                                                        const startTimeNum = parseTime(startTime);
                                                        const finishTimeNum = parseTime(value);
                                                        if (startTimeNum === null || finishTimeNum === null) return true;

                                                        let duration: number;
                                                        if (startTimeNum <= finishTimeNum) {
                                                          duration = finishTimeNum - startTimeNum;
                                                        } else {
                                                          duration = (finishTimeNum + 1440) - startTimeNum;
                                                        }

                                                        if (duration === 0) return 'Finish > Start';
                                                        return duration <= MAX_SHIFT_DURATION_MINUTES || 'Start < Finish';
                                                      },
                                                      // 2. แนวนอน (ย้อนกลับ - ✨ อัปเดตเช็ค Duration)
                                                      afterPreviousTime: (value) => {
                                                        const currentTimeNum = parseTime(value);
                                                        if (currentTimeNum === null) return true;
                                                        const prevTime = findPreviousEnabledTime(index, subIndex);
                                                        if (!prevTime) return true;
                                                        const { timeNum: prevTimeNum, timeStr: prevTimeStr } = prevTime;

                                                        let duration: number;
                                                        if (currentTimeNum >= prevTimeNum) {
                                                          duration = currentTimeNum - prevTimeNum; // Same day
                                                        } else {
                                                          duration = (currentTimeNum + 1440) - prevTimeNum; // Overnight
                                                        }

                                                        return duration <= MAX_SHIFT_DURATION_MINUTES || `ต้องมากกว่า ${prevTimeStr}`;
                                                      },
                                                      // 3. แนวนอน (ไปข้างหน้า - ✨ อัปเดตเช็ค Duration)
                                                      beforeNextTime: (value) => {
                                                        const currentTimeNum = parseTime(value);
                                                        if (currentTimeNum === null) return true;
                                                        const nextTime = findNextEnabledTime(index, subIndex);
                                                        if (!nextTime) return true;
                                                        const { timeNum: nextTimeNum, timeStr: nextTimeStr } = nextTime;

                                                        let duration: number;
                                                        if (nextTimeNum >= currentTimeNum) {
                                                          duration = nextTimeNum - currentTimeNum; // Same day
                                                        } else {
                                                          duration = (nextTimeNum + 1440) - currentTimeNum; // Overnight
                                                        }

                                                        return duration <= MAX_SHIFT_DURATION_MINUTES || `Gap to ${nextTimeStr} > 12h`;
                                                      }
                                                    }
                                                  }}
                                                  render={({ field, fieldState: { error } }) => (
                                                    <div className="relative w-full">
                                                      <InputMask
                                                        {...field}
                                                        // (onChange Trigger - ถูกต้องแล้ว)
                                                        onChange={(e) => {
                                                          field.onChange(e);
                                                          trigger(`operationResults.${index}.startTime`);
                                                          trigger(`operationResults.${index}.finishTime`);
                                                          if (subIndex > 0) {
                                                            trigger(`operationResults.${index}.subItems.${subIndex - 1}.startTime` as any);
                                                            trigger(`operationResults.${index}.subItems.${subIndex - 1}.finishTime` as any);
                                                          }
                                                          if (subIndex < subItemsArray.length - 1) {
                                                            trigger(`operationResults.${index}.subItems.${subIndex + 1}.startTime` as any);
                                                            trigger(`operationResults.${index}.subItems.${subIndex + 1}.finishTime` as any);
                                                          }
                                                        }}
                                                        mask="99:99"
                                                        className={(!isSubFinishTimeEnabled || isReadOnly) ? disabledTimeInputClass : timeInputClass}
                                                        disabled={!isSubFinishTimeEnabled || isReadOnly}
                                                      />
                                                      {error && <span className="absolute left-1 -bottom-5 text-xs text-meta-1">{error.message}</span>}
                                                    </div>
                                                  )}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </td>
                            );
                          }
                          // ... (โค้ด case 'DESCRIPTION' ส่วนที่เหลือ เหมือนเดิม) ...
                          return <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>{col.value}</td>;

                        // ... (โค้ด case 'SINGLE_INPUT_GROUP' เหมือนเดิม) ...
                        case 'SINGLE_INPUT_GROUP':
                          if (!col.input) {
                            return <td key={colIndex}>Config Error: Input is missing.</td>;
                          }
                          const fieldName = col.input.field_name.replace('{index}', String(index));
                          const fieldError = fieldName.split('.').reduce((obj: any, key) => obj && obj[key], errors);

                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                              <div className="relative pt-2 pb-6">
                                <div className="flex w-full">
                                  <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.label}</span>
                                  <input
                                    type={col.input.type || 'text'}
                                    step={col.input.step || 'any'}
                                    style={{ minWidth: '100px', maxWidth: '80px' }}
                                    className={`${inputClass} rounded-l-none rounded-r-none`}
                                    {...register(fieldName as any, {
                                      valueAsNumber: col.input.type === 'number',
                                      validate: createValidator(col.input?.validation)
                                    })}
                                  />
                                  <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">{col.input.unit}</span>
                                </div>
                                {fieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{fieldError.message as string}</span>}
                              </div>
                            </td>
                          );

                        // ✅ [FIX MULTI_INPUT_GROUP] แก้ไขบั๊ก Controller ซ้อน register และ validateผิด
                        case 'MULTI_INPUT_GROUP':
                          if (!col.inputs) {
                            return <td key={colIndex}>Config Error: Inputs array is missing.</td>;
                          }
                          return (
                            <td key={colIndex} className={tdLeftClass} colSpan={col.span || 1}>
                              <div className="flex flex-col gap-2">
                                {col.description && (
                                  <span className="font-medium">
                                    {typeof col.description === 'object' ? col.description.main : col.description}
                                  </span>
                                )}

                                {/* single row inputs: no wrap, horizontal scroll if overflow */}
                                <div className="flex items-center gap-4 flex-nowrap overflow-x-auto py-2">
                                  {col.inputs.map((inputItem: any, inputIdx: number) => {
                                    const multiFieldName = inputItem.field_name.replace('{index}', String(index));
                                    const multiFieldError = multiFieldName.split('.').reduce((obj: any, key: any) => obj && obj[key], errors);

                                    return (
                                      <div key={inputIdx} className="relative pt-2 pb-6">
                                        <div className="flex items-center">
                                          <span className="mr-2 whitespace-nowrap">{inputItem.label}</span>
                                          <Controller
                                            name={multiFieldName as any}
                                            control={control}
                                            render={({ field }) => (
                                              <input
                                                {...field}
                                                type={inputItem.type || 'text'}
                                                className={inputClass}
                                                style={{ minWidth: '60px', maxWidth: '80px' }}
                                                disabled={isReadOnly}
                                                {...register(multiFieldName as any, {
                                                  valueAsNumber: inputItem.type === 'number',
                                                  validate: createValidator(col.validation)
                                                })}
                                              />
                                            )}
                                          />
                                          <span className="ml-2">{inputItem.unit}</span>
                                        </div>
                                        {multiFieldError && <span className="absolute left-0 -bottom-1 text-sm text-meta-1">{multiFieldError.message as string}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          );
                        default:
                          return <td key={colIndex}>Unsupported column type</td>;
                      }
                    })}
                    {/* ==================================================================
                      ✨ 6. MAIN ITEM - START TIME CONTROLLER (Logic ที่ถูกต้อง) ✨
                      ==================================================================
                    */}
                    <td className={tdCenterClass}>
                      <Controller
                        name={`operationResults.${index}.startTime`}
                        control={control}
                        rules={{
                          validate: {
                            // 1. แนวตั้ง (Duration)
                            lessThanFinish: (value) => {
                              if (isFinishTimeDisabled) return true;
                              const finishTime = getValues(`operationResults.${index}.finishTime`);
                              const startTimeNum = parseTime(value);
                              const finishTimeNum = parseTime(finishTime);
                              if (startTimeNum === null || finishTimeNum === null) return true;

                              let duration: number;
                              if (startTimeNum <= finishTimeNum) {
                                duration = finishTimeNum - startTimeNum;
                              } else {
                                duration = (finishTimeNum + 1440) - startTimeNum;
                              }

                              if (duration === 0) return 'Start < Finish';
                              return duration <= MAX_SHIFT_DURATION_MINUTES || 'Start < Finish';
                            },
                            // 2. แนวนอน (ย้อนกลับ - ✨ อัปเดตเช็ค Duration)
                            afterPreviousTime: (value) => {
                              const currentTimeNum = parseTime(value);
                              if (currentTimeNum === null) return true;
                              const prevTime = findPreviousEnabledTime(index, -1);
                              if (!prevTime) return true;
                              const { timeNum: prevTimeNum, timeStr: prevTimeStr } = prevTime;

                              let duration: number;
                              if (currentTimeNum >= prevTimeNum) {
                                duration = currentTimeNum - prevTimeNum; // Same day
                              } else {
                                duration = (currentTimeNum + 1440) - prevTimeNum; // Overnight
                              }

                              return duration <= MAX_SHIFT_DURATION_MINUTES || `ต้องมากกว่า${prevTimeStr}`;
                            },
                            // 3. แนวนอน (ไปข้างหน้า - ✨ อัปเดตเช็ค Duration)
                            beforeNextTime: (value) => {
                              const currentTimeNum = parseTime(value);
                              if (currentTimeNum === null) return true;
                              const nextTime = findNextEnabledTime(index, -1);
                              if (!nextTime) return true;
                              const { timeNum: nextTimeNum, timeStr: nextTimeStr } = nextTime;

                              let duration: number;
                              if (nextTimeNum >= currentTimeNum) {
                                duration = nextTimeNum - currentTimeNum; // Same day
                              } else {
                                duration = (nextTimeNum + 1440) - currentTimeNum; // Overnight
                              }

                              return duration <= MAX_SHIFT_DURATION_MINUTES || `Gap to ${nextTimeStr} > 12h`;
                            }
                          }
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <div className="relative">
                            <InputMask
                              {...field}
                              // (onChange Trigger - ถูกต้องแล้ว)
                              onChange={(e) => {
                                field.onChange(e);
                                if (index > 0) {
                                  trigger(`operationResults.${index - 1}.startTime`);
                                  trigger(`operationResults.${index - 1}.finishTime`);
                                }
                                if (index < fields.length - 1) {
                                  trigger(`operationResults.${index + 1}.startTime`);
                                  trigger(`operationResults.${index + 1}.finishTime`);
                                }
                                const subItems = fields[index]?.config_json?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems;
                                if (subItems) {
                                  subItems.forEach((_: any, subIdx: number) => {
                                    trigger(`operationResults.${index}.subItems.${subIdx}.startTime` as any);
                                    trigger(`operationResults.${index}.subItems.${subIdx}.finishTime` as any);
                                  });
                                }
                              }}
                              mask="99:99"
                              className={(isStartTimeDisabled || isReadOnly) ? disabledInputClass : inputClass}
                              disabled={isStartTimeDisabled || isReadOnly}
                            />
                            {error && <span className="absolute left-1 -bottom-5 text-xs text-meta-1">{error.message}</span>}
                          </div>
                        )}
                      />
                    </td>
                    {/* ==================================================================
                      ✨ 7. MAIN ITEM - FINISH TIME CONTROLLER (Logic ที่ถูกต้อง) ✨
                      ==================================================================
                    */}
                    <td className={tdCenterClass}>
                      <Controller
                        name={`operationResults.${index}.finishTime`}
                        control={control}
                        rules={{
                          validate: {
                            // 1. แนวตั้ง (Duration)
                            greaterThanStart: (value) => {
                              if (isStartTimeDisabled) return true;
                              const startTime = getValues(`operationResults.${index}.startTime`);
                              const startTimeNum = parseTime(startTime);
                              const finishTimeNum = parseTime(value);
                              if (startTimeNum === null || finishTimeNum === null) return true;

                              let duration: number;
                              if (startTimeNum <= finishTimeNum) {
                                duration = finishTimeNum - startTimeNum;
                              } else {
                                duration = (finishTimeNum + 1440) - startTimeNum;
                              }

                              if (duration === 0) return 'Finish > Start';
                              return duration <= MAX_SHIFT_DURATION_MINUTES || 'Start < Finish';
                            },
                            // 2. แนวนอน (ย้อนกลับ - ✨ อัปเดตเช็ค Duration)
                            afterPreviousTime: (value) => {
                              const currentTimeNum = parseTime(value);
                              if (currentTimeNum === null) return true;
                              const prevTime = findPreviousEnabledTime(index, -1);
                              if (!prevTime) return true;
                              const { timeNum: prevTimeNum, timeStr: prevTimeStr } = prevTime;

                              let duration: number;
                              if (currentTimeNum >= prevTimeNum) {
                                duration = currentTimeNum - prevTimeNum; // Same day
                              } else {
                                duration = (currentTimeNum + 1440) - prevTimeNum; // Overnight
                              }

                              return duration <= MAX_SHIFT_DURATION_MINUTES || `ต้องมากกว่า ${prevTimeStr}`;
                            },
                            // 3. แนวนอน (ไปข้างหน้า - ✨ อัปเดตเช็ค Duration)
                            beforeNextTime: (value) => {
                              const currentTimeNum = parseTime(value);
                              if (currentTimeNum === null) return true;
                              const nextTime = findNextEnabledTime(index, -1);
                              if (!nextTime) return true;
                              const { timeNum: nextTimeNum, timeStr: nextTimeStr } = nextTime;

                              let duration: number;
                              if (nextTimeNum >= currentTimeNum) {
                                duration = nextTimeNum - currentTimeNum; // Same day
                              } else {
                                duration = (nextTimeNum + 1440) - currentTimeNum; // Overnight
                              }

                              return duration <= MAX_SHIFT_DURATION_MINUTES || `Gap to ${nextTimeStr} > 12h`;
                            }
                          }
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <div className="relative">
                            <InputMask
                              {...field}
                              // (onChange Trigger - ถูกต้องแล้ว)
                              onChange={(e) => {
                                field.onChange(e);
                                if (index > 0) {
                                  trigger(`operationResults.${index - 1}.startTime`);
                                  trigger(`operationResults.${index - 1}.finishTime`);
                                }
                                if (index < fields.length - 1) {
                                  trigger(`operationResults.${index + 1}.startTime`);
                                  trigger(`operationResults.${index + 1}.finishTime`);
                                }
                                const subItems = fields[index]?.config_json?.columns?.find((c: { type: string }) => c.type === 'DESCRIPTION')?.description?.subItems;
                                if (subItems) {
                                  subItems.forEach((_: any, subIdx: number) => {
                                    trigger(`operationResults.${index}.subItems.${subIdx}.startTime` as any);
                                    trigger(`operationResults.${index}.subItems.${subIdx}.finishTime` as any);
                                  });
                                }
                              }}
                              mask="99:99"
                              className={(isFinishTimeDisabled || isReadOnly) ? disabledInputClass : inputClass}
                              disabled={isFinishTimeDisabled || isReadOnly}
                            />
                            {error && <div><span className="absolute left-1 -bottom-5 text-xs text-meta-1">{error.message}</span></div>}
                          </div>
                        )}
                      />
                    </td>
                  </tr>
                );
              })}
              {/* ... (โค้ดส่วน Remark และ </tbody> </table> </div> </div> </div> เหมือนเดิม) ... */}
              <tr>
                <td className={tdLeftClass} colSpan={5}>
                  <div className="flex w-full">
                    <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">Remark</span>
                    <textarea
                      className={`${isReadOnly ? disabledInputClass : inputClass} h-[50px] rounded-l-none`}
                      {...register('operationRemark')}
                      disabled={isReadOnly}
                    ></textarea>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SharedFormStep3;