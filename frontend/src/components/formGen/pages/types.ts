import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from "react-hook-form";

// --- Interface สำหรับข้อมูลทั้งหมดในฟอร์ม ---
export interface IManufacturingReportForm {
  // Step 1
  reportType: 'AS2' | 'BZ' | 'BZ3' | 'BS3';
  basicData: { date: string; machineName: string; lotNo: string; };
  mcOperators: { id: string; name: string; number: string }[];
  assistants: { id: string; name: string; number: string }[];
  conditions: { status: 'OK' | 'NG' | null; remark: string; }[];
  values: {
    value: string;
    remark: string;
  }[];
  checklist: {
    coolingValve: string;
    butterflyValve: string;
  };

  // Step 2
  rawMaterials: {
    gypsumplaster: number | null;
    activatedcarbon: number | null;
    diaEarth: number | null;
    sodiumChloride: number | null;
    magnesiumHydroxide: number | null;
    remainedGenmatsu: { lot: string; actual: number | null; };
    shelfLife: number | null;
    ncrGenmatsu: { lot: string; actual: number | null; };
    calciumchloride: number | null;
    activated: number | null;
  };

  // --- เพิ่มโครงสร้างใหม่สำหรับ BZ ---

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
  valued: number | null;

  // ---  เพิ่มโครงสร้างใหม่สำหรับ BZ3 ---

  rc417Weighting?: {
    row1: { weight: number | null; bagNo: string; net: number | null };
    row2: { weight: number | null; bagNo: string; net: number | null };
    total: number | null;
  };
  bz3Calculations?: {
    rc417WaterContent: number | null;
    intermediateWaterCalc: number | null;
    totalWeightOfMaterials: string | null;
    stdMeanMoisture: number | null;
    naclWater: number | null;
    naclWaterSpecGrav: string | null;
    temperature: number | null;
    naclWater15: number | null;
    lminRate: string | null;
    totalNaclWater: number | null;
    totalWeightWithNcr: number | null;
  };

  // ---  เพิ่มโครงสร้างใหม่สำหรับ BS3 ---

  bs3Calculations?: {
    rc417WaterContent: number | null;
    intermediateWaterCalc: number | null;
    totalWeightOfMaterials: string | null;
    stdMeanMoisture: number | null;
    naclWater: number | null;
    naclWaterSpecGrav: string | null;
    temperature: number | null;
    naclWater4: number | null;
    lminRate: string | null;
    totalNaclWater: number | null;
    totalWeightWithNcr: number | null;
  };


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
    weighttank: {
      tank: number | null;
      others: number | null;
    };
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


// --- Interfaces for Master Form Structure (Step 3) ---
// ส่วนที่เพิ่มเข้ามาใหม่เพื่อกำหนดโครงสร้างที่ชัดเจนให้กับ config_json

export interface IColumnInputConfig {
  label: string;
  type: 'text' | 'number';
  step?: string;
  field_name: string;
  unit: string;
  validation?: IValidationRules;
}

export interface IColumnConfig {
  type: 'DESCRIPTION' | 'SINGLE_INPUT_GROUP' | 'MULTI_INPUT_GROUP';
  span?: number;
  value?: string;
  description?: {
    main?: string;
    subItems?: {
      id: string;
      text: string;
      inputs?: {
        startTime?: { enabled: boolean };
        finishTime?: { enabled: boolean };
      };
    }[];
  };
  input?: IColumnInputConfig;
  inputs?: IColumnInputConfig[];
  validation?: IValidationRules;

}

export interface ITimeInputConfig {
  enabled: boolean;
}

export interface IConfigJson {
  columns: IColumnConfig[];
  inputs: {
    startTime?: ITimeInputConfig;
    finishTime?: ITimeInputConfig;
  };
}

export interface IValidationRules {
  type: 'RANGE_TOLERANCE' | 'RANGE_DIRECT' | 'MAX_VALUE';
  min?: number;
  max?: number;
  errorMessage: string;
}

export interface IStep2InputConfig {
  field_name: string; // ควรแก้ให้เป็น Path<IManufacturingReportForm> ในอนาคต
  type: 'text' | 'number';
  is_disabled?: boolean;
  validation?: IValidationRules;
}

// Interface หลักสำหรับ config_json ของ Step 2
export interface IStep2ConfigJson {
  row_type: 'SINGLE_INPUT' | 'SINGLE_INPUT_SPAN' | 'SUB_ROW' | 'DUAL_INPUT';
  label: string;
  std_value: string | number;
  unit: string;
  inputs: IStep2InputConfig[];
  validation?: IValidationRules; // Validation รวมสำหรับทั้งแถว
}

// --- Interface หลักสำหรับ Master Data ---
export interface IMasterFormItem {
  item_id: number;
  display_order: number;
  config_json: IConfigJson | IStep2ConfigJson | any; // ใช้ any เป็น fallback ชั่วคราว
  is_active: boolean;
}

// --- Props Interfaces สำหรับ Component ย่อย ---
export interface EmployeeInputRowProps {
  groupName: 'mcOperators' | 'assistants';
  index: number;
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>;
  setValue: UseFormSetValue<IManufacturingReportForm>;
}

export interface ConditionCheckItemProps {
  index: number;
  title: string;
  description: string;
  warning?: string;
  reference?: string;
  register: UseFormRegister<IManufacturingReportForm>;
  watch: UseFormWatch<IManufacturingReportForm>; // 👈 เพิ่ม watch
  errors: FieldErrors<IManufacturingReportForm>; // 👈 เพิ่ม errors

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

export interface ValueInputItemProps {
  index: number;
  title: string;
  description: string;
  valueLabel: string;
  warning?: string;
  reference?: string;
  register: UseFormRegister<IManufacturingReportForm>;
  errors: FieldErrors<IManufacturingReportForm>;
}