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
  lineD?: ProductionRecord[];
  genmatsuType?: string;
  remarks?: any;
}

const DailyReportPrint: React.FC = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const lotNo = searchParams.get('lotNo');

  const [reportData, setReportData] = useState<FullReportData>({
    lineA: [], lineB: [], lineC: [], lineD: [],
    genmatsuType: "Genmatsu Type",

    remarks: {}
  });



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<FullReportData>(`/genmatsu/api/submissions/reports/daily`, {
          params: { date, lotNoPrefix: lotNo }
        });

        let data = res.data;
        /*if (!res.data.lineZE1A || res.data.lineZE1A.length === 0) {
         res.data.lineZE1A = [
           {
             id: 9001, productName: "ZE-TEST-ITEM-1", lotNo: "Z9901",
             input: 1200, output: 1180, yield: 98.33, stPlan: 1200,
             pallets: [{ no: 1, qty: 50 }, { no: 2, qty: 50 }], moisture: 12.5
           },
           {
             id: 9002, productName: "ZE-TEST-ITEM-2", lotNo: "Z9902",
             input: 800, output: 750, yield: 93.75, stPlan: 800, // Yield ต่ำกว่า 95% จะเป็นสีแดง
             pallets: [{ no: 3, qty: 40 }], moisture: 11.0
           }
         ];
       }*/

        setReportData(data);

        // รอสักนิดให้ Render เสร็จแล้วค่อยสั่ง Print (ถ้าต้องการ Auto Print)
        setTimeout(() => { window.print(); }, 1000);

      } catch (error) {
        console.error("Error fetching report:", error);
      }
    };

    if (date) {
      fetchData();
    }
  }, [date, lotNo]);

  return (
    <div id="pdf-content-ready" className="bg-white min-h-screen">

      {/* ================= PAGE 1: Genmatsu A, B, C ================= */}
      <div className="a4-page-container p-4">
        {/* Header Page 1 */}
        <div className="mb-4">
          <h1 className="text-2xl font-black text-center text-black uppercase tracking-wide mb-4">
            Data of Genmatsu Production Amount
          </h1>
          <div className="flex justify-between items-end border-b-2 border-black pb-2">
            <div className="flex items-center gap-4 text-sm font-bold text-black">
              <span>Date: {formatDate(date)}</span>
              {lotNo && (
                <><span>|</span><span>Lot No: {lotNo}</span></>
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5 text-xs font-bold text-black text-right">
              <p>*** If has NCR mix or Recycle genmatsu, record in the Remark.</p>
              <p>*** This document should be filed untill morning at next working day of production day</p>
            </div>
          </div>
        </div>

        {/* Table Page 1 (Normal Mode) */}
        <DailyReportTable
          data={reportData}
          selectedDate={date || ""}
          selectedLotNo={lotNo || undefined}
          mode="normal" // 👈 ระบุโหมดปกติ
          hideLineD={true}
        />
      </div>

      {/* ================= PAGE 2: Genmatsu ZE-1A ================= */}
      {reportData.lineD && reportData.lineD.length > 0 && (

        // ✅ แก้ไขตรงนี้: ลบ <div className="page-break"> ออก
        // แล้วเอา class "page-break" มาใส่ใน a4-page-container แทนครับ
        <div className="a4-page-container p-4 page-break">

          {/* Header Page 2 */}
          <div className="mb-4">
            <h1 className="text-2xl font-black text-center text-black uppercase tracking-wide mb-4">
              Data of Genmatsu Production Amount (Page 2)
            </h1>
            <div className="flex justify-between items-end border-b-2 border-black pb-2">
              <div className="flex items-center gap-4 text-sm font-bold text-black">
                <span>Date: {formatDate(date)}</span>
                {lotNo && <span>| Lot No: {lotNo}</span>}
              </div>
              <div className="text-xs font-bold text-black text-right">
                <p>*** Genmatsu ZE-1A Section</p>
              </div>
            </div>
          </div>

          {/* Table Page 2 */}
          <DailyReportTable
            data={reportData}
            selectedDate={date || ""}
            selectedLotNo={lotNo || undefined}
            mode="lineD"
          />
        </div>
      )}
      {/* CSS สำหรับจัดหน้ากระดาษ Print */}
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

            input, textarea {
                font-weight: bold !important;
                color: #000 !important; /* บังคับสีดำสนิท */
            }
            
            .print\\:hidden { display: none !important; }

            .page-break {
                page-break-before: always !important;
                break-before: page !important;
                display: block !important;
                margin-top: 0 !important;
                border-top: none !important; /* กันเส้นประหลาด */
            }

            /* Container A4 แนวนอน ย่อส่วนลงนิดนึงกันตกขอบ */
            .a4-page-container {
                transform: scale(0.94);
                transform-origin: top left;
                width: 106.5% !important;
                margin: 0 !important;
                box-shadow: none !important;
                /* สำคัญ: ต้องกำหนดความสูงให้เต็มหน้า เพื่อให้ Page Break ทำงานถูกจุด */
                min-height: 100vh; 
                position: relative;
            }
        }
        
        /* หน้าจอปกติ (Preview) */
        .a4-page-container {
            width: 297mm;
            min-height: 210mm;
            margin: 20px auto; /* เว้นระยะห่างระหว่างหน้าเวลาดูบนจอ */
            background: white;
            padding: 15px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* ใส่เงาให้ดูเป็นกระดาษ */
        }
      `}</style>
    </div>
  );
};

export default DailyReportPrint;