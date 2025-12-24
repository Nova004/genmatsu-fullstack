// frontend/src/pages/Reports/DailyReportPrint.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import DailyReportTable from './DailyReportTable';
import { formatDate } from '../../utils/utils';

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
  production_date?: string;
}

interface FullReportData {
  lineA: ProductionRecord[];
  lineB: ProductionRecord[];
  lineC: ProductionRecord[];
  genmatsuType?: string;
  recycleLot?: string;
  recycleValues?: any[];
  recycleTotals?: any;
  remarks?: any;
}

const DailyReportPrint: React.FC = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const lotNo = searchParams.get('lotNo');

  const [reportData, setReportData] = useState<FullReportData>({
    lineA: [], lineB: [], lineC: [],
    genmatsuType: "Genmatsu Type",
    recycleLot: "-",
    recycleValues: [],
    recycleTotals: {},
    remarks: { lineA: "", lineB: "", lineC: "", recycle: "" }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. ตั้งชื่อ Title
  useEffect(() => {
    if (date) {
      document.title = `Daily_Report_${date}${lotNo ? `_${lotNo}` : ''}`;
    } else {
      document.title = 'Error_No_Date';
    }
  }, [date, lotNo]);

  // 2. ดึงข้อมูล
  useEffect(() => {
    const fetchReport = async () => {
      if (!date) {
        setIsLoading(false);
        setError("ไม่พบวันที่ (Date parameter missing)");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // ดึงข้อมูล
        const res = await axios.get(`/genmatsu/api/submissions/reports/daily`, {
          params: {
            date,
            lotNoPrefix: lotNo
          }
        });
        setReportData(res.data);
      } catch (err: any) {
        console.error("Error fetching report for print:", err);
        setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [date, lotNo]);

  // ✅ 3. สั่ง Print อัตโนมัติเมื่อโหลดเสร็จ (เพิ่มส่วนนี้)
  useEffect(() => {
    if (!isLoading && !error && date) {
      // รอแป๊บนึง (500ms) ให้หน้าเว็บวาดตารางเสร็จก่อนค่อยเด้ง Print
      const timer = setTimeout(() => {
        window.print();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, error, date]);

  // --- Render Control ---
  if (!date) {
    return <div className="p-4 text-red-500 font-bold">Error: URL ไม่ถูกต้อง (ไม่พบ date)</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen font-bold text-xl">Loading Report Data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 font-bold">Error: {error}</div>;
  }

  return (
    <div id="pdf-content-ready" className="a4-page-container bg-white min-h-screen">
      <div className="p-4">
        {/* ส่วนหัวกระดาษ */}
        <div className="mb-4">
          {/* ชื่อหัวเรื่อง (ตรงกลางเหมือนเดิม) */}
          <h1 className="text-2xl font-black text-center text-black uppercase tracking-wide mb-4">
            Data of Genmatsu Production Amount
          </h1>

          {/* จัดวาง Date ชิดซ้าย และ หมายเหตุ ชิดขวา */}
          <div className="flex justify-between items-end border-b-2 border-black pb-2">

            {/* ฝั่งซ้าย: Date & Lot No */}
            <div className="flex items-center gap-4 text-sm font-bold text-black">
              <span>Date: {formatDate(date)}</span>
              {lotNo && (
                <>
                  <span>|</span>
                  <span>Lot No: {lotNo}</span>
                </>
              )}
            </div>

            {/* ฝั่งขวา: หมายเหตุ (Text Right) */}
            <div className="flex flex-col items-end gap-0.5 text-xs font-bold text-black text-right">
              <p>*** If has NCR mix or Recycle genmatsu, record in the Remark.</p>
              <p>*** This document should be filed untill morning at next working day of production day</p>
            </div>

          </div>
        </div>
        {/* ตารางข้อมูล */}
        <DailyReportTable
          data={reportData}
          selectedDate={date}
        />
      </div>

      {/* CSS สำหรับจัดหน้ากระดาษ A4 Landscape */}
      <style>{`
        @media print {
            @page { 
                size: landscape; 
                margin: 0mm; 
            }
            body { 
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
                background-color: white !important;
            }
            
            /* ซ่อน UI แปลกปลอม */
            .print\\:hidden { display: none !important; }

            /* 🔥 ปรับลดขนาดลงอีกเหลือ 94% (จากเดิม 98%) */
            .a4-page-container {
                transform: scale(0.94);       /* ย่อลงให้เหลือ 94% */
                transform-origin: top left;   /* ยึดมุมซ้ายบน */
                width: 106.5% !important;     /* ขยายความกว้างชดเชย (100 / 0.94 ≈ 106.4) */
                margin: 0 !important;         
                box-shadow: none !important;
            }
        }
        
        /* หน้าจอปกติ */
        .a4-page-container {
            width: 297mm;
            min-height: 210mm;
            margin: auto;
            background: white;
            padding: 10px; 
        }
      `}</style>
    </div>
  );
};

export default DailyReportPrint;