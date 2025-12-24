import React, { useState, useEffect } from 'react';
import { FaPen, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios';
import { ReportData, ProductionRecord, RecycleValue } from '../../types/report'; // ✅ Import Types
import DailyReportRow from './components/DailyReportRow'; // ✅ Import Row Component

interface DailyReportTableProps {
  data: ReportData;
  onUpdateStPlan?: (id: number, newValue: number) => void;
  selectedDate: string;
  selectedLotNo?: string;
  mode?: 'normal' | 'ze1a';
  hideZE1A?: boolean; // รับค่าสั่งซ่อน/แสดง ZE-1A
}

const DailyReportTable: React.FC<DailyReportTableProps> = ({
  data,
  onUpdateStPlan,
  selectedDate,
  selectedLotNo,
  mode = 'normal',
  hideZE1A = false
}) => {
  // --- States ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempStValue, setTempStValue] = useState<string>("");

  // Recycle Data
  const [recycleValues, setRecycleValues] = useState<RecycleValue[]>(
    Array(8).fill({ kg: "", percent: "" })
  );

  // Remarks
  const [remarks, setRemarks] = useState({
    lineA: "",
    lineB: "",
    lineC: "",
    recycle: "",
    lineZE1A: ""
  });

  // Header Titles (Editable)
  const [recycleLotHeader, setRecycleLotHeader] = useState<string>("-");
  const [genmatsuTypeHeader, setGenmatsuTypeHeader] = useState<string>("Genmatsu Type");

  // Recycle Summary Inputs
  const [recycleTotalPacking, setRecycleTotalPacking] = useState<string>("");
  const [recycleTotalDiff, setRecycleTotalDiff] = useState<string>("");

  // Edit States for Headers
  const [isEditingRecycleHeader, setIsEditingRecycleHeader] = useState(false);
  const [tempRecycleHeader, setTempRecycleHeader] = useState("");
  const [isEditingGenmatsuType, setIsEditingGenmatsuType] = useState(false);
  const [tempGenmatsuType, setTempGenmatsuType] = useState("");

  // --- Effects: Load Summary Data ---
  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedDate) return;
      try {
        const res = await axios.get(`/genmatsu/api/submissions/reports/summary`, {
          params: { date: selectedDate }
        });

        if (res.data) {
          const loaded = res.data;
          setRemarks(prev => ({ ...prev, ...loaded.remarks }));
          setRecycleValues(loaded.recycleValues || Array(8).fill({ kg: "", percent: "" }));
          setRecycleTotalPacking(loaded.recycleTotalPacking || "");
          setRecycleTotalDiff(loaded.recycleTotalDiff || "");
          setGenmatsuTypeHeader(loaded.genmatsuTypeHeader || "Genmatsu Type");
          setRecycleLotHeader(loaded.recycleLotHeader || "-");
        } else {
          // Reset Values if no data found
          setRemarks({ lineA: "", lineB: "", lineC: "", recycle: "", lineZE1A: "" });
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

  // --- Handlers ---
  const handleSaveSummary = async () => {
    if (!selectedDate) return alert("Please select a date first.");
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

  const handleRecycleValueChange = (index: number, field: 'kg' | 'percent', value: string) => {
    const newValues = [...recycleValues];
    newValues[index] = { ...newValues[index], [field]: value };
    setRecycleValues(newValues);
  };

  const handleRemarkChange = (line: string, value: string) => {
    setRemarks(prev => ({ ...prev, [line]: value }));
  };

  const handleStartEdit = (item: ProductionRecord) => {
    if (!onUpdateStPlan) return;
    setEditingId(item.id);
    setTempStValue(item.stPlan?.toString() || "0");
  };

  const handleSaveEdit = (id: number) => {
    if (onUpdateStPlan) {
      const numValue = parseFloat(tempStValue);
      if (!isNaN(numValue)) onUpdateStPlan(id, numValue);
    }
    setEditingId(null);
  };

  // Header Edit Handlers
  const saveRecycleHeader = () => { if (tempRecycleHeader.trim()) setRecycleLotHeader(tempRecycleHeader); setIsEditingRecycleHeader(false); };
  const saveGenmatsuType = () => { if (tempGenmatsuType.trim()) setGenmatsuTypeHeader(tempGenmatsuType); setIsEditingGenmatsuType(false); };

  // --- Helpers ---
  const calculateTotals = (records: ProductionRecord[]) => {
    if (!records) return { input: 0, output: 0, yield: 0, moisture: 0 };
    const totalInput = records.reduce((sum, item) => sum + (item.input || 0), 0);
    const totalOutput = records.reduce((sum, item) => sum + (item.output || 0), 0);
    const totalYield = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

    const validMoisture = records.filter(r => r.moisture != null);
    const avgMoisture = validMoisture.length > 0
      ? validMoisture.reduce((sum, r) => sum + (r.moisture || 0), 0) / validMoisture.length
      : 0;

    return { input: totalInput, output: totalOutput, yield: totalYield, moisture: avgMoisture };
  };

  // Sub-component for Headers (Reusable)
  const TableHeaderGroup = ({ title, hasMoisture = false }: { title: string, hasMoisture?: boolean }) => (
    <>
      <th className="border-r border-b border-gray-300 px-1 py-1 text-xs font-extrabold text-gray-800 uppercase tracking-tight bg-gray-100">Product<br />Name</th>
      <th className="border-r border-b border-gray-300 px-1 py-1 text-xs font-extrabold text-gray-800 uppercase tracking-tight bg-gray-100">Lot<br />No.</th>
      <th className="border-r border-b border-gray-300 px-1 py-1 text-right bg-gray-100"><span className="text-xs font-extrabold text-gray-900">Input</span><span className="text-[10px] text-gray-500">(kg)</span></th>
      <th className="border-r border-b border-gray-300 px-1 py-1 text-right bg-gray-100"><span className="text-xs font-extrabold text-gray-900">Output</span><span className="text-[10px] text-gray-500">(kg)</span></th>
      <th className="border-r border-b border-gray-300 p-0 align-top bg-gray-100 min-w-[80px]">
        <div className="border-b border-gray-300 py-0.5 text-center text-xs font-extrabold text-gray-800 uppercase">Pallet</div>
        <div className="flex w-full"><div className="w-1/2 py-0.5 text-center text-[10px] text-gray-600 border-r border-gray-300">No.</div><div className="w-1/2 py-0.5 text-center text-[10px] text-gray-600">Qty</div></div>
      </th>
      {hasMoisture && <th className="border-r border-b border-gray-300 px-1 py-1 text-center bg-gray-100"><span className="text-xs font-extrabold text-gray-900">Mois.</span><br /><span className="text-[10px] text-gray-500">(%)</span></th>}
    </>
  );

  const renderTotalCells = (records: ProductionRecord[], isLineC: boolean = false) => {
    const totals = calculateTotals(records || []);
    return (
      <>
        <td colSpan={2} className="border-r border-b border-gray-400 bg-slate-800 px-2 py-0.5 text-right"><span className="text-xs font-extrabold text-white uppercase tracking-widest">Total</span></td>
        <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-0.5 text-right"><span className="text-lg font-black">{totals.input.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
        <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-0.5 text-right"><span className="text-lg font-black">{totals.output.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
        <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-0.5 text-right">
          <div className="flex flex-col justify-center items-end">
            <span className={`text-lg font-black ${totals.yield < 95 ? 'text-red-700' : 'text-green-700'}`}>{totals.yield.toFixed(2)}%</span>
            <span className="text-[9px] font-bold text-gray-600 uppercase">Yield</span>
          </div>
        </td>
        {isLineC && <td className="border-r border-b border-gray-400 bg-gray-100 px-1 py-0.5 text-right">{totals.moisture > 0 ? <span className="text-lg font-black">{totals.moisture.toFixed(2)}%</span> : null}</td>}
      </>
    );
  };

  const recycleLabels = ["Input", "Output", "Gen-A", "Gen-B", "Film", "Dust", "Cleaning", "PE Bag"];

  // Calculate max rows for Main Table
  const maxRows = mode === 'ze1a'
    ? (data.lineZE1A ? data.lineZE1A.length : 0)
    : Math.max(data.lineA.length, data.lineB.length, data.lineC.length, recycleLabels.length);

  // ------------------------------------------
  // 🅰️ RENDER: ZE-1A Mode (สำหรับหน้า 2)
  // ------------------------------------------
  if (mode === 'ze1a') {
    return (
      <div className="w-full bg-white border border-gray-400 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
             <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border-r border-gray-600 p-1 w-8" rowSpan={3}>No.</th>
                  <th className="p-1 uppercase tracking-widest" colSpan={5}>Genmatsu ZE-1A</th>
                </tr>

                {/* 👇 เพิ่ม Line D ตรงนี้เหมือนกัน 👇 */}
                <tr className="bg-gray-200 border-b border-gray-300 text-gray-900">
                  <th className="border-r border-gray-300 py-1 text-center font-extrabold text-xs uppercase tracking-wide" colSpan={5}>
                    Line D
                  </th>
                </tr>

                <tr className="border-b border-gray-300">
                  <TableHeaderGroup title="Line ZE-1A" hasMoisture={false} />
                </tr>
              </thead>
            <tbody className="bg-white">
              {maxRows === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No ZE-1A Data Available</td></tr>
              ) : (
                <>
                  {Array.from({ length: maxRows }).map((_, index) => (
                    // ✅ ใช้ DailyReportRow พร้อม props "isSingleLine"
                    <DailyReportRow
                      key={index}
                      index={index}
                      itemC={data.lineZE1A?.[index]} // ข้อมูลใส่ช่อง itemC
                      isSingleLine={true}            // บอกว่าขอแถวเดียว
                      editingId={editingId}
                      tempStValue={tempStValue}
                      setTempStValue={setTempStValue}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingId(null)}
                    />
                  ))}
                  <tr className="border-t-2 border-gray-500 bg-gray-100 font-bold">
                    <td className="border-r border-b border-gray-400 bg-slate-800 p-1"></td>
                    {renderTotalCells(data.lineZE1A || [], false)}
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border-r border-b border-gray-300 p-1 bg-slate-200"></td>
                    <td colSpan={6} className="border-r border-b border-gray-300 p-1">
                      <span className="text-[10px] font-extrabold text-green-700 uppercase">Line ZE-1A Remark</span>
                      <textarea
                        value={remarks.lineZE1A}
                        onChange={e => handleRemarkChange('lineZE1A', e.target.value)}
                        className="w-full text-xs p-1 border border-dashed border-slate-300 rounded resize-none"
                        rows={2}
                        placeholder="Type remark..."
                      />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // 🅱️ RENDER: Normal Mode (สำหรับหน้า 1)
  // ------------------------------------------
  return (
    <div className="w-full bg-white border border-gray-400 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-slate-100 p-2 border-b border-gray-300 print:hidden">
        <div className="text-sm font-bold text-gray-600 uppercase tracking-wider">Summary Data: <span className="text-black font-black">{selectedDate || "-"}</span></div>
        <button onClick={handleSaveSummary} className="bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700 text-xs font-bold flex items-center gap-2"><FaSave /> Save Data</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* ... Complex Header Structure ... */}
            <tr className="bg-slate-900 text-white">
              <th className="border-r border-gray-600 p-1 text-center font-bold text-xs w-8" rowSpan={3}>No.</th>
              <th className="border-r border-gray-600 py-1 px-1 text-center font-bold text-sm uppercase tracking-widest" colSpan={10}>Genmatsu A</th>
              <th className="border-r border-gray-600 py-1 px-1 text-center font-bold text-sm uppercase tracking-widest" colSpan={6}>Genmatsu B</th>
              <th className="py-1 px-1 text-center font-bold text-sm uppercase tracking-widest bg-gray-800" colSpan={2}>Recycle</th>
            </tr>
            <tr className="bg-gray-200 border-b border-gray-300 text-gray-900">
              <th className="border-r border-gray-300 py-1 font-extrabold uppercase" colSpan={5}>Line A</th>
              <th className="border-r border-gray-300 py-1 font-extrabold uppercase" colSpan={5}>Line B</th>
              <th className="border-r border-gray-300 py-1 font-extrabold uppercase" colSpan={6}>Line C</th>
              {/* Type Input */}
              <th className="py-1 font-extrabold uppercase bg-gray-300 cursor-pointer" colSpan={2} onClick={() => { setTempGenmatsuType(genmatsuTypeHeader); setIsEditingGenmatsuType(true); }}>
                {isEditingGenmatsuType ? (
                  <div className="flex items-center justify-center gap-1">
                    <input autoFocus value={tempGenmatsuType} onChange={e => setTempGenmatsuType(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveGenmatsuType(); if (e.key === 'Escape') setIsEditingGenmatsuType(false); }} className="w-24 text-center text-xs font-bold bg-white border-b border-blue-500 outline-none" />
                    <button onClick={saveGenmatsuType} className="text-green-600"><FaCheck size={10} /></button>
                  </div>
                ) : genmatsuTypeHeader}
              </th>
            </tr>
            <tr className="border-b border-gray-300">
              <TableHeaderGroup title="Line A" />
              <TableHeaderGroup title="Line B" />
              <TableHeaderGroup title="Line C" hasMoisture={true} />

              <th className="border-r border-b border-gray-300 px-1 py-1 text-center font-extrabold bg-gray-100">Lot No.</th>
              <th className="border-b border-gray-300 px-1 py-1 text-center font-extrabold bg-gray-100 cursor-pointer min-w-[100px]" onClick={() => { setTempRecycleHeader(recycleLotHeader); setIsEditingRecycleHeader(true); }}>
                {isEditingRecycleHeader ? (
                  <div className="flex items-center justify-center gap-1">
                    <input autoFocus value={tempRecycleHeader} onChange={e => setTempRecycleHeader(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRecycleHeader(); if (e.key === 'Escape') setIsEditingRecycleHeader(false); }} className="w-16 text-center text-xs font-bold bg-white border-b border-blue-500 outline-none" />
                    <button onClick={saveRecycleHeader} className="text-green-600"><FaCheck size={10} /></button>
                  </div>
                ) : recycleLotHeader}
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {maxRows === 0 ? (
              <tr><td colSpan={19} className="text-center py-6 text-gray-400">No Data Available</td></tr>
            ) : (
              <>
                {/* ✅ ใช้ DailyReportRow แบบปกติ (ไม่มี isSingleLine) */}
                {Array.from({ length: maxRows }).map((_, index) => (
                  <DailyReportRow
                    key={index}
                    index={index}
                    itemA={data.lineA[index]}
                    itemB={data.lineB[index]}
                    itemC={data.lineC[index]}
                    recycleLabel={recycleLabels[index]}
                    recycleValue={recycleValues[index]}
                    onRecycleChange={handleRecycleValueChange}
                    editingId={editingId}
                    tempStValue={tempStValue}
                    setTempStValue={setTempStValue}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}

                {/* Total Row */}
                <tr className="border-t-2 border-gray-500 bg-gray-100 font-bold">
                  <td className="border-r border-b border-gray-400 bg-slate-800 p-1"></td>
                  {renderTotalCells(data.lineA)}
                  {renderTotalCells(data.lineB)}
                  {renderTotalCells(data.lineC, true)}
                  <td colSpan={2} className="border-b border-gray-400 bg-gray-200 p-1 text-right text-[11px] font-extrabold">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-end gap-1">Packing result = <input type="number" value={recycleTotalPacking} onChange={e => setRecycleTotalPacking(e.target.value)} className="w-10 text-right bg-transparent border-b border-gray-500 outline-none" placeholder="0" /> cans.</div>
                      <div className="flex items-center justify-end gap-1">Output - Input = <span className="text-red-600">-</span><input type="number" value={recycleTotalDiff} onChange={e => setRecycleTotalDiff(e.target.value)} className="w-10 text-right text-red-600 bg-transparent border-b border-gray-500 outline-none" placeholder="0.00" /> kg.</div>
                    </div>
                  </td>
                </tr>

                {/* Remark Row */}
                <tr className="bg-slate-50">
                  <td className="border-r border-b border-gray-300 p-1 bg-slate-200"></td>
                  <td colSpan={5} className="border-r border-b border-gray-300 p-1"><span className="text-[10px] font-extrabold text-blue-700 uppercase">Line A Remark</span><textarea value={remarks.lineA} onChange={e => handleRemarkChange('lineA', e.target.value)} className="w-full text-xs p-1 border border-dashed border-slate-300 rounded resize-none" rows={2} /></td>
                  <td colSpan={5} className="border-r border-b border-gray-300 p-1"><span className="text-[10px] font-extrabold text-indigo-700 uppercase">Line B Remark</span><textarea value={remarks.lineB} onChange={e => handleRemarkChange('lineB', e.target.value)} className="w-full text-xs p-1 border border-dashed border-slate-300 rounded resize-none" rows={2} /></td>
                  <td colSpan={6} className="border-r border-b border-gray-300 p-1"><span className="text-[10px] font-extrabold text-amber-700 uppercase">Line C Remark</span><textarea value={remarks.lineC} onChange={e => handleRemarkChange('lineC', e.target.value)} className="w-full text-xs p-1 border border-dashed border-slate-300 rounded resize-none" rows={2} /></td>
                  <td colSpan={2} className="border-b border-gray-300 p-1 bg-slate-100"><span className="text-[10px] font-extrabold text-slate-600 uppercase">Recycle Remark</span><textarea value={remarks.recycle} onChange={e => handleRemarkChange('recycle', e.target.value)} className="w-full text-xs p-1 border border-dashed border-slate-300 rounded resize-none" rows={2} /></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Logic for showing ZE-1A at bottom (Page 1 Web View) */}
      {data.lineZE1A && data.lineZE1A.length > 0 && !hideZE1A && (
        <div className="mt-8 border-t-4 border-gray-500 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border-r border-gray-600 p-1 w-8" rowSpan={3}>No.</th>
                  <th className="p-1 uppercase tracking-widest" colSpan={5}>Genmatsu ZE-1A</th>
                </tr>

                {/* 👇 เพิ่ม Line D ตรงนี้เหมือนกัน 👇 */}
                <tr className="bg-gray-200 border-b border-gray-300 text-gray-900">
                  <th className="border-r border-gray-300 py-1 text-center font-extrabold text-xs uppercase tracking-wide" colSpan={5}>
                    Line D
                  </th>
                </tr>

                <tr className="border-b border-gray-300">
                  <TableHeaderGroup title="Line ZE-1A" hasMoisture={false} />
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.lineZE1A.map((_, index) => (
                  // ✅ ใช้ DailyReportRow แบบ Single Line (เหมือนโหมด ZE-1A)
                  <DailyReportRow
                    key={index}
                    index={index}
                    itemC={data.lineZE1A?.[index]} // ข้อมูลใส่ช่อง itemC
                    isSingleLine={true}            // บอกว่าขอแถวเดียว
                    editingId={editingId}
                    tempStValue={tempStValue}
                    setTempStValue={setTempStValue}
                    onStartEdit={handleStartEdit}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}
                <tr className="border-t-2 border-gray-500 bg-gray-100 font-bold"><td className="border-r border-b border-gray-400 bg-slate-800 p-1"></td>{renderTotalCells(data.lineZE1A, false)}</tr>
                <tr className="bg-slate-50">
                  <td className="border-r border-b border-gray-300 p-1 bg-slate-200"></td>
                  <td colSpan={6} className="border-r border-b border-gray-300 p-1">
                    <span className="text-[10px] font-extrabold text-green-700 uppercase">Line ZE-1A Remark</span>
                    <textarea
                      value={remarks.lineZE1A}
                      onChange={e => handleRemarkChange('lineZE1A', e.target.value)}
                      className="w-full text-xs p-1 border border-dashed border-slate-300 rounded resize-none"
                      rows={2}
                      placeholder="Type remark..."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportTable;