import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import DailyReportTable from './DailyReportTable';

const DailyReportPrint: React.FC = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date'); // รับวันที่จาก URL
  
  const [reportData, setReportData] = useState({ lineA: [], lineB: [], lineC: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!date) return;
      try {
        // ดึงข้อมูลการผลิต
        const res = await axios.get(`/genmatsu/api/submissions/reports/daily`, {
          params: { date }
        });
        setReportData(res.data);
      } catch (error) {
        console.error("Error fetching report for print:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [date]);

  // สั่งปริ้นเมื่อโหลดเสร็จ
  useEffect(() => {
    if (!isLoading && reportData.lineA.length >= 0) {
      // หน่วงเวลานิดนึงรอให้ Table Render remarks ให้เสร็จก่อน
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [isLoading, reportData]);

  if (!date) return <div>No Date Selected</div>;
  if (isLoading) return <div>Loading report for printing...</div>;

  return (
    <div className="p-4 bg-white min-h-screen">
       {/* ส่วนหัวกระดาษตอนปริ้น */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">DAILY PRODUCTION REPORT</h1>
        <p className="text-sm">Date: {date}</p>
      </div>

      {/* ตารางข้อมูล (จะไปดึง Remarks & Recycle มาเองภายใน Component นี้) */}
      <DailyReportTable
        data={reportData}
        selectedDate={date} 
        // ไม่ส่ง onUpdateStPlan เพราะตอนปริ้นไม่ควรแก้
      />
      
      {/* CSS ซ่อนปุ่มต่างๆ เวลาปริ้น (เผื่อไว้) */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          button { display: none !important; } /* ซ่อนปุ่ม Save ใน Table */
          input, textarea { border: none !important; resize: none; } /* ซ่อนกรอบ Input */
        }
      `}</style>
    </div>
  );
};

export default DailyReportPrint;