// นี่คือ "ต้นฉบับ" ของค่าเริ่มต้น (Default Values) ทั้งหมด
// ที่สร้างจาก IManufacturingReportForm ใน types.ts

import { IManufacturingReportForm } from './types';

// เรากำหนดค่าเริ่มต้นให้ครบทุก field เพื่อป้องกัน Warning "uncontrolled input"
export const initialFormValues: IManufacturingReportForm = {
  // --- Step 1 ---
  reportType: 'BZ', // (สามารถเปลี่ยนเป็น 'AS2' หรือค่าเริ่มต้นอื่นๆ ที่คุณต้องการ)
  basicData: {
    date: '', // (ใช้ null ปลอดภัยที่สุดสำหรับ Date Picker)
    machineName: '',
    lotNo: '',
  },
  mcOperators: Array(3).fill({ id: '', name: '', number: '' }),
  assistants: Array(5).fill({ id: '', name: '', number: '' }),
  conditions: Array(3).fill({ status: null, remark: '' }),
  values: [], // (Array ว่าง)
  checklist: {
    coolingValve: '',
    butterflyValve: '',
  },

  // --- Step 2 ---
  rawMaterials: {
    gypsumplaster: null,
    activatedcarbon: null,
    diaEarth: null,
    sodiumChloride: null,
    magnesiumHydroxide: null,
    remainedGenmatsu: { lot: '', actual: null },
    shelfLife: null,
    ncrGenmatsu: { lot: '', actual: null },
    calciumchloride: null,
    activated: null,
  },

  // --- BZ ---
  cg1cWeighting: {
    row1: { cg1c: null, bagNo: '', bagWeight: '', net: null },
    row2: { cg1c: null, bagNo: '', bagWeight: '', net: null },
    total: null,
  },
  calculations: {
    nacl15SpecGrav: null,
    cg1cWaterContent: null,
    temperature: null,
    naclBrewingTable: null,
    naclWaterCalc: null,
    waterCalc: null,
    saltCalc: null,
    finalTotalWeight: null,
  },
  qouRemark: '',
  valued: null,

  // --- BZ3 & BS3 & BZ5-C & BS5-C (Optional fields ก็ต้องใส่) ---
  rc417Weighting: {
    row1: { weight: null, bagNo: '', net: null },
    row2: { weight: null, bagNo: '', net: null },
    total: null,
    cdz1ofad: null,
  },
  bz3Calculations: {
    rc417WaterContent: null,
    intermediateWaterCalc: null,
    totalWeightOfMaterials: null,
    stdMeanMoisture: null,
    naclWater: null,
    naclWaterSpecGrav: null,
    temperature: null,
    naclWater15: null,
    lminRate: null,
    totalNaclWater: null,
    totalWeightWithNcr: null,
  },
  bs3Calculations: {
    rc417WaterContent: null,
    intermediateWaterCalc: null,
    totalWeightOfMaterials: null,
    stdMeanMoisture: null,
    naclWater: null,
    naclWaterSpecGrav: null,
    temperature: null,
    naclWater4: null,
    lminRate: null,
    totalNaclWater: null,
    totalWeightWithNcr: null,
  },
  bz5cCalculations: {
    rc417WaterContentMoisture: null,
    rc417WaterContentweight: null,
    intermediateWaterCalc: null,
    totalWeightOfMaterials: null,
    stdMeanMoisture: null,
    naclWater: null,
    naclWaterSpecGrav: null,
    temperature: null,
    naclWater4: null,
    lminRate: null,
    totalNaclWater: null,
    totalWeightWithNcr: null,
  },
  bs5cCalculations: {
    rc417WaterContentMoisture: null,
    rc417WaterContentweight: null,
    intermediateWaterCalc: null,
    totalWeightOfMaterials: null,
    stdMeanMoisture: null,
    naclWater: null,
    naclWaterSpecGrav: null,
    temperature: null,
    naclWater4: null,
    lminRate: null,
    totalNaclWater: null,
    totalWeightWithNcr: null,
    Netweightofwaterper: null,
  },

  // --- Step 3 ---
  operationResults: [], // (Array ว่าง)
  operationRemark: '',

  // --- Step 4 ---
  packingResults: {
    diameter: null,
    weighttank: {
      tank: null,
      others: null,
    },
    quantityOfProduct: {
      cans: null,
      calculated: null,
    },
    meshPass40: null,
    remain: null,
    yieldPercent: null,
  },
  palletInfo: [], // (Array ว่าง)
};