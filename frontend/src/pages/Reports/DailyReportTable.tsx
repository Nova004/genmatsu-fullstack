// frontend/src/pages/Reports/DailyReportTable.tsx

import React, { useState, useEffect } from 'react';
import { FaPen, FaTimes, FaSave } from 'react-icons/fa';
import axios from 'axios';
import { ReportData, ProductionRecord } from '../../types/report';
import DailyReportRow from './components/DailyReportRow';

interface DailyReportTableProps {
  data: ReportData;
  onUpdateStPlan?: (id: number, newValue: number) => void;
  selectedDate: string;
  selectedLotNo?: string;
  mode?: 'normal' | 'lineD'; // ✅ เปลี่ยนชื่อ Mode เป็น lineD
  hideLineD?: boolean;       // ✅ เปลี่ยนชื่อ Prop เป็น hideLineD
}

const DailyReportTable: React.FC<DailyReportTableProps> = ({
  data,
  onUpdateStPlan,
  selectedDate,
  selectedLotNo,
  mode = 'normal',
  hideLineD = false
}) => {
  // --- States ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempStValue, setTempStValue] = useState<string>("");

  // Recycle Data


  // Remarks
  const [remarks, setRemarks] = useState({
    lineA: "",
    lineB: "",
    lineC: "",
    recycle: "",
    lineD: "" // ✅ เปลี่ยน Key เป็น lineD
  });

  // Header Titles (Editable)





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
        } else {
          // Reset Values if no data found
          // ✅ Reset lineD
          setRemarks({ lineA: "", lineB: "", lineC: "", recycle: "", lineD: "" });
          // genmatsuTypeHeader removed
          // recycleLotHeader removed
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
        remarks
      };
      await axios.post(`/genmatsu/api/submissions/reports/summary`, {
        date: selectedDate,
        summaryData
      });
      alert("Saved Remarks Data successfully!");
    } catch (error) {
      console.error("Error saving summary:", error);
      alert("Failed to save summary.");
    }
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
  // Header Edit Handlers


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
  const TableHeaderGroup = ({ hasMoisture = false }: { hasMoisture?: boolean }) => (
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

  // ✅ เปลี่ยน Logic การหา maxRows เป็น data.lineD
  const maxRows = mode === 'lineD'
    ? (data.lineD ? data.lineD.length : 0)
    : Math.max(data.lineA.length, data.lineB.length, data.lineC.length, recycleLabels.length);

  // ------------------------------------------
  // 🅰️ RENDER: Line D Mode (สำหรับหน้า 2)
  // ------------------------------------------
  if (mode === 'lineD') {
    return (
      <div className="w-full bg-white border border-gray-400 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border-r border-gray-600 p-1 w-8" rowSpan={3}>No.</th>
                {/* หัวข้อใหญ่ยังเป็น Genmatsu ZE-1A ตามที่ขอ */}
                <th className="p-1 uppercase tracking-widest" colSpan={5}>Genmatsu ZE-1A</th>
              </tr>
              {/* หัวข้อรองเป็น Line D */}
              <tr className="bg-gray-200 border-b border-gray-300 text-gray-900">
                <th className="border-r border-gray-300 py-1 text-center font-extrabold text-xs uppercase tracking-wide" colSpan={5}>
                  Line D
                </th>
              </tr>
              <tr className="border-b border-gray-300">
                {/* hasMoisture={false} เพราะ Line D ไม่มี Mois */}
                <TableHeaderGroup hasMoisture={false} />
              </tr>
            </thead>
            <tbody className="bg-white">
              {maxRows === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No Line D Data Available</td></tr>
              ) : (
                <>
                  {Array.from({ length: maxRows }).map((_, index) => (
                    // ✅ ใช้ itemD ส่งข้อมูล
                    <DailyReportRow
                      key={index}
                      index={index}
                      itemD={data.lineD?.[index]} // ใช้ itemD
                      isSingleLine={true}
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
                    {/* ✅ ใช้ data.lineD */}
                    {renderTotalCells(data.lineD || [], false)}
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border-r border-b border-gray-300 p-1 bg-slate-200"></td>
                    <td colSpan={6} className="border-r border-b border-gray-300 p-1">
                      {/* ✅ เปลี่ยน label และใช้ remarks.lineD */}
                      <span className="text-[10px] font-extrabold text-green-700 uppercase">Line D Remark</span>
                      <textarea
                        value={remarks.lineD}
                        onChange={e => handleRemarkChange('lineD', e.target.value)}
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
              {/* Type Input: Static now */}
              <th className="py-1 font-extrabold uppercase bg-gray-300" colSpan={2}>
                Genmatsu Type
              </th>
            </tr>
            <tr className="border-b border-gray-300">
              <TableHeaderGroup />
              <TableHeaderGroup />
              <TableHeaderGroup hasMoisture={true} />

              <th className="border-r border-b border-gray-300 px-1 py-1 text-center font-extrabold bg-gray-100">Lot No.</th>
              <th className="border-b border-gray-300 px-1 py-1 text-center font-extrabold bg-gray-100 min-w-[100px]"></th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {maxRows === 0 ? (
              <tr><td colSpan={19} className="text-center py-6 text-gray-400">No Data Available</td></tr>
            ) : (
              <>
                {Array.from({ length: maxRows }).map((_, index) => (
                  <DailyReportRow
                    key={index}
                    index={index}
                    itemA={data.lineA[index]}
                    itemB={data.lineB[index]}
                    itemC={data.lineC[index]}
                    recycleLabel={recycleLabels[index]}
                    // recycleValue and onRecycleChange removed
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
                      <div className="flex items-center justify-end gap-1">Packing result = <span className="w-10 text-center font-bold text-gray-400">-</span> cans.</div>
                      <div className="flex items-center justify-end gap-1">Output - Input = <span className="w-10 text-center font-bold text-gray-400">-</span> kg.</div>
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

      {/* Logic for showing Line D at bottom (Page 1 Web View) */}
      {/* ✅ เช็ค data.lineD และ hideLineD */}
      {data.lineD && data.lineD.length > 0 && !hideLineD && (
        <div className="mt-8 border-t-4 border-gray-500 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border-r border-gray-600 p-1 w-8" rowSpan={3}>No.</th>
                  {/* หัวข้อใหญ่ Genmatsu ZE-1A */}
                  <th className="p-1 uppercase tracking-widest" colSpan={5}>Genmatsu ZE-1A</th>
                </tr>

                {/* หัวข้อรอง Line D */}
                <tr className="bg-gray-200 border-b border-gray-300 text-gray-900">
                  <th className="border-r border-gray-300 py-1 text-center font-extrabold text-xs uppercase tracking-wide" colSpan={5}>
                    Line D
                  </th>
                </tr>

                <tr className="border-b border-gray-300">
                  <TableHeaderGroup hasMoisture={false} />
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.lineD.map((_, index) => (
                  // ✅ ใช้ itemD ส่งข้อมูล
                  <DailyReportRow
                    key={index}
                    index={index}
                    itemD={data.lineD?.[index]} // ใช้ itemD
                    isSingleLine={true}
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
                  {/* ✅ ใช้ data.lineD */}
                  {renderTotalCells(data.lineD, false)}
                </tr>
                <tr className="bg-slate-50">
                  <td className="border-r border-b border-gray-300 p-1 bg-slate-200"></td>
                  <td colSpan={6} className="border-r border-b border-gray-300 p-1">
                    {/* ✅ ใช้ remarks.lineD */}
                    <span className="text-[10px] font-extrabold text-green-700 uppercase">Line D Remark</span>
                    <textarea
                      value={remarks.lineD}
                      onChange={e => handleRemarkChange('lineD', e.target.value)}
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