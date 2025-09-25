import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSubmissions } from '../../services/submissionService';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

const ReportHistory: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await getAllSubmissions();
        setSubmissions(data);
      } catch (err) {
        setError('ไม่สามารถดึงข้อมูลประวัติการบันทึกได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const formatDbTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    // แทนที่ตัว 'T' (ถ้ามี) ด้วยช่องว่าง และตัดส่วนมิลลิวินาที (.980) ออกไป
    return timestamp.replace('T', ' ').substring(0, 19);
  };

  return (
    <>
      <Breadcrumb pageName="ประวัติการบันทึก (Report History)" />
      {/* --- 👇👇👇 2. เพิ่มปุ่ม "สร้างรายงานใหม่" ตรงนี้ 👇👇👇 --- */}



      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="flex justify-end mb-4">
          <Link
            to="/forms/form-elements"
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
            Add New Report
          </Link>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  Lot No.
                </th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  วันที่บันทึก
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  ผู้บันทึก
                </th>
                <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                  สถานะ
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-5">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="text-center p-5 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission.submission_id}>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{submission.lot_no}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {/* --- 👇👇👇 แก้ไขตรงนี้: เรียกใช้ฟังก์ชัน formatDbTimestamp --- */}
                        {formatDbTimestamp(submission.submitted_at)}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{submission.submitted_by}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                        {submission.status}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <Link
                          to={`/reports/view/${submission.submission_id}`}
                          className="hover:text-primary"
                        >
                          {/* SVG Icon for "View" */}
                          <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.17812 8.99981 3.17812C14.5686 3.17812 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85606 8.99999C2.4748 10.0406 4.89356 13.5 8.99981 13.5C13.1061 13.5 15.5248 10.0406 16.1436 8.99999C15.5248 7.95937 13.1061 4.5 8.99981 4.5C4.89356 4.5 2.4748 7.95937 1.85606 8.99999Z"
                              fill=""
                            />
                            <path
                              d="M9 11.25C7.75734 11.25 6.75 10.2427 6.75 9C6.75 7.75734 7.75734 6.75 9 6.75C10.2427 6.75 11.25 7.75734 11.25 9C11.25 10.2427 10.2427 11.25 9 11.25ZM9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25Z"
                              fill=""
                            />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ReportHistory;