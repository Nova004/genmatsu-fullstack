export interface ProductionRecord {
  id: number;
  productName: string;
  lotNo: string;
  input: number;
  output: number;
  pallets: { no: string | number; qty: string | number }[];
  stPlan: number;
  yield: number;
  moisture?: number;
  production_date?: string;
}

export interface ReportData {
  lineA: ProductionRecord[];
  lineB: ProductionRecord[];
  lineC: ProductionRecord[];
  lineD?: ProductionRecord[];
}

export interface RecycleValue {
  kg: string;
  percent: string;
}