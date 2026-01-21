// frontend/src/pages/Reports/components/DailyReportRow.tsx

import React from 'react';
import { FaPen, FaCheck, FaTimes } from 'react-icons/fa';
import { ProductionRecord } from '../../../types/report';

interface DailyReportRowProps {
    index: number;
    itemA?: ProductionRecord;
    itemB?: ProductionRecord;
    itemC?: ProductionRecord;
    itemD?: ProductionRecord;
    recycleLabel?: string;
    recycleValue?: number; // ✅ รับค่า Recycle
    recyclePercent?: number; // ✅ รับค่า %
    // Props สำหรับ Edit ST Plan
    editingId: number | null;
    tempStValue: string;
    setTempStValue: (val: string) => void;
    onStartEdit: (item: ProductionRecord) => void;
    onCancelEdit: () => void;
    onSaveEdit: (id: number) => void;

    // ✅ เพิ่มตัวนี้ครับ: เพื่อบอกว่า "แถวนี้ขอโชว์แค่สินค้าเดียวพอนะ" (สำหรับ ZE-1A)
    isSingleLine?: boolean;
}

// Sub-component สำหรับวาด Cell ข้อมูลแต่ละ Line
const DataCell = ({ item, isLineC = false, editingId, tempStValue, setTempStValue, onStartEdit, onSaveEdit, onCancelEdit }: any) => {
    if (!item) return (
        <>
            <td className="border-r border-b border-gray-300 p-0.5"></td>
            <td className="border-r border-b border-gray-300 p-0.5"></td>
            <td className="border-r border-b border-gray-300 p-0.5"></td>
            <td className="border-r border-b border-gray-300 p-0.5"></td>
            <td className="border-r border-b border-gray-300 p-0.5 bg-gray-50"></td>
            {isLineC && <td className="border-r border-b border-gray-300 p-0.5"></td>}
        </>
    );

    const isLowYield = item.yield < 95;
    const isEditing = editingId === item.id;

    return (
        <>
            {/* Product Name */}
            <td className="border-r border-b border-gray-300 px-1 py-0.5 text-center align-top max-w-[80px]">
                <span className="font-bold text-gray-900 text-sm block break-words leading-tight" title={item.productName}>{item.productName}</span>
            </td>
            {/* Lot No */}
            <td className="border-r border-b border-gray-300 px-1 py-0.5 text-center align-top">
                <span className="font-bold text-gray-800 text-xs bg-gray-100 border border-gray-300 px-1 py-0.5 rounded block leading-none">{item.lotNo}</span>
            </td>
            {/* Input & Std. Plan */}
            <td className="border-r border-b border-gray-300 px-1 py-0.5 text-right align-top">
                <div className="flex flex-col items-end gap-0">
                    <span className="text-base font-bold text-gray-1000 leading-tight">
                        {item.input?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-0.5 bg-white border border-blue-500 rounded shadow-sm z-10 absolute p-1">
                            <input
                                type="number" autoFocus
                                value={tempStValue}
                                onChange={(e) => setTempStValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(item.id); if (e.key === 'Escape') onCancelEdit(); }}
                                className="w-16 text-xs text-right outline-none px-1 border border-gray-300 rounded-sm font-bold"
                            />
                            <button onClick={() => onSaveEdit(item.id)} className="text-green-600"><FaCheck size={10} /></button>
                            <button onClick={onCancelEdit} className="text-red-500"><FaTimes size={10} /></button>
                        </div>
                    ) : (
                        <div className="group flex items-center justify-end gap-1 cursor-pointer hover:bg-gray-100 rounded px-1 w-full" onClick={() => onStartEdit(item)}>
                            <span className="text-[13px] text-gray-400 font-bold">Std.</span>
                            <span className="text-ls font-bold text-gray-600 group-hover:text-blue-700">
                                {item.stPlan?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <FaPen size={8} className="opacity-0 group-hover:opacity-100 text-gray-400 ml-0.5 print:hidden" />
                        </div>
                    )}
                </div>
            </td>
            {/* Output & Yield */}
            <td className="border-r border-b border-gray-300 px-1 py-0.5 text-right align-top">
                <div className="flex flex-col items-end gap-0">
                    <span className="text-base font-black text-gray-900 leading-tight">
                        {item.output?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div className={`flex items-center justify-end gap-1 px-0 ${isLowYield ? 'text-red-700' : 'text-green-700'}`}>
                        <span className="text-[13px] opacity-80 font-bold">Yield</span>
                        <span className="text-xs font-extrabold">{item.yield?.toFixed(2)}%</span>
                    </div>
                </div>
            </td>
            {/* Pallets */}
            <td className="border-r border-b border-gray-300 p-0.5 align-top bg-gray-50 min-w-[80px]">
                {item.pallets?.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {item.pallets.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center text-xs bg-white border border-gray-300 rounded overflow-hidden leading-tight shadow-sm">
                                <div className="w-1/2 px-1 py-0.5 text-center border-r border-gray-200 text-gray-900 font-bold truncate">{p.no}</div>
                                <div className="w-1/2 px-1 py-0.5 text-center font-black text-gray-1000">{Number(p.qty).toFixed(0)}</div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-gray-300 text-center block text-xs py-0.5 font-bold">-</span>}
            </td>
            {/* Moisture */}
            {isLineC && (
                <td className="border-r border-b border-gray-300 p-0.5 text-center align-top">
                    {item.moisture != null ? <span className="text-lg font-black text-gray-1000">{item.moisture.toFixed(2)}%</span> : <span className="text-gray-300 text-xs font-bold">-</span>}
                </td>
            )}
        </>
    );
};

const DailyReportRow: React.FC<DailyReportRowProps> = (props) => {
    // ✅ 1. โหมดแถวเดียว (สำหรับ ZE-1A) : แสดงเฉพาะ ItemC (เพราะ ZE-1A ใช้ช่องข้อมูลแบบ Line C ที่มี Moisture)
    if (props.isSingleLine) {
        return (
            <tr className="hover:bg-blue-50 border-b border-gray-300 transition-colors">
                <td className="border-r border-gray-300 p-0.5 text-center font-bold text-gray-600 bg-gray-50 align-top text-xs">{props.index + 1}</td>
                {/* ใช้ itemD ที่ส่งมา */}
                <DataCell item={props.itemD} isLineC={false} {...props} />
            </tr>
        );
    }

    // ✅ 2. โหมดปกติ (หน้าแรก) : แสดง A, B, C และ Recycle
    return (
        <tr className="hover:bg-blue-50 border-b border-gray-300 transition-colors">
            <td className="border-r border-gray-300 p-0.5 text-center font-bold text-gray-600 bg-gray-50 align-top text-xs">{props.index + 1}</td>
            <DataCell item={props.itemA} {...props} />
            <DataCell item={props.itemB} {...props} />
            <DataCell item={props.itemC} isLineC={true} {...props} />
            <td className="border-r border-b border-gray-300 p-0.5 pl-2 text-left text-xs font-extrabold text-gray-700 bg-gray-50 align-top">{props.recycleLabel}</td>
            <td className="border-b border-gray-300 p-0.5 align-top bg-white min-w-[110px]">
                <div className="flex flex-col gap-0.5 h-full justify-center items-center">
                    {props.recycleValue != null ? (
                        <>
                            <span className="text-base font-black text-gray-900 leading-tight">
                                {props.recycleValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            {/* Show percentage if available */}
                            {props.recyclePercent !== undefined && (
                                <span className={`text-sm font-bold ${props.recycleLabel === 'Input' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ({props.recyclePercent.toFixed(2)}%)
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-400 font-bold">-</span>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default DailyReportRow;