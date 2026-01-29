// frontend/src/pages/Reports/ProductionReportPage.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaPrint, FaFilePdf } from 'react-icons/fa'; // เพิ่ม Icon PDF

import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import DailyReportTable from './DailyReportTable';

const ProductionReportPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];

  const [filterDate, setFilterDate] = useState(today);
  const [lotNoPrefix, setLotNoPrefix] = useState('');
  const [reportData, setReportData] = useState({ lineA: [], lineB: [], lineC: [], lineD: [] });
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับปุ่ม Download PDF
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/genmatsu/api/submissions/reports/daily`, {
        params: {
          date: filterDate,
          lotNoPrefix: lotNoPrefix
        }
      });
      if (!res.data.lineD || res.data.lineD.length === 0) {
        // Mock Data หรือ Logic อื่นๆ
        /* res.data.lineZE1A = [
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
      ];*/
      }
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filterDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const handleUpdateStPlan = async (id: number, newValue: number) => {
    try {
      await axios.put(`/genmatsu/api/submissions/${id}/st-plan`, {
        st_target_value: newValue
      });
      fetchReport();
    } catch (error) {
      console.error("Failed to update ST Plan", error);
      alert('Failed to update.');
    }
  };

  // ✅ 1. ฟังก์ชัน Web Preview (ที่คุณแก้จนใช้ได้แล้ว)
  const handlePrintPreview = () => {
    // URL นี้ถูกต้องแล้วตามที่คุณทดสอบผ่าน
    const url = `/genmatsu/reports/daily/print?date=${filterDate}&lotNo=${lotNoPrefix}`;
    window.open(url, '_blank');
  };

  // ✅ 2. ฟังก์ชัน Download PDF (ยิงไป Backend Puppeteer)
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      // เรียก API Backend เส้น PDF
      const response = await axios.get(`/genmatsu/api/submissions/reports/daily/pdf`, {
        params: {
          date: filterDate,
          lotNoPrefix: lotNoPrefix // ส่งไปถ้า backend รองรับ
        },
        responseType: 'blob', // สำคัญ: รับค่าเป็นไฟล์
      });

      // สร้าง Link ปลอมเพื่อกดโหลดไฟล์
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daily_Report_${filterDate}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF (ตรวจสอบ Console)");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Daily Genmatsu Report" />

      <div className="flex flex-col gap-5">
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">

            {/* Date Input */}
            <div className="w-full md:w-1/3">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            {/* Lot No Input */}
            <div className="w-full md:w-1/3">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Lot No.
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 5317"
                  value={lotNoPrefix}
                  onChange={(e) => setLotNoPrefix(e.target.value)}
                  maxLength={4}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 text-primary hover:text-primary-dark"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* ปุ่มกด */}
            <div className="w-full md:w-auto ml-auto flex gap-2">
              {/* ปุ่ม 1: Web Preview
              <button
                type="button"
                onClick={handlePrintPreview}
                className="flex items-center gap-2 rounded py-2 px-4 font-medium text-black border border-gray-300 hover:bg-gray-100 transition"
              >
                <FaPrint /> Preview
              </button> */}

              {/* ปุ่ม 2: Download PDF (สีแดง) */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="flex items-center gap-2 rounded py-2 px-6 font-medium text-white shadow-md bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaFilePdf /> Download PDF
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Table Area */}
        {isLoading ? (
          <div className="flex h-60 justify-center items-center bg-white rounded-sm border border-stroke">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : (
          <DailyReportTable
            data={reportData}
            onUpdateStPlan={handleUpdateStPlan}
            selectedDate={filterDate}
            selectedLotNo={lotNoPrefix}
          />
        )}
      </div>
    </>
  );
};

export default ProductionReportPage;