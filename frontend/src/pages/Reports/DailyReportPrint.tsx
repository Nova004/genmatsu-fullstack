// frontend/src/pages/Reports/DailyReportPrint.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import DailyReportTable from './DailyReportTable';

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
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-wide">DAILY PRODUCTION REPORT</h1>
          <p className="text-sm font-bold text-black">Date: {date}</p>
        </div>

        {/* ตารางข้อมูล */}
        <DailyReportTable
          data={reportData}
          selectedDate={date}
        />
      </div>

      {/* CSS สำหรับซ่อน UI ของ Browser ตอน Print */}
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
            
            /* ซ่อน Header/Footer ของ Browser (บาง Browser ทำได้) */
            @page { margin: 0; }

            /* บังคับ Font และสี */
            * {
                -webkit-print-color-adjust: exact !important;   /* Chrome, Safari, Edge */
                print-color-adjust: exact !important;           /* Firefox */
            }
            
            /* ซ่อน Scrollbar */
            ::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </div>
  );
};

export default DailyReportPrint;