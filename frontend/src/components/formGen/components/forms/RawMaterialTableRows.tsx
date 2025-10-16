import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { IManufacturingReportForm, IStep2ConfigJson } from '../../pages/types';
import ValidatedInput from './ValidatedInput';

interface RawMaterialTableRowsProps {
  fields: any[];
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}

const RawMaterialTableRows: React.FC<RawMaterialTableRowsProps> = ({ fields, register, errors }) => {
  // ClassNames ต่างๆ ยังคงเหมือนเดิม
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  return (
    <>
      {fields.map(field => {
        const config = field.config_json as IStep2ConfigJson;

        switch (config.row_type) {
          
          // ✨ 1. ลบ if case พิเศษของ diaEarth ทิ้งไปทั้งหมด
          //    ตอนนี้ทุกแถวที่เป็น SINGLE_INPUT จะใช้ Logic เดียวกันคือเรียก <ValidatedInput />
          case 'SINGLE_INPUT':
            return (
              <tr key={field.item_id}>
                <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                <td className={tdCenterClass}>{config.std_value}</td>
                <td className={tdCenterClass}>
                  {/* ValidatedInput ฉลาดพอที่จะจัดการ input แบบ disabled ได้เอง
                    จาก property `is_disabled` ใน config 
                  */}
                  <ValidatedInput config={config} register={register} errors={errors} />
                </td>
                <td className={tdCenterClass}>{config.unit}</td>
              </tr>
            );

          case 'SINGLE_INPUT_SPAN':
            return (
              <tr key={field.item_id}>
                <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                <td className={tdCenterClass}>{config.std_value}</td>
                <td className={tdCenterClass} rowSpan={2}>
                  <ValidatedInput config={config} register={register} errors={errors} />
                </td>
                <td className={tdCenterClass}>{config.unit}</td>
              </tr>
            );

          case 'SUB_ROW':
            return (
              <tr key={field.item_id}>
                <td className={tdLeftClass} colSpan={2}>{config.label}</td>
                <td className={tdCenterClass}>{config.std_value}</td>
                <td className={tdCenterClass}>{config.unit}</td>
              </tr>
            );

          case 'DUAL_INPUT':
            return (
              <tr key={field.item_id}>
                <td className={tdLeftClass}>{config.label}</td>
                <td className={tdCenterClass}>
                  <ValidatedInput config={config} inputIndex={0} register={register} errors={errors} />
                </td>
                <td className={tdCenterClass}>{config.std_value}</td>
                <td className={tdCenterClass}>
                  <ValidatedInput config={config} inputIndex={1} register={register} errors={errors} />
                </td>
                <td className={tdCenterClass}>{config.unit}</td>
              </tr>
            );

          default:
            return null;
        }
      })}
    </>
  );
};

export default RawMaterialTableRows;