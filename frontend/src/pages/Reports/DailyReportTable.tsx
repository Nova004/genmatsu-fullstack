// frontend/src/pages/Reports/DailyReportTable.tsx

import React, { useState, useEffect } from 'react';
import { FaPen, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios'; // ✅ 1. เพิ่ม axios

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
  selectedDate: string;
}

const DailyReportTable: React.FC<DailyReportTableProps> = ({ data, onUpdateStPlan, selectedDate }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempStValue, setTempStValue] = useState<string>("");

  const [recycleLotHeader, setRecycleLotHeader] = useState<string>("-"); // ค่า Lot (เช่น 5323)
  const [isEditingRecycleHeader, setIsEditingRecycleHeader] = useState<boolean>(false);
  const [tempRecycleHeader, setTempRecycleHeader] = useState<string>(""); // ค่าชั่วคราวตอนพิมพ์

  const [genmatsuTypeHeader, setGenmatsuTypeHeader] = useState<string>("Genmatsu Type");
  const [isEditingGenmatsuType, setIsEditingGenmatsuType] = useState<boolean>(false);
  const [tempGenmatsuType, setTempGenmatsuType] = useState<string>("");

  const [recycleValues, setRecycleValues] = useState<{ kg: string; percent: string }[]>(
    Array(8).fill({ kg: "", percent: "" })
  );

  // ✅ [ใหม่] State สำหรับเก็บค่าสรุปท้ายตารางของ Genmatsu Recycle
  const [recycleTotalPacking, setRecycleTotalPacking] = useState<string>(""); // สำหรับ Packing result
  const [recycleTotalDiff, setRecycleTotalDiff] = useState<string>("");    // สำหรับ Output - Input

  const handleRecycleValueChange = (index: number, field: 'kg' | 'percent', value: string) => {
    const newValues = [...recycleValues];
    // อัปเดตเฉพาะค่าที่เปลี่ยน (field) ของแถวนั้น (index)
    newValues[index] = { ...newValues[index], [field]: value };
    setRecycleValues(newValues);
  };

  const [remarks, setRemarks] = useState({
    lineA: "",
    lineB: "",
    lineC: "",
    recycle: ""
  });

  // ✅ 3.1 Fetch Data: โหลดข้อมูลเมื่อวันที่ (selectedDate) เปลี่ยน
  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedDate) return;
      try {
        // ยิงไปที่ Route ที่เราคุยกันไว้ (ผ่าน submission routes)
        const res = await axios.get(`/genmatsu/api/submissions/reports/summary`, {
          params: { date: selectedDate }
        });

        if (res.data) {
          // ถ้ามีข้อมูลเก่า -> เอามาใส่ State
          const loaded = res.data;
          setRemarks(loaded.remarks || { lineA: "", lineB: "", lineC: "", recycle: "" });
          setRecycleValues(loaded.recycleValues || Array(8).fill({ kg: "", percent: "" }));
          setRecycleTotalPacking(loaded.recycleTotalPacking || "");
          setRecycleTotalDiff(loaded.recycleTotalDiff || "");
          setGenmatsuTypeHeader(loaded.genmatsuTypeHeader || "Genmatsu Type");
          setRecycleLotHeader(loaded.recycleLotHeader || "-");
        } else {
          // ถ้าไม่มีข้อมูล (วันใหม่) -> Reset ค่าเป็นว่าง
          setRemarks({ lineA: "", lineB: "", lineC: "", recycle: "" });
          setRecycleValues(Array(8).fill({ kg: "", percent: "" }));
          setRecycleTotalPacking("");
          setRecycleTotalDiff("");
          setGenmatsuTypeHeader("Genmatsu Type");
          setRecycleLotHeader("-");
        }
      } catch (error) {
        console.error("Error loading daily summary:", error);
      }
    };

    fetchSummary();
  }, [selectedDate]);

  // ✅ 3.2 Save Data: ฟังก์ชันบันทึกข้อมูล
  const handleSaveSummary = async () => {

    if (!selectedDate) {
      alert("กรุณาเลือกวันที่ก่อน (Please select a date)");
      return;
    }

    try {
      const summaryData = {
        remarks,
        recycleValues,
        recycleTotalPacking,
        recycleTotalDiff,
        genmatsuTypeHeader,
        recycleLotHeader
      };

      await axios.post(`/genmatsu/api/submissions/reports/summary`, {
        date: selectedDate,
        summaryData
      });

      alert("Saved Remarks & Recycle Data successfully!");
    } catch (error) {
      console.error("Error saving summary:", error);
      alert("Failed to save summary.");
    }
  };

  const handleRemarkChange = (line: keyof typeof remarks, value: string) => {
    setRemarks(prev => ({ ...prev, [line]: value }));
  };

  // ✅ 1. รายการข้อความตายตัวสำหรับ Genmatsu Recycle (8 รายการ)
  const recycleLabels = [
    "Input",
    "Output",
    "Gen-A",
    "Gen-B",
    "Film",
    "Dust",
    "Cleaning",
    "PE Bag"
  ];

  // ✅ 2. ปรับสูตรคำนวณแถว: ต้องมีอย่างน้อย 8 แถว เพื่อให้ Label ครบ
  const maxRows = Math.max(
    data.lineA.length,
    data.lineB.length,
    data.lineC.length,
    recycleLabels.length // เทียบกับ 8 เสมอ
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

  // --- Recycle Header Handlers ---
  const handleStartEditRecycleHeader = () => {
    setTempRecycleHeader(recycleLotHeader);
    setIsEditingRecycleHeader(true);
  };

  const handleCancelEditRecycleHeader = () => {
    setIsEditingRecycleHeader(false);
    setTempRecycleHeader("");
  };

  const handleSaveEditRecycleHeader = () => {
    if (tempRecycleHeader.trim() !== "") {
      setRecycleLotHeader(tempRecycleHeader); // บันทึกลง State (เรื่อง API ว่ากันทีหลัง)
    }
    setIsEditingRecycleHeader(false);
  };


  // Genmatsu Type Handlers
  const handleStartEditGenmatsuType = () => {
    setTempGenmatsuType(genmatsuTypeHeader);
    setIsEditingGenmatsuType(true);
  };

  const handleCancelEditGenmatsuType = () => {
    setIsEditingGenmatsuType(false);
    setTempGenmatsuType("");
  };

  const handleSaveEditGenmatsuType = () => {
    if (tempGenmatsuType.trim() !== "") {
      setGenmatsuTypeHeader(tempGenmatsuType);
    }
    setIsEditingGenmatsuType(false);
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
          <br />
          <span className="text-[10px] font-normal text-gray-500">(%)</span>
        </th>
      )}
    </>
  );

  return (
    <div className="w-full bg-white border border-gray-300 shadow-sm overflow-hidden">
      {/* ✅ 4. UI: แถบ Header และปุ่ม Save */}
      <div className="flex justify-between items-center bg-slate-100 p-2 border-b border-gray-300">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Summary Data for: <span className="text-black">{selectedDate || "No date selected"}</span>
        </div>
        <button
          onClick={handleSaveSummary}
          className="bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <FaSave size={12} /> Save Remarks & Recycle Data
        </button>
      </div>
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
              {/* ✅ Genmatsu Recycle */}
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
              {/* ✅ แก้ไข: Interactive Header (Click to Edit) */}
              <th className="py-1 text-center font-bold text-[11px] uppercase tracking-wide bg-gray-200 relative group" colSpan={2}>
                {isEditingGenmatsuType ? (
                  // โหมดแก้ไข
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={tempGenmatsuType}
                      onChange={(e) => setTempGenmatsuType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditGenmatsuType();
                        if (e.key === 'Escape') handleCancelEditGenmatsuType();
                      }}
                      className="w-24 text-center text-[11px] border-b border-blue-500 outline-none bg-white px-1 text-gray-800"
                      autoFocus
                    />
                    <button onClick={handleSaveEditGenmatsuType} className="text-green-600 hover:text-green-800"><FaCheck size={10} /></button>
                    <button onClick={handleCancelEditGenmatsuType} className="text-red-500 hover:text-red-700"><FaTimes size={10} /></button>
                  </div>
                ) : (
                  // โหมดปกติ
                  <div
                    className="flex items-center justify-center gap-1 cursor-pointer w-full h-full"
                    onClick={handleStartEditGenmatsuType}
                  >
                    <span>{genmatsuTypeHeader}</span>
                    <FaPen size={8} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </th>
            </tr>

            {/* Level 3: Column Headers */}
            <tr className="border-b border-gray-300">
              <TableHeaderGroup title="Line A" />
              <TableHeaderGroup title="Line B" />
              <TableHeaderGroup title="Line C" hasMoisture={true} />

              {/* ✅ Genmatsu Recycle Columns */}
              <th className="border-r border-b border-gray-300 px-1 py-1 text-center text-xs font-bold text-gray-700 uppercase bg-gray-50">
                Lot <br /> Number
              </th>
              {/* ✅ แก้ไข: Interactive Header (Click to Edit) */}
              <th className="border-b border-gray-300 px-1 py-1 text-center text-xs font-bold text-gray-700 uppercase bg-gray-50 min-w-[100px] relative group">
                {isEditingRecycleHeader ? (
                  // โหมดแก้ไข: แสดง Input + ปุ่ม Save/Cancel
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={tempRecycleHeader}
                      onChange={(e) => setTempRecycleHeader(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditRecycleHeader();
                        if (e.key === 'Escape') handleCancelEditRecycleHeader();
                      }}
                      className="w-16 text-center text-xs border-b border-blue-500 outline-none bg-white px-1"
                      autoFocus
                    />
                    <button onClick={handleSaveEditRecycleHeader} className="text-green-600 hover:text-green-800"><FaCheck size={10} /></button>
                    <button onClick={handleCancelEditRecycleHeader} className="text-red-500 hover:text-red-700"><FaTimes size={10} /></button>
                  </div>
                ) : (
                  // โหมดปกติ: แสดงค่า + ไอคอนดินสอ (โผล่ตอน Hover)
                  <div
                    className="flex items-center justify-center gap-1 cursor-pointer w-full h-full"
                    onClick={handleStartEditRecycleHeader}
                  >
                    <span>{recycleLotHeader}</span>
                    <FaPen size={8} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
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

                    {/* ✅ Genmatsu Recycle: Lot No. Labels (ครบ 8 แถวเสมอ) */}
                    <td className="border-r border-b border-gray-300 p-1 text-left text-xs font-bold text-gray-700 bg-gray-50 align-top">
                      {recycleLabels[index] || ""}
                    </td>
                    {/* ✅ แก้ไข: Genmatsu Recycle Data Column พร้อมหน่วยวัดตามหลัง (kg / %) */}
                    <td className="border-b border-gray-300 p-1 align-top bg-white min-w-[110px]">
                      {/* แสดง Input เฉพาะ 8 แถวแรกที่มีหัวข้อ */}
                      {index < 8 && (
                        <div className="flex flex-col gap-1 h-full justify-center">

                          {/* บรรทัดบน: ใส่เลข Kg */}
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              placeholder="0.00"
                              value={recycleValues[index]?.kg || ""}
                              onChange={(e) => handleRecycleValueChange(index, 'kg', e.target.value)}
                              className="w-full text-right text-xs font-bold text-gray-800 border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent pr-5 pl-1 placeholder-gray-300"
                            />
                            {/* หน่วยวัด kg (แสดงเมื่อมีข้อมูล) */}
                            {recycleValues[index]?.kg && (
                              <span className="absolute right-0 text-[10px] text-gray-400 font-normal">kg</span>
                            )}
                          </div>

                          {/* บรรทัดล่าง: ใส่ % */}
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              placeholder="0.00"
                              value={recycleValues[index]?.percent || ""}
                              onChange={(e) => handleRecycleValueChange(index, 'percent', e.target.value)}
                              className="w-full text-right text-[11px] font-semibold text-blue-600 border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent pr-5 pl-1 placeholder-gray-300"
                            />
                            {/* หน่วยวัด % (แสดงเมื่อมีข้อมูล) */}
                            {recycleValues[index]?.percent && (
                              <span className="absolute right-0 text-[10px] text-blue-300 font-normal">%</span>
                            )}
                          </div>

                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* ✅ Total Row */}
                <tr className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                  <td className="border-r border-b border-gray-400 bg-slate-800 p-1"></td>
                  {renderTotalCells(data.lineA, false)}
                  {renderTotalCells(data.lineB, false)}
                  {renderTotalCells(data.lineC, true)}

                  {/* ✅ แก้ไข: ช่องสรุปท้ายตาราง Genmatsu Recycle (2 บรรทัด แก้ไขได้) */}
                  <td colSpan={2} className="border-b border-gray-400 bg-gray-100 p-1.5 min-w-[180px]">
                    <div className="flex flex-col gap-1">

                      {/* บรรทัดที่ 1: Packing result */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-600 font-bold">
                        <span className="whitespace-nowrap">Packing result =</span>
                        <input
                          type="number"
                          value={recycleTotalPacking}
                          onChange={(e) => setRecycleTotalPacking(e.target.value)}
                          className="w-16 text-right border-b border-gray-400 bg-transparent outline-none focus:border-blue-500 text-gray-900"
                          placeholder="0"
                        />
                        <span>cans.</span>
                      </div>

                      {/* บรรทัดที่ 2: Output - Input */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-600 font-bold">
                        <span className="whitespace-nowrap">Out put - In put =</span>
                        <span className="text-red-500">-</span>
                        <input
                          type="number"
                          value={recycleTotalDiff}
                          onChange={(e) => setRecycleTotalDiff(e.target.value)}
                          className="w-16 text-right border-b border-gray-400 bg-transparent outline-none focus:border-blue-500 text-red-600"
                          placeholder="0.00"
                        />
                        <span>kg.</span>
                      </div>

                    </div>
                  </td>
                </tr>

                {/* ✅ ปรับปรุงใหม่: เพิ่มขนาดตัวหนังสือในแถวหมายเหตุ (Remark Row) */}
                <tr className="bg-slate-50/50">
                  <td className="border-r border-b border-gray-300 p-1 text-center font-extrabold text-slate-500 bg-slate-100 text-[10px] uppercase tracking-tighter">
                    Remark
                  </td>

                  {/* Remark Line A */}
                  <td colSpan={5} className="border-r border-b border-gray-300 p-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-blue-600 uppercase">Line A Remark</span>
                      <textarea
                        value={remarks.lineA}
                        onChange={(e) => handleRemarkChange('lineA', e.target.value)}
                        placeholder="Type here..."
                        // ปรับจาก text-[10px] เป็น text-xs เพื่อให้ตัวใหญ่ขึ้น
                        className="w-full text-xs p-1.5 outline-none bg-white border border-dashed border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded shadow-sm resize-none leading-normal font-medium text-gray-800"
                        rows={2}
                      />
                    </div>
                  </td>

                  {/* Remark Line B */}
                  <td colSpan={5} className="border-r border-b border-gray-300 p-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase">Line B Remark</span>
                      <textarea
                        value={remarks.lineB}
                        onChange={(e) => handleRemarkChange('lineB', e.target.value)}
                        placeholder="Type here..."
                        className="w-full text-xs p-1.5 outline-none bg-white border border-dashed border-slate-300 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 rounded shadow-sm resize-none leading-normal font-medium text-gray-800"
                        rows={2}
                      />
                    </div>
                  </td>

                  {/* Remark Line C */}
                  <td colSpan={6} className="border-r border-b border-gray-300 p-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-amber-600 uppercase">Line C Remark</span>
                      <textarea
                        value={remarks.lineC}
                        onChange={(e) => handleRemarkChange('lineC', e.target.value)}
                        placeholder="Type here..."
                        className="w-full text-xs p-1.5 outline-none bg-white border border-dashed border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 rounded shadow-sm resize-none leading-normal font-medium text-gray-800"
                        rows={2}
                      />
                    </div>
                  </td>

                  {/* Remark Genmatsu Recycle */}
                  <td colSpan={2} className="border-b border-gray-300 p-1.5 bg-slate-100/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Recycle Remark</span>
                      <textarea
                        value={remarks.recycle}
                        onChange={(e) => handleRemarkChange('recycle', e.target.value)}
                        placeholder="..."
                        className="w-full text-xs p-1.5 outline-none bg-white border border-dashed border-slate-300 focus:border-slate-400 rounded shadow-sm resize-none leading-normal font-medium text-gray-800"
                        rows={2}
                      />
                    </div>
                  </td>
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