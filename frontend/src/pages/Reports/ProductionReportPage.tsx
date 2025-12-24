// frontend/src/pages/Reports/ProductionReportPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaFilePdf } from 'react-icons/fa'; // เปลี่ยนไอคอนเป็น PDF ให้สื่อความหมาย

// แก้ Path ให้ตรงกับโครงสร้างใหม่
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import DailyReportTable from './DailyReportTable';

const ProductionReportPage: React.FC = () => {
  // Default วันที่ปัจจุบัน
  const today = new Date().toISOString().split('T')[0];

  const [filterDate, setFilterDate] = useState(today);
  const [lotNoPrefix, setLotNoPrefix] = useState('');
  const [reportData, setReportData] = useState({ lineA: [], lineB: [], lineC: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // เพิ่ม State สำหรับปุ่ม Export

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      // เรียก API
      const res = await axios.get(`/genmatsu/api/submissions/reports/daily`, {
        params: {
          date: filterDate,
          lotNoPrefix: lotNoPrefix // ส่งไปถ้ามีค่า
        }
      });
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // โหลดข้อมูลทันทีเมื่อเปลี่ยนวันที่
  useEffect(() => {
    fetchReport();
  }, [filterDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  // ฟังก์ชันอัปเดต Plan
  const handleUpdateStPlan = async (id: number, newValue: number) => {
    try {
      await axios.put(`/genmatsu/api/submissions/${id}/st-plan`, {
        st_target_value: newValue
      });
      fetchReport(); // โหลดข้อมูลใหม่
      // alert('Update successful!'); // อาจจะไม่ต้อง Alert รบกวน User ก็ได้ถ้ามัน Refresh เร็ว
    } catch (error) {
      console.error("Failed to update ST Plan", error);
      alert('Failed to update.');
    }
  };

  // ✅ ฟังก์ชันสำหรับ Export PDF (เรียก Backend)
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // เรียกไปที่ Route ใหม่ที่เราเพิ่งสร้างใน backend
      const response = await axios.get(`/genmatsu/api/submissions/reports/daily/pdf`, {
        params: { date: filterDate },
        responseType: 'blob', // ‼️ สำคัญมาก: ต้องบอกว่าเป็นไฟล์ (Blob)
      });

      // สร้าง Link จำลองเพื่อกดดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daily_Report_${filterDate}.pdf`); // ตั้งชื่อไฟล์
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Daily Production Report" />

      <div className="flex flex-col gap-5">
        {/* Search Bar Card */}
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">

            {/* Date Filter */}
            <div className="w-full md:w-1/3">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Production Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            {/* Lot No Filter */}
            <div className="w-full md:w-1/3">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Lot No. (First 4 digits)
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

            {/* ปุ่ม Export PDF */}
            <div className="w-full md:w-auto ml-auto">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting} // ป้องกันกดรัวๆ
                className={`flex items-center gap-2 rounded py-2 px-6 font-medium text-white shadow-md transition
                  ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isExporting ? (
                  <>Processing...</>
                ) : (
                  <><FaFilePdf /> Export PDF</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Report Table Area */}
        {isLoading ? (
          <div className="flex h-60 justify-center items-center bg-white rounded-sm border border-stroke">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : (
          <DailyReportTable
            data={reportData}
            onUpdateStPlan={handleUpdateStPlan}
            selectedDate={filterDate}
          />
        )}
      </div>
    </>
  );
};

export default ProductionReportPage;