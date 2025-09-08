// src/pages/BZ_Form/FormStep3.tsx

import React from 'react';
import { FormStepProps } from './types';

// ข้อมูลสำหรับสร้างตารางแต่ละแถว
const operationSteps = [
  { no: 1, description: 'ใส่เก็น BZ ที่เหลือจากการผลิตในครั้งก่อนเท CG-1C ลงไป 2 ถุง' },
  { no: 2, description: 'เปิดเครื่องปั่นใช้เวลา 15 นาที' },
  { no: 3, description: 'หยุดเครื่องและตัก CG-1C มาเช็คค่าความชื้น' },
  { no: 4, description: 'เปิดเครื่องแล้วใส่สารละลายน้ำเกลือ' },
  { no: 5, description: 'เมื่อใส่สารละลายน้ำเกลือเสร็จให้เปิดลม 20 วินาที ให้เครื่องทำงานไปอีก 5 นาที' },
  { no: 6, description: 'ใส่แม็กนีเซียมและใส่ Genmatsu NCR (ถ้ามี) ให้เครื่องทำงานไปอีก 10 นาที' },
  { no: 7, description: 'หยุดเครื่อง, ปิดเครื่องไว้ 20 นาที' },
  { no: 8, description: 'เปิดให้เครื่องทำงาน 1 นาที' },
  { no: 9, description: 'หยุดเครื่องและตักตัวอย่างมาเช็คค่าความชื้น', hasHumidity: true }, // รายการพิเศษ
  { no: 10, description: 'เริ่มการบรรจุ (เก็บตัวอย่างในกระป๋องที่ 60 )' },
];

const FormStep3: React.FC<FormStepProps> = ({ register }) => {
  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Operation result / รายละเอียดผลการผลิต</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className={thClass}>No.</th>
                <th className={thClass} colSpan={2}>Operation result / รายละเอียดผลการผลิต</th>
                <th className={thClass}>Start time</th>
                <th className={thClass}>Finish time</th>
              </tr>
            </thead>
            <tbody>
              {operationSteps.map((step, index) => (
                <tr key={step.no}>
                  <td className={tdCenterClass}>{step.no}</td>
                  
                  {/* สำหรับรายการที่ 9 ที่มีช่อง "ค่าความชื้น" */}
                  {step.hasHumidity ? (
                    <>
                      <td className={tdLeftClass}>{step.description}</td>
                      <td className={tdLeftClass}>
                        <div className="flex w-full">
                          <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">ค่าความชื้น</span>
                          <input type="number" step="0.1" className={`${inputClass} rounded-l-none rounded-r-none`} {...register(`operationResults.${index}.humidity`, { valueAsNumber: true })} />
                          <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">(STD 33.0 - 36.0 %)</span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <td className={tdLeftClass} colSpan={2}>{step.description}</td>
                  )}

                  <td className={tdCenterClass}><input type="time" className={inputClass} {...register(`operationResults.${index}.startTime`)} /></td>
                  <td className={tdCenterClass}><input type="time" className={inputClass} {...register(`operationResults.${index}.finishTime`)} /></td>
                </tr>
              ))}
              {/* แถวสำหรับ Remark */}
              <tr>
                <td className={tdLeftClass} colSpan={5}>
                  <div className="flex w-full">
                    <span className="inline-flex items-center whitespace-nowrap rounded-l-md border border-r-0 border-stroke bg-gray-2 px-3 text-sm text-black dark:border-strokedark dark:bg-meta-4 dark:text-white">Remark</span>
                    <textarea className={`${inputClass} h-25 rounded-l-none`} {...register('operationRemark')}></textarea>
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

export default FormStep3;