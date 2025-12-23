import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaPrint } from 'react-icons/fa';

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

  // เพิ่มใน ProductionReportPage.tsx

  const handleUpdateStPlan = async (id: number, newValue: number) => {
    try {
      // 1. เรียก API เพื่ออัปเดต (นายต้องไปสร้าง route PUT /api/submissions/:id/st-plan เอาเองนะ)
      await axios.put(`/genmatsu/api/submissions/${id}/st-plan`, {
        st_target_value: newValue
      });

      // 2. ถ้าสำเร็จ ให้โหลดข้อมูล Report ใหม่ทันที
      fetchReport();
      alert('Update successful!');

    } catch (error) {
      console.error("Failed to update ST Plan", error);
      alert('Failed to update.');
    }
  };

  // เวลาเรียกใช้ Component Table:
  <DailyReportTable
    data={reportData}
    onUpdateStPlan={handleUpdateStPlan} // ส่งฟังก์ชันเข้าไป
    selectedDate={filterDate}
  />

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

            <div className="w-full md:w-auto ml-auto">
              <button
                type="button"
                // ✅ แก้ตรงนี้: ให้เปิดหน้าต่างใหม่ไปที่ /reports/daily/print?date=...
                onClick={() => {
                  const url = `/genmatsu/reports/daily/print?date=${filterDate}`;
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-2 rounded bg-gray-600 py-2 px-6 font-medium text-white hover:bg-opacity-90"
              >
                <FaPrint /> Print Report
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