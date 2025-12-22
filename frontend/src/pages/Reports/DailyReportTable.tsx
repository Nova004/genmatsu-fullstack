import React, { useState } from 'react';
import { FaPen, FaCheck, FaTimes } from 'react-icons/fa';

// --- Interfaces ---
interface ProductionRecord {
  id: number;
  productName: string;
  lotNo: string;
  input: number;
  output: number;
  pallets: { no: string | number; qty: string | number }[];
  stPlan: number;
  yield: number;
  moisture?: number;
}

interface ReportData {
  lineA: ProductionRecord[];
  lineB: ProductionRecord[];
  lineC: ProductionRecord[];
}

interface DailyReportTableProps {
  data: ReportData;
  onUpdateStPlan?: (id: number, newValue: number) => void;
}

const DailyReportTable: React.FC<DailyReportTableProps> = ({ data, onUpdateStPlan }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempStValue, setTempStValue] = useState<string>("");

  const maxRows = Math.max(
    data.lineA.length,
    data.lineB.length,
    data.lineC.length
  );

  // --- Handlers ---
  const handleStartEdit = (item: ProductionRecord) => {
    if (!onUpdateStPlan) return;
    setEditingId(item.id);
    setTempStValue(item.stPlan?.toString() || "0");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempStValue("");
  };

  const handleSaveEdit = (id: number) => {
    if (onUpdateStPlan) {
      const numValue = parseFloat(tempStValue);
      if (!isNaN(numValue)) {
        onUpdateStPlan(id, numValue);
      }
    }
    setEditingId(null);
  };

  // --- Helper: Calculate Totals ---
  const calculateTotals = (records: ProductionRecord[]) => {
    const totalInput = records.reduce((sum, item) => sum + (item.input || 0), 0);
    const totalOutput = records.reduce((sum, item) => sum + (item.output || 0), 0);
    const totalYield = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    
    // คำนวณ Avg Moisture
    const validMoistureRecords = records.filter(r => r.moisture !== undefined && r.moisture !== null);
    const avgMoisture = validMoistureRecords.length > 0 
      ? validMoistureRecords.reduce((sum, r) => sum + (r.moisture || 0), 0) / validMoistureRecords.length 
      : 0;
    
    return { input: totalInput, output: totalOutput, yield: totalYield, moisture: avgMoisture };
  };

  // --- Helper Components ---

  // 1. Empty Cell Render
  const renderEmptyCells = (isLineC: boolean = false) => (
    <>
      <td className="border-r border-b border-gray-300 p-1"></td>
      <td className="border-r border-b border-gray-300 p-1"></td>
      <td className="border-r border-b border-gray-300 p-1"></td>
      <td className="border-r border-b border-gray-300 p-1"></td>
      <td className="border-r border-b border-gray-300 p-1 bg-gray-50"></td>
      {isLineC && <td className="border-r border-b border-gray-300 p-1"></td>}
    </>
  );

  // 2. Data Cell Render
  const renderDataCells = (item: ProductionRecord | undefined, isLineC: boolean = false) => {
    if (!item) return renderEmptyCells(isLineC);

    const isLowYield = item.yield < 95;
    const isEditing = editingId === item.id;

    return (
      <>
        {/* Product Name */}
        <td className="border-r border-b border-gray-300 px-1 py-1 text-center align-top max-w-[80px]">
          <span className="font-semibold text-gray-900 text-xs block break-words" title={item.productName}>
            {item.productName}
          </span>
        </td>

        {/* Lot No */}
        <td className="border-r border-b border-gray-300 px-1 py-1 text-center align-top">
          <span className="font-medium text-gray-700 text-xs bg-gray-100 border border-gray-200 px-1 py-0.5 rounded block">
            {item.lotNo}
          </span>
        </td>

        {/* Input & ST. Plan */}
        <td className="border-r border-b border-gray-300 px-1 py-1 text-right align-top">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-semibold text-gray-800 leading-tight">
              {item.input?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>

            {isEditing ? (
              <div className="flex items-center gap-1 mt-0.5 bg-white border border-blue-500 rounded shadow-sm z-10 absolute p-1">
                <input
                  type="number"
                  value={tempStValue}
                  onChange={(e) => setTempStValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(item.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="w-16 text-xs text-right outline-none px-1 border border-gray-300 rounded-sm"
                  autoFocus
                />
                <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 hover:text-green-800"><FaCheck size={10} /></button>
                <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700"><FaTimes size={10} /></button>
              </div>
            ) : (
              <div 
                className="group flex items-center justify-end gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 transition-all duration-200 w-full"
                onClick={() => handleStartEdit(item)}
              >
                <span className="text-[10px] text-gray-400 font-medium">ST.Plan</span>
                <span className="text-xs font-medium text-gray-500 group-hover:text-blue-700">
                  {item.stPlan?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <FaPen size={8} className="opacity-0 group-hover:opacity-100 text-gray-400 ml-0.5" />
              </div>
            )}
          </div>
        </td>

        {/* Output & Yield */}
        <td className="border-r border-b border-gray-300 px-1 py-1 text-right align-top">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-bold text-gray-900 leading-tight">
              {item.output?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            
            <div className={`flex items-center justify-end gap-1 px-1 rounded-sm ${isLowYield ? 'text-red-700' : 'text-green-700'}`}>
               <span className="text-[10px] opacity-80 font-medium">Yield</span>
               <span className="text-xs font-bold">{item.yield?.toFixed(2)}%</span>
            </div>
          </div>
        </td>

        {/* Pallets (Full Size) */}
        <td className="border-r border-b border-gray-300 p-1 align-top bg-gray-50 min-w-[80px]">
          {item.pallets && item.pallets.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {item.pallets.map((p, idx) => (
                <div key={idx} className="flex items-center text-[10px] bg-white border border-gray-300 rounded overflow-hidden leading-tight shadow-sm">
                  <div className="w-1/2 px-1 py-0.5 text-center border-r border-gray-200 text-gray-600 font-mono font-medium truncate">
                    #{p.no}
                  </div>
                  <div className="w-1/2 px-1 py-0.5 text-center font-bold text-gray-800">
                    {Number(p.qty).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-300 text-center block text-xs py-1">-</span>
          )}
        </td>

        {/* Moisture */}
        {isLineC && (
          <td className="border-r border-b border-gray-300 p-1 text-center align-top">
            {item.moisture !== undefined && item.moisture !== null ? (
              <span className="text-xs font-bold text-gray-800">
                {item.moisture.toFixed(2)}%
              </span>
            ) : (
              <span className="text-gray-300 text-xs">-</span>
            )}
          </td>
        )}
      </>
    );
  };

  // 3. Render Total Cells
  const renderTotalCells = (records: ProductionRecord[], isLineC: boolean = false) => {
    const totals = calculateTotals(records);

    return (
      <>
        {/* Label: TOTAL */}
        <td colSpan={2} className="border-r border-b border-gray-400 bg-slate-800 px-2 py-1 text-right align-middle">
          <span className="text-xs font-bold text-white tracking-widest uppercase">
            Total
          </span>
        </td>

        {/* Total Input */}
        <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-1 text-right align-middle">
          <div className="flex flex-col justify-center items-end">
            <span className="text-sm font-black text-gray-900 leading-tight">
              {totals.input.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Input (Kg)</span>
          </div>
        </td>

        {/* Total Output */}
        <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-1 text-right align-middle">
           <div className="flex flex-col justify-center items-end">
              <span className="text-sm font-black text-gray-900 leading-tight">
                {totals.output.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Output (Kg)</span>
           </div>
        </td>

        {/* Yield (Moved to Pallet Column) */}
        <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-1 text-right align-middle">
           <div className="flex flex-col justify-center items-end">
              <span className={`text-sm font-black leading-tight ${totals.yield < 95 ? 'text-red-700' : 'text-green-700'}`}>
                 {totals.yield.toFixed(2)}%
              </span>
              <span className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Avg. Yield</span>
           </div>
        </td>

        {/* Moisture */}
        {isLineC && (
          <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-1 text-right align-middle">
              {totals.moisture > 0 ? (
                <div className="flex flex-col justify-center items-end">
                  <span className="text-sm font-black text-gray-800 leading-tight">
                    {totals.moisture.toFixed(2)}%
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Avg. Mois</span>
                </div>
              ) : (
                <div className="bg-gray-50 h-full w-full"></div>
              )}
          </td>
        )}
      </>
    );
  };

  // 4. Header Group Component
  const TableHeaderGroup = ({ title, hasMoisture = false }: { title: string, hasMoisture?: boolean }) => (
    <>
      <th className="border-r border-b border-gray-300 px-1 py-1 text-xs font-bold text-gray-700 uppercase tracking-tight bg-gray-50">Product <br /> Name</th>
      <th className="border-r border-b border-gray-300 px-1 py-1 text-xs font-bold text-gray-700 uppercase tracking-tight bg-gray-50">Lot <br /> Number</th>
      
      <th className="border-r border-b border-gray-300 px-1 py-1 text-right bg-gray-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-800">Input</span>
          <span className="text-[10px] font-normal text-gray-500">(kg / %)</span>
        </div>
      </th>
      
      <th className="border-r border-b border-gray-300 px-1 py-1 text-right bg-gray-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-800">Output</span>
          <span className="text-[10px] font-normal text-gray-500">(kg / %)</span>
        </div>
      </th>

      <th className="border-r border-b border-gray-300 p-0 align-top bg-gray-50 min-w-[80px]">
        <div className="border-b border-gray-300 py-1 text-center text-xs font-bold text-gray-700 uppercase tracking-tight">
          Pallet
        </div>
        <div className="flex w-full">
          <div className="w-1/2 py-1 text-center text-[10px] font-bold text-gray-500 border-r border-gray-300">
            No.
          </div>
          <div className="w-1/2 py-1 text-center text-[10px] font-bold text-gray-500">
            Q'ty(kg)
          </div>
        </div>
      </th>

      {hasMoisture && (
        <th className="border-r border-b border-gray-300 px-1 py-1 text-center bg-gray-50">
          <span className="text-xs font-bold text-gray-800">Moisture</span>
          <br/>
          <span className="text-[10px] font-normal text-gray-500">(%)</span>
        </th>
      )}
    </>
  );

  return (
    <div className="w-full bg-white border border-gray-300 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs"> 
          <thead>
            {/* Level 1: Main Headers */}
            <tr className="bg-slate-900 text-white">
              <th className="border-r border-gray-600 p-1 text-center font-bold text-xs w-8" rowSpan={3}>
                No.
              </th>
              <th className="border-r border-gray-600 py-1 px-1 text-center font-bold text-xs uppercase tracking-widest" colSpan={10}>
                Genmatsu A
              </th>
              <th className="border-r border-gray-600 py-1 px-1 text-center font-bold text-xs uppercase tracking-widest" colSpan={6}>
                Genmatsu B
              </th>
              {/* ✅ NEW: Genmatsu Recycle */}
              <th className="py-1 px-1 text-center font-bold text-xs uppercase tracking-widest bg-gray-800" colSpan={2}>
                Genmatsu Recycle
              </th>
            </tr>

            {/* Level 2: Line Headers */}
            <tr className="bg-gray-100 border-b border-gray-300 text-gray-800">
              <th className="border-r border-gray-300 py-1 text-center font-bold text-[11px] uppercase tracking-wide" colSpan={5}>
                Line A
              </th>
              <th className="border-r border-gray-300 py-1 text-center font-bold text-[11px] uppercase tracking-wide" colSpan={5}>
                Line B
              </th>
              <th className="border-r border-gray-300 py-1 text-center font-bold text-[11px] uppercase tracking-wide" colSpan={6}>
                Line C
              </th>
              {/* ✅ NEW: Genmatsu Type */}
              <th className="py-1 text-center font-bold text-[11px] uppercase tracking-wide bg-gray-200" colSpan={2}>
                Genmatsu Type
              </th>
            </tr>

            {/* Level 3: Column Headers */}
            <tr className="border-b border-gray-300">
              <TableHeaderGroup title="Line A" />
              <TableHeaderGroup title="Line B" />
              <TableHeaderGroup title="Line C" hasMoisture={true} />
              
              {/* ✅ NEW: Lot no. & - */}
              <th className="border-r border-b border-gray-300 px-1 py-1 text-center text-xs font-bold text-gray-700 uppercase bg-gray-50">
                Lot no.
              </th>
              {/* ✅ ปรับความกว้างตรงนี้: เพิ่ม min-w-[100px] */}
              <th className="border-b border-gray-300 px-1 py-1 text-center text-xs font-bold text-gray-700 uppercase bg-gray-50 min-w-[100px]">
                -
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {maxRows === 0 ? (
              <tr>
                <td colSpan={19} className="text-center py-6">
                  <span className="text-sm text-gray-400">No Data Available</span>
                </td>
              </tr>
            ) : (
              <>
                {/* Data Rows */}
                {Array.from({ length: maxRows }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-gray-300 transition-colors">
                    <td className="border-r border-gray-300 p-1 text-center font-bold text-gray-500 bg-gray-50 align-top text-xs">
                      {index + 1}
                    </td>
                    {renderDataCells(data.lineA[index], false)}
                    {renderDataCells(data.lineB[index], false)}
                    {renderDataCells(data.lineC[index], true)}
                    
                    {/* ✅ NEW: Empty Cells for Genmatsu Recycle */}
                    <td className="border-r border-b border-gray-300 p-1"></td>
                    <td className="border-b border-gray-300 p-1"></td>
                  </tr>
                ))}

                {/* ✅ Total Row */}
                <tr className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                  <td className="border-r border-b border-gray-400 bg-slate-800 p-1"></td>
                  {renderTotalCells(data.lineA, false)}
                  {renderTotalCells(data.lineB, false)}
                  {renderTotalCells(data.lineC, true)}
                  
                  {/* ✅ NEW: Empty Total Cells for Genmatsu Recycle */}
                  <td className="border-r border-b border-gray-400 bg-gray-100"></td>
                  <td className="border-b border-gray-400 bg-gray-100"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyReportTable;