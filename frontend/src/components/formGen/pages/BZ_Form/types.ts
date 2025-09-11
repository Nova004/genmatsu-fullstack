// src/pages/BZ_Form/types.ts

import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";

// --- Interface สำหรับข้อมูลทั้งหมดในฟอร์ม ---
export interface IManufacturingReportForm {
  // Step 1
  reportType: 'AS2' | 'BZ';
  basicData: { date: string; machineName: string; lotNo: string; };
  mcOperators: { id: string; name: string; number: string }[];
  assistants: { id: string; name: string; number: string }[];
  conditions: { status: 'OK' | 'NG' | null; remark: string; }[];

  // Step 2
  rawMaterials: {
    diaEarth: number | null;
    sodiumChloride: number | null;
    magnesiumHydroxide: number | null;
    remainedGenmatsu: { lot: string; actual: number | null; };
    shelfLife: number | null; // <-- แก้ไขตรงนี้ให้เหลืออันเดียว
    ncrGenmatsu: { lot: string; actual: number | null; };
  };
  cg1cWeighting: {
    row1: { cg1c: number | null; bagNo: string; bagWeight: string; net: number | null; };
    row2: { cg1c: number | null; bagNo: string; bagWeight: string; net: number | null; };
    total: number | null;
  };
  calculations: {
    nacl15SpecGrav: number | null;
    cg1cWaterContent: number | null;
    temperature: number | null;
    naclBrewingTable: number | null;
    naclWaterCalc: number | null;
    waterCalc: number | null;
    saltCalc: number | null;
    finalTotalWeight: number | null;
  };
  qouRemark: string;

  // Step 3
  operationResults: {
    startTime: string;
    finishTime: string;
    humidity?: number | null;
  }[];
  operationRemark: string;

  // Step 4
  packingResults: {
    diameter: number | null;
    quantityOfProduct: {
      cans: number | null;
      calculated: number | null;
    };
    meshPass40: number | null;
    remain: number | null;
    yieldPercent: number | null;
  };
  palletInfo: {
    no: string;
    qty: number | null;
    canNo: string;
  }[];
}



export interface IMasterFormItem {
  item_id: number;
  display_order: number;
  config_json: any; // เราใช้ any ไปก่อนเพื่อความยืดหยุ่น
  is_active: boolean;
}

// --- Props Interfaces สำหรับ Component ย่อย ---
export interface EmployeeInputRowProps {
  groupName: 'mcOperators' | 'assistants';
  index: number;
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;    // <-- เพิ่ม watch
  setValue: UseFormSetValue<IManufacturingReportForm>; // <-- เพิ่ม setValue
}

export interface ConditionCheckItemProps {
  index: number;
  title: string;
  description: string;
  warning?: string;
  reference?: string;
  register: UseFormRegister<IManufacturingReportForm>;
}

export interface FormStepProps {
  register: UseFormRegister<IManufacturingReportForm>;
}

export interface PalletTableProps {
  register: UseFormRegister<IManufacturingReportForm>;
  title: string;
  numberOfRows: number;
  fieldName: "palletInfo";
}



