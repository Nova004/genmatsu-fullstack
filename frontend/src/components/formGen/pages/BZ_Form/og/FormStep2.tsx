// src/pages/BZ_Form/FormStep2.tsx

import React, { useEffect } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { FormStepProps, IManufacturingReportForm } from './types';

// สร้าง Interface สำหรับ Props ของหน้านี้โดยเฉพาะ เพื่อให้ Type ถูกต้อง
interface FormStep2Props extends FormStepProps {
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
}

const FormStep2: React.FC<FormStep2Props> = ({ register, watch, setValue }) => {

  // --- "สายลับ" คอยแอบดูค่าที่ต้องการ ---
  const cg1cRow1 = watch('cg1cWeighting.row1.cg1c');
  const cg1cRow2 = watch('cg1cWeighting.row2.cg1c');
  // นายสามารถเพิ่ม "สายลับ" เพื่อดูค่าอื่นๆ ได้อีกตามต้องการ
  // const magnesium = watch('rawMaterials.magnesiumHydroxide');

  // --- "ยามเฝ้าระวัง" ก้อนที่ 1: สำหรับคำนวณ Total Weight ---
  useEffect(() => {
    const net1 = Number(cg1cRow1) || 0;
    const net2 = Number(cg1cRow2) || 0;
    const total = net1 + net2;

    // --- "ผู้สั่งการ" สั่งอัปเดตค่า ---
    setValue('cg1cWeighting.row1.net', net1 > 0 ? net1 : null);
    setValue('cg1cWeighting.row2.net', net2 > 0 ? net2 : null);
    setValue('cg1cWeighting.total', total > 0 ? total : null);
    setValue('rawMaterials.diaEarth', total > 0 ? total : null);

  }, [cg1cRow1, cg1cRow2, setValue]); // <-- ยามจะทำงานเมื่อค่าเหล่านี้เปลี่ยน

  // นายสามารถเพิ่ม useEffect ก้อนที่ 2, 3, 4 สำหรับ Logic อื่นๆ ได้ที่นี่
  // useEffect(() => {
  //   // Logic การคำนวณ Final Total Weight
  // }, [watch('cg1cWeighting.total'), magnesium, setValue]);


  const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const disabledInputClass = `${inputClass} bg-gray-2 dark:bg-meta-4 cursor-default`;
  const thClass = "border-b border-stroke px-4 py-3 text-center font-medium text-black dark:border-strokedark dark:text-white";
  const tdClass = "border-b border-stroke px-4 py-3 text-black dark:border-strokedark dark:text-white";
  const tdCenterClass = `${tdClass} text-center align-middle`;
  const tdLeftClass = `${tdClass} align-middle`;

  return (
    <div>
      <div className="border-b-2 border-stroke py-2 text-center dark:border-strokedark">
        <h5 className="font-medium text-black dark:text-white">Quantity of used raw material</h5>
      </div>
      <div className="rounded-b-sm border border-t-0 border-stroke p-5 dark:border-strokedark">
        {/* --- ตารางที่ 1: Raw Material Name --- */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full table-auto">
             {/* ... โค้ด JSX ของตารางที่ 1 (เหมือนเดิม) ... */}
             <thead>
               <tr className="bg-gray-2 text-left dark:bg-meta-4">
                 <th className={`${thClass}`} colSpan={2}>Raw Material Name</th>
                 <th className={thClass}>STD</th>
                 <th className={thClass}>Actual Weight</th>
                 <th className={thClass}>Unit</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td className={tdLeftClass} colSpan={2}>Diatomaceous Earth (CG-1C)</td>
                 <td className={tdCenterClass}>800 ± 24</td>
                 <td className={tdCenterClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('rawMaterials.diaEarth')} /></td>
                 <td className={tdCenterClass}>KG</td>
               </tr>
               <tr>
                 <td className={tdLeftClass} colSpan={2}>Sodium Chloride (โซเดียมคลอไรด์)</td>
                 <td className={tdCenterClass}>480-580</td>
                 <td className={tdCenterClass} rowSpan={2}><input type="number" className={disabledInputClass} readOnly disabled {...register('rawMaterials.sodiumChloride')} /></td>
                 <td className={tdCenterClass}>L</td>
               </tr>
               <tr>
                 <td className={tdLeftClass} colSpan={2}>(ช่วงมาตรฐานค่าความถ่วงจำเพาะ )</td>
                 <td className={tdCenterClass}>1.104 - 1.115</td>
                 <td className={tdCenterClass}>KG</td>
               </tr>
               <tr>
                 <td className={tdLeftClass} colSpan={2}>Magnesium Hydroxide (Mg (OH)2)</td>
                 <td className={tdCenterClass}>20 ± 0.1</td>
                 <td className={tdCenterClass}><input type="number" step="0.01" className={inputClass} {...register('rawMaterials.magnesiumHydroxide', { valueAsNumber: true })} /></td>
                 <td className={tdCenterClass}>KG</td>
               </tr>
               <tr>
                 <td className={tdLeftClass}>Remained Genmatsu , Lot No.</td>
                 <td className={tdCenterClass}><input type="text" className={inputClass} {...register('rawMaterials.remainedGenmatsu.lot')} /></td>
                 <td className={tdCenterClass}>12</td>
                 <td className={tdCenterClass}><input type="number" className={inputClass} {...register('rawMaterials.remainedGenmatsu.actual', { valueAsNumber: true })} /></td>
                 <td className={tdCenterClass}>KG</td>
               </tr>
              {/* --- แก้ไข "Shef life" ตามโค้ดล่าสุดของนาย --- */}
               <tr>
                 <td className={tdLeftClass} colSpan={2}>Shef life</td>
                 <td className={tdCenterClass}>≤90</td>
                 <td className={tdCenterClass}><input type="number" className={inputClass} {...register('rawMaterials.shelfLife', { valueAsNumber: true })} /></td>
                 <td className={tdCenterClass}>KG</td>
               </tr>
               <tr>
                 <td className={tdLeftClass}>NCR Genmatsu , Lot No.</td>
                 <td className={tdCenterClass}><input type="text" className={inputClass} {...register('rawMaterials.ncrGenmatsu.lot')} /></td>
                 <td className={tdCenterClass}>≤60</td>
                 <td className={tdCenterClass}><input type="number" className={inputClass} {...register('rawMaterials.ncrGenmatsu.actual', { valueAsNumber: true })} /></td>
                 <td className={tdCenterClass}>KG</td>
               </tr>
             </tbody>
          </table>
        </div>

        {/* --- ตารางที่ 2: Calculations (ตามที่นายส่งมาล่าสุด) --- */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <tbody>
              <tr>
                <td className={tdLeftClass}>CG-1C Weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('cg1cWeighting.row1.cg1c', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row1.bagNo')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row1.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG-1C Weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={inputClass} {...register('cg1cWeighting.row2.cg1c', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass}>Bag No.</td>
                <td className={tdLeftClass}><input type="text" className={inputClass} {...register('cg1cWeighting.row2.bagNo')} /></td>
                <td className={tdLeftClass}>Net weight (KG) :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.row2.net')} /></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total Weight :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('cg1cWeighting.total')} /></td>
                <td className={tdLeftClass}>Net Weight of Yieid (STD) :</td>
                <td className={tdLeftClass}><input type="text" className={disabledInputClass} readOnly value="800" /></td>
                <td className={tdLeftClass}>KG</td>
                <td className={tdLeftClass}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NaCl Water Specific gravity</td>
                <td className={tdLeftClass}><input type="number" step="0.001" className={inputClass} {...register('calculations.nacl15SpecGrav', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>CG - 1C Water Content (Moisture)</td>
                <td className={tdLeftClass}><input type="number" step="0.01" className={inputClass} {...register('calculations.cg1cWaterContent', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Temperature (˚C)</td>
                <td className={tdLeftClass}><input type="number" step="0.1" className={inputClass} {...register('calculations.temperature', { valueAsNumber: true })} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>NaCl brewing table</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclBrewingTable')} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>15% NacCl Water Calculaion for finding water content</td>
                <td className={tdCenterClass}>(3*6)/4 =</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.naclWaterCalc')} /></td>
                <td className={tdLeftClass} colSpan={3}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Water (8) * 0.85</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.waterCalc')} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Salt (8) * 0.15</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.saltCalc')} /></td>
                <td className={tdLeftClass} colSpan={4}></td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Total weight :</td>
                <td className={tdLeftClass}><input type="number" className={disabledInputClass} readOnly disabled {...register('calculations.finalTotalWeight')} /></td>
                <td className={tdLeftClass} colSpan={4} style={{ fontSize: 'small' }}>* Diatomaceous Earth (CG-1C) + (8) + Magnesium Hydroxide + Remained Genmatsu + NCR Genmatsu</td>
              </tr>
              <tr>
                <td className={tdLeftClass}>Remark (หมายเหตุ) :</td>
                <td className={tdLeftClass} colSpan={5}><textarea className={`${inputClass} h-25`} {...register('qouRemark')} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormStep2;