// location: frontend/src/pages/Reports/ReportHistory_Gen_A.tsx

// =============================================================================
// --- 1. IMPORT STATEMENTS ---
// นำเข้าไลบรารีและคอมโพเนนต์ที่จำเป็นทั้งหมด
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // เพิ่ม useNavigate
import { getAllSubmissions, deleteSubmission } from '../../services/submissionService';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { getStatusColorClass } from '../../utils/statusHelpers'; // 👈 เพิ่มบรรทัดนี้
import { fireToast } from '../../hooks/fireToast';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import { useAuth } from "../../context/AuthContext";
import { Tooltip } from '../../components/Tooltip';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table';
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";


// =============================================================================
// --- 2. TYPE DEFINITION ---
// กำหนดโครงสร้างข้อมูล (Type) สำหรับแต่ละ submission
// =============================================================================
interface SubmissionData {
  submission_id: number;
  lot_no: string;
  submitted_at: string;
  status: string;
  form_type: string;
  pending_level?: number;
  submitted_by_name: string; // 👈 เพิ่มชื่อเต็ม
  category: string;          // 👈 เพิ่ม category
}

// =============================================================================
// --- 3. COMPONENT DEFINITION ---
// ReportHistory Component: หน้าสำหรับแสดงประวัติการบันทึกทั้งหมดในรูปแบบตาราง
// =============================================================================
const ReportHistory_GEN_A: React.FC = () => {

  // --- 3.1. STATE MANAGEMENT ---
  // ประกาศ State ต่างๆ เพื่อใช้จัดการข้อมูลภายในคอมโพเนนต์
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]); // เก็บข้อมูลรายงานทั้งหมด
  const [isLoading, setIsLoading] = useState(true);                   // สถานะการโหลดข้อมูล
  const [error, setError] = useState<string | null>(null);             // เก็บข้อความ error หากดึงข้อมูลไม่สำเร็จ
  const [globalFilter, setGlobalFilter] = useState('');                // State สำหรับการค้นหาแบบ Global (ทุกคอลัมน์)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // State สำหรับการกรองข้อมูลแบบเจาะจงคอลัมน์ (เช่น วันที่)
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);
  const location = useLocation();
  const highlightedId = location.state?.highlightedId;
  const [dateRange, setDateRange] = useState<DateValueType>({        // State สำหรับเก็บช่วงวันที่ที่ผู้ใช้เลือก
    startDate: null,
    endDate: null
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  // --- 3.2. DATA FETCHING EFFECT ---
  // `useEffect` hook นี้จะทำงานเพียงครั้งเดียวเมื่อคอมโพเนนต์ถูกสร้างขึ้น
  // เพื่อดึงข้อมูลประวัติการบันทึกทั้งหมดจาก API
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // 1. ดึงข้อมูลมาเป็น any หรือ type เดิมก่อน (เพื่อเลี่ยง error ตอนรับค่า)
        const response: any[] = await getAllSubmissions('GEN_A');

        // 2. แปลงข้อมูล (Map) ให้ตรงกับ SubmissionData
        const formattedData: SubmissionData[] = response.map((item) => ({
          submission_id: item.id || item.submission_id, // API อาจส่งมาเป็น id
          lot_no: item.lot_no,
          submitted_at: item.created_at || item.submitted_at, // API อาจส่งมาเป็น created_at
          status: item.status,
          form_type: item.form_type,
          production_date: item.production_date,
          pending_level: item.pending_level,
          submitted_by_name: item.user?.username || item.submitted_by || 'Unknown',
          category: item.category || 'GEN_A'
        }));

        setSubmissions(formattedData);
      } catch (err) {
        console.error(err); // Log error ดูด้วย
        setError('ไม่สามารถดึงข้อมูลประวัติการบันทึก (GEN_A) ได้');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handlePrint = (id: number) => {
    // เราจะยิงไปที่ API ของ Backend โดยตรง
    // Proxy ใน vite.config.js จะจัดการเปลี่ยนเส้นทางให้เราเอง
    window.open(`/genmatsu/api/submissions/print/${id}`, '_blank');
  };
  // --- 3.3. DATE FILTERING EFFECT ---
  // `useEffect` hook นี้จะทำงานทุกครั้งที่ `dateRange` มีการเปลี่ยนแปลง
  // เพื่ออัปเดต state `columnFilters` สำหรับการกรองข้อมูลตามวันที่
  useEffect(() => {
    const dateFilter = {
      id: 'production_date', // ระบุว่าจะกรองที่คอลัมน์ 'submitted_at'
      value: dateRange,     // ใช้ค่าจาก state `dateRange` เป็นเงื่อนไข
    };

    // อัปเดต state การกรองทั้งหมด โดยลบ filter วันที่อันเก่าออก (ถ้ามี) แล้วเพิ่มอันใหม่เข้าไป
    setColumnFilters(prev => [
      ...prev.filter(f => f.id !== 'production_date'),
      dateFilter,
    ]);

  }, [dateRange]); // Dependency คือ `dateRange`
  // --- 3.3. DATE FILTERING EFFECT ---
  // `useEffect` hook นี้จะทำงานทุกครั้งที่ `dateRange` มีการเปลี่ยนแปลง
  // เพื่ออัปเดต state `columnFilters` สำหรับการกรองข้อมูลตามวันที่
  useEffect(() => {
    const dateFilter = {
      id: 'production_date', // ระบุว่าจะกรองที่คอลัมน์ 'production_date'
      value: dateRange,     // ใช้ค่าจาก state `dateRange` เป็นเงื่อนไข
    };

    // อัปเดต state การกรองทั้งหมด โดยลบ filter วันที่อันเก่าออก (ถ้ามี) แล้วเพิ่มอันใหม่เข้าไป
    setColumnFilters(prev => [
      ...prev.filter(f => f.id !== 'production_date'),
      dateFilter,
    ]);

  }, [dateRange]); // Dependency คือ `dateRange`


  // --- 3.4. HELPER FUNCTIONS ---
  // ฟังก์ชันสำหรับจัดรูปแบบ timestamp ที่ได้จากฐานข้อมูลให้อยู่ในรูปแบบที่อ่านง่าย
  const formatDbTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    return timestamp.replace('T', ' ').substring(0, 19);
  };


  // --- 3.5. TABLE COLUMN DEFINITIONS ---
  // `useMemo` ถูกใช้เพื่อป้องกันการ re-render ที่ไม่จำเป็นของ object `columns`
  // เป็นส่วนสำคัญในการกำหนดโครงสร้างและการแสดงผลของแต่ละคอลัมน์ในตาราง
  const columns = useMemo<ColumnDef<SubmissionData>[]>(
    () => [
      {
        accessorKey: 'submission_id',
        header: 'ID Job',
      },
      {
        accessorKey: 'lot_no',
        header: 'Lot No.',
      },
      {
        accessorKey: 'form_type',
        header: 'ประเภทฟอร์ม',
      },
      {
        accessorKey: 'submitted_by_name', // 👈 เปลี่ยนเป็นชื่อเต็ม
        header: 'ผู้บันทึก',
      },
      {
        accessorKey: 'production_date', // ตรวจสอบให้แน่ใจว่าตรงกับ Key ที่ API ส่งมา
        header: 'วันที่ผลิต', // เปลี่ยนชื่อหัวตารางให้สื่อความหมาย

        // [จุดที่ 1] แก้ไขส่วนแสดงผล (Cell) ให้เหลือแค่วันที่
        cell: info => {
          const val = info.getValue<string>();
          if (!val) return "-";

          const dateObj = new Date(val);
          // ตรวจสอบความถูกต้องของวันที่ (กัน Error)
          if (isNaN(dateObj.getTime())) return "-";

          // ใช้ toLocaleDateString เพื่อแสดงรูปแบบ "วัน/เดือน/ปี" (เช่น 20/11/2568)
          return dateObj.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        },

        // [จุดที่ 2] แก้ไขฟังก์ชันกรอง (Filter) ให้ปลอดภัยขึ้น (กัน App พังถ้า filterValue เป็น null)
        filterFn: (row, columnId, filterValue) => {
          // เช็คค่า filterValue ก่อน เพื่อป้องกัน Error: Cannot read properties of undefined
          if (!filterValue || !filterValue.startDate) return true;

          const rowValue = row.getValue(columnId);
          if (!rowValue) return false; // ถ้าไม่มีข้อมูลวันที่ในแถวนั้น ให้ซ่อนไป

          const rowDate = new Date(rowValue as string);
          const startDate = new Date(filterValue.startDate);
          const endDate = new Date(filterValue.endDate || filterValue.startDate);

          // ปรับเวลาให้ครอบคลุมทั้งวัน (00:00 - 23:59) เพื่อให้เปรียบเทียบได้ถูกต้อง
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          return rowDate >= startDate && rowDate <= endDate;
        },
      },
      {
        accessorKey: 'status',
        header: 'สถานะ',
        cell: info => {
          const status = info.getValue<string>();
          // เรียกใช้ฟังก์ชันจากไฟล์กลาง ได้ Class สีกลับมาทันที
          const colorClass = getStatusColorClass(status);

          return (
            <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${colorClass}`}>
              {status}
            </p>
          );
        },
      },
      {
        id: 'actions', // คอลัมน์นี้ไม่มีข้อมูลโดยตรงจาก data จึงต้องตั้ง id เอง
        header: 'Actions',
        cell: ({ row }) => {
          const submission = row.original;


          return (
            <div className="flex items-center space-x-3.5">
              {/* ปุ่ม View */}
              {(() => {
                // Logic แจ้งเตือน (เหมือนเดิม)
                const isMyTurn = submission.status === 'Pending' && submission.pending_level === user?.LV_Approvals;
                // ข้อความ Tooltip (เปลี่ยนตามสถานะ)
                const viewTooltipText = isMyTurn ? "ถึงตาคุณอนุมัติแล้ว!" : "ดูรายละเอียด";

                return (
                  // 🟡 เรียกใช้ Component Tooltip
                  <Tooltip message={viewTooltipText}>
                    <button
                      type="button"
                      onClick={() => navigate(`/reports/view/${submission.submission_id}`)}
                      className="relative hover:text-primary" // ต้องมี relative เพื่อให้จุดแดงอ้างอิงตำแหน่งได้
                    >
                      {/* SVG ไอคอนรูปตา */}
                      <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                        <path d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.17812 8.99981 3.17812C14.5686 3.17812 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85606 8.99999C2.4748 10.0406 4.89356 13.5 8.99981 13.5C13.1061 13.5 15.5248 10.0406 16.1436 8.99999C15.5248 7.95937 13.1061 4.5 8.99981 4.5C4.89356 4.5 2.4748 7.95937 1.85606 8.99999Z" />
                        <path d="M9 11.25C7.75734 11.25 6.75 10.2427 6.75 9C6.75 7.75734 7.75734 6.75 9 6.75C10.2427 6.75 11.25 7.75734 11.25 9C11.25 10.2427 10.2427 11.25 9 11.25ZM9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75C9.41421 9.75 9.75 9.41421 9.75 8.58579 9.41421 8.25 9 8.25Z" />
                      </svg>

                      {/* จุดแดงแจ้งเตือน (Logic เดิม) */}
                      {isMyTurn && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                  </Tooltip>
                );
              })()}

              {/* ปุ่ม Edit (เรียกใช้ Component Tooltip) */}
              {(() => {
                const isNeedsEdit = submission.status === 'Rejected' && (user?.id == submission.submitted_by_name);
                const canEdit = (
                  (user?.id == submission.submitted_by_name) ||
                  (user?.LV_Approvals === 3)
                ) && (submission.status !== "Approved");

                const tooltipText = isNeedsEdit ? "งานถูกตีกลับ กรุณาแก้ไข" : "แก้ไขข้อมูล";

                return canEdit && (
                  // 🟡 เรียกใช้ Component ตรงนี้ (ส่งข้อความผ่าน prop message)
                  <Tooltip message={tooltipText}>
                    <button
                      type="button"
                      onClick={() => navigate(`/reports/edit/${submission.submission_id}`)}
                      // ลบ class 'group' ออกได้เลย เพราะ Component จัดการให้แล้ว
                      className="relative hover:text-yellow-500 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>

                      {/* จุดแดงแจ้งเตือน (Red Dot) ยังคงอยู่ที่เดิมข้างในปุ่ม */}
                      {isNeedsEdit && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                  </Tooltip>
                );
              })()}
              {/* ปุ่ม Delete */}
              {(
                (user?.id == submission.submitted_by_name) ||  // เป็นเจ้าของงาน
                (user?.LV_Approvals === 3)                // หรือเป็นผู้ดูแลระดับ 3
              )
                &&
                (submission.status !== "Approved") &&       // และ ต้องยังไม่ Approved
                (
                  // 🟡 เพิ่ม Tooltip ครอบปุ่ม Delete
                  <Tooltip message="ลบรายการนี้">
                    <button
                      onClick={() => handleDelete(submission.submission_id, submission.lot_no)}
                      className="hover:text-danger"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </Tooltip>
                )}

              {/* ปุ่ม Print */}
              {/* 🟡 เพิ่ม Tooltip ครอบปุ่ม Print */}
              <Tooltip message="พิมพ์รายงาน">
                <button
                  onClick={() => handlePrint(submission.submission_id)}
                  className="hover:text-blue-500"
                // ลบ title="พิมพ์รายงาน" อันเก่าทิ้งได้เลยครับ เพราะใช้ Tooltip แล้ว
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                </button>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [highlightedId, deletingRowId, user]
  );


  // --- 3.6. DELETE HANDLER ---
  // ฟังก์ชันสำหรับจัดการการลบข้อมูล ใช้ Swal.fire เพื่อแสดง dialog ยืนยันก่อนลบ
  const handleDelete = (id: number, lotNo: string) => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: `คุณต้องการลบรายงาน Lot No: "${lotNo}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'delete',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'dark:bg-boxdark dark:text-white',
        confirmButton: 'inline-flex items-center justify-center rounded-md bg-danger py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6',
        cancelButton: 'ml-3 inline-flex items-center justify-center rounded-md bg-primary py-2 px-5 text-center font-medium text-white hover:bg-opacity-90 lg:px-6'
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 1. ยิง API ก่อน
          await deleteSubmission(id);

          // 2. เริ่ม Animation โดยการ set ID
          setDeletingRowId(id);
          fireToast('success', `รายงาน Lot No: "${lotNo}" ถูกลบแล้ว`);

          // 3. ตั้งเวลา 500ms (0.5 วินาที) ให้เท่ากับความยาว animation
          setTimeout(() => {
            // 4. เมื่อครบเวลา ค่อยลบออกจาก State จริงๆ
            setSubmissions(prev => prev.filter(s => s.submission_id !== id));
            setDeletingRowId(null); // เคลียร์ค่า state
          }, 500);

        } catch (error) {
          console.error("Failed to delete submission:", error);
          fireToast('error', 'ไม่สามารถลบรายงานได้');
        }
      }
    });
  };

  // --- 3.7. TABLE INSTANCE CREATION ---
  // สร้าง instance ของตารางด้วย `useReactTable` hook
  // โดยส่งข้อมูล (data), โครงสร้างคอลัมน์ (columns), และ state การกรองต่างๆ เข้าไป
  const table = useReactTable({
    data: submissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  // --- 3.8. JSX RENDERING ---
  // ส่วนของการแสดงผล UI ของคอมโพเนนต์
  return (
    <>
      <Breadcrumb pageName="ประวัติการบันทึก (Report History)" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        {/* --- ส่วนของปุ่มและ Action ต่างๆ ด้านบนตาราง --- */}
        <div className="flex justify-end mb-4">
          <Link
            to="/forms/form-elements-gen-a"
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg>
            </span>
            Add New Report
          </Link>
        </div>

        {/* --- ส่วนของการค้นหาและกรองข้อมูล --- */}
        <div className="mb-4 flex items-center gap-4">
          {/* ช่องค้นหาแบบ Global */}
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="ค้นหา Lot No, ผู้บันทึก..."
            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          />
          {/* Component สำหรับเลือกช่วงวันที่ */}
          <div className="w-100">
            <Datepicker
              value={dateRange}
              onChange={(newValue) => setDateRange(newValue)}
              placeholder="เลือกช่วงวันที่"
              inputClassName="w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-4 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>

        {/* --- ส่วนของตารางแสดงผล --- */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            {/* --- ส่วนหัวตาราง (Header) --- */}
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-gray-2 text-left dark:bg-meta-4">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="py-4 px-4 font-medium text-black dark:text-white">
                      {/* `flexRender` จะทำหน้าที่ render header ตามที่กำหนดใน `columns` */}
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {/* --- ส่วนเนื้อหาของตาราง (Body) --- */}
            <tbody>
              {table.getRowModel().rows.map(row => {
                const isHighlighted = row.original.submission_id === highlightedId;
                const isDeleting = row.original.submission_id === deletingRowId;

                return (
                  <tr
                    key={row.id}
                    className={`${isHighlighted ? 'highlight-row' : ''} ${isDeleting ? 'deleting-row' : ''}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ReportHistory_GEN_A;