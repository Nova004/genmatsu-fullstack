// location: frontend/src/pages/Reports/ReportHistory_Gen_Recycle.tsx

// =============================================================================
// --- 1. IMPORT STATEMENTS ---
// นำเข้าไลบรารีและคอมโพเนนต์ที่จำเป็นทั้งหมด
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'; // เพิ่ม useNavigate
import { ironpowderService } from '../../services/ironpowder.service.ts';
import { socket } from '../../services/socket';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { getStatusColorClass } from '../../utils/statusHelpers'; // 👈 เพิ่มบรรทัดนี้
import { fireToast } from '../../hooks/fireToast';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import { useAuth } from "../../context/AuthContext";
import { Tooltip } from '../../components/Tooltip';
import { availableForms } from '../../components/formGen/pages/GEN_A/availableForms_GENA';
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
  submissionId: number;
  lot_no: string;
  submitted_at: string;
  status: string;
  form_type: string;
  pending_level?: number;
  submitted_by_name: string; // 👈 เพิ่มชื่อเต็ม
  submitted_by: string | number; // 👈 เพิ่ม submitted_by (ID)
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
  const [filterFormType, setFilterFormType] = useState<string>(''); // เก็บค่า Form Type
  const [filterUser, setFilterUser] = useState<string>(''); // เก็บชื่อคนบันทึก
  const [filterStatus, setFilterStatus] = useState<string>('');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const highlightedId = location.state?.highlightedId || Number(searchParams.get('highlight')); // Support both state and query param
  const [dateRange, setDateRange] = useState<DateValueType>({        // State สำหรับเก็บช่วงวันที่ที่ผู้ใช้เลือก
    startDate: null,
    endDate: null
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const searchFromUrl = searchParams.get('search'); // ดึงคำหลัง ?search=...

    if (searchFromUrl) {
      setGlobalFilter(searchFromUrl); // ยัดใส่ช่องค้นหาของตาราง
    }
  }, [searchParams]); // ทำงานทุกครั้งที่ URL เปลี่ยน

  // --- 3.2. DATA FETCHING EFFECT ---
  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      // 1. ดึงข้อมูลมาเป็น any หรือ type เดิมก่อน (เพื่อเลี่ยง error ตอนรับค่า)
      const response = await ironpowderService.getAllIronpowder();

      // 2. แปลงข้อมูล (Map) ให้ตรงกับ SubmissionData
      const formattedData: SubmissionData[] = response.map((item: any) => ({
        submissionId: item.submissionId,
        lot_no: item.lot_no,
        submitted_at: item.report_date || item.created_at, // ใช้ report_date เป็นหลัก
        status: item.status,
        form_type: item.machine_name || 'Recycle', // Map machine_name หรือค่า default
        production_date: item.report_date,
        pending_level: item.pending_level,
        submitted_by_name: item.submitted_by_name || item.submitted_by || 'Unknown', // ใช้ชื่อที่ join มา
        submitted_by: item.submitted_by, // เก็บ ID ไว้เช็คสิทธิ์ (สำคัญ)
        category: 'Recycle' // ✅ ระบุ category ชัดเจน
      }));

      setSubmissions(formattedData);
    } catch (err) {
      console.error(err); // Log error ดูด้วย
      setError('ไม่สามารถดึงข้อมูลประวัติการบันทึก (Recycle) ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // ✅ Socket.io listener for real-time updates
  useEffect(() => {
    const handleServerAction = (data: any) => {
      console.log("⚡ Real-time update received:", data);

      if (data.action === 'refresh_data') {
        // เช็คว่า update นี้เกี่ยวกับ Ironpowder หรือไม่ (อาจจะเช็ค ID หรือรับ parameter เพิ่มจาก Backend)
        // เพื่อความง่าย ให้ refresh ไปก่อน เพราะปริมาณข้อมูลไม่เยอะมาก
        if (data.deletedId) {
          setSubmissions(prev => prev.filter(item => item.submissionId !== parseInt(data.deletedId)));
        } else {
          fetchSubmissions();
        }
      }
    };

    socket.on('server-action', handleServerAction);

    return () => {
      socket.off('server-action', handleServerAction);
    };
  }, []);

  const handlePrint = (id: number) => {
    // TODO: Implement Print Logic for Ironpowder if API exists
    // window.open(`/genmatsu/api/submissions/print/ironpowder/${id}`, '_blank');
    fireToast('info', 'ฟังก์ชันพิมพ์รายงาน Ironpowder กำลังพัฒนา');
  };

  // --- 3.3. FILTERING EFFECT (รวมพลังกรอง 4 ทิศทาง) ---
  // แก้ไขจากของเดิมที่กรองแค่วันที่ ให้กรองครบทุกเงื่อนไข
  useEffect(() => {
    const newFilters = [];

    // 1. Filter วันที่ (Date Range)
    if (dateRange?.startDate) {
      newFilters.push({
        id: 'production_date', // ต้องตรงกับ accessorKey ใน columns
        value: dateRange,
      });
    }

    // 2. Filter Form Type (Dropdown)
    if (filterFormType) {
      newFilters.push({
        id: 'form_type',
        value: filterFormType,
      });
    }

    // 3. Filter User (Input พิมพ์ค้นหา)
    if (filterUser) {
      newFilters.push({
        id: 'submitted_by_name', // ต้องตรงกับ accessorKey ใน columns
        value: filterUser,
      });
    }

    // 4. Filter Status (Dropdown)
    if (filterStatus) {
      newFilters.push({
        id: 'status',
        value: filterStatus,
      });
    }

    // อัปเดตตารางทีเดียว
    setColumnFilters(newFilters);

  }, [dateRange, filterFormType, filterUser, filterStatus]); // ✅ ใส่ Dependency ให้ครบ


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
        accessorKey: 'submissionId', // ใช้ชื่อ field ใหม่
        header: 'ID Job',
      },
      {
        accessorKey: 'lot_no',
        header: 'Lot No.',
      },
      {
        accessorKey: 'form_type',
        header: 'Machine / Type',
      },
      {
        accessorKey: 'submitted_by_name', // แสดงชื่อคน
        header: 'ผู้บันทึก',
      },
      {
        accessorKey: 'production_date',
        header: 'วันที่ผลิต',
        cell: info => {
          const val = info.getValue<string>();
          if (!val) return "-";
          const dateObj = new Date(val);
          if (isNaN(dateObj.getTime())) return "-";
          return dateObj.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        },
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !filterValue.startDate) return true;
          const rowValue = row.getValue(columnId);
          if (!rowValue) return false;
          const rowDate = new Date(rowValue as string);
          const startDate = new Date(filterValue.startDate);
          const endDate = new Date(filterValue.endDate || filterValue.startDate);
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
                      onClick={() => navigate(`/reports/view/recycle/${submission.submissionId}`)} // URL สำหรับดู Recycle (ถ้าแยก Route) หรือใช้ Route เดิมแต่วิ่งไป Dispatcher
                      className="relative hover:text-primary" // ต้องมี relative เพื่อให้จุดแดงอ้างอิงตำแหน่งได้
                    >
                      {/* SVG ไอคอนรูปตา */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
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
                // เช็คสิทธิ์: เป็นคนสร้าง (เทียบ ID) หรือเป็น Admin Level 3
                // submission.submitted_by ควรเป็น ID
                const isOwner = String(user?.id) === String(submission.submitted_by);
                const isNeedsEdit = submission.status === 'Rejected' && isOwner;

                const canEdit = (
                  isOwner || (user?.LV_Approvals === 3)
                ) && (submission.status !== "Approved");

                const tooltipText = isNeedsEdit ? "งานถูกตีกลับ กรุณาแก้ไข" : "แก้ไขข้อมูล";

                return canEdit && (
                  // 🟡 เรียกใช้ Component ตรงนี้ (ส่งข้อความผ่าน prop message)
                  <Tooltip message={tooltipText}>
                    <button
                      type="button"
                      onClick={() => navigate(`/reports/edit/recycle/${submission.submissionId}`)}
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
                (String(user?.id) === String(submission.submitted_by)) ||
                (user?.LV_Approvals === 3)
              )
                &&
                (submission.status !== "Approved") &&       // และ ต้องยังไม่ Approved
                (
                  // 🟡 เพิ่ม Tooltip ครอบปุ่ม Delete
                  <Tooltip message="ลบรายการนี้">
                    <button
                      onClick={() => handleDelete(submission.submissionId, submission.lot_no)}
                      className="hover:text-danger"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </Tooltip>
                )}

              {/* ปุ่ม Print (Placeholder) */}
              <Tooltip message="พิมพ์รายงาน (Coming Soon)">
                <button
                  onClick={() => handlePrint(submission.submissionId)}
                  className="hover:text-blue-500 opacity-50 cursor-not-allowed"
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
      text: `คุณต้องการลบรายงาน Lot No: "${lotNo}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
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
          await ironpowderService.deleteIronpowder(id); // Use correct service
          setDeletingRowId(id);
          fireToast('success', `รายงาน Lot No: "${lotNo}" ถูกลบแล้ว`);

          // 3. ตั้งเวลา 500ms (0.5 วินาที) ให้เท่ากับความยาว animation
          setTimeout(() => {
            // 4. เมื่อครบเวลา ค่อยลบออกจาก State จริงๆ
            setSubmissions(prev => prev.filter(s => s.submissionId !== id));
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
        {/* ======================================================================== */}
        {/* 🟢 SECTION: TOOLBAR & CONTROLS (PREMIUM LAYOUT)                          */}
        {/* ======================================================================== */}
        <div className="mb-6 space-y-4">

          {/* --- 1. Top Row: Global Search & Primary Action --- */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* Left: Global Search Box */}
            <div className="relative flex-1 max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Search by Lot No, ID, Name..."
                className="w-full rounded-lg border border-stroke bg-white py-3 pl-11 pr-4 text-sm text-black placeholder-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            {/* Right: Primary Action Button */}
            <div className="shrink-0">
              <Link
                to="/forms/ironpowder-form"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-primary py-3 px-6 text-sm font-medium text-white shadow-md hover:bg-opacity-90 hover:shadow-lg transition-all sm:w-auto"
              >
                <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M15 7H9V1C9 0.447715 8.55228 0 8 0C7.44772 0 7 0.447715 7 1V7H1C0.447715 7 0 7.44772 0 8C0 8.55228 0.447715 9 1 9H7V15C7 15.5523 7.44772 16 8 16C8.55228 16 9 15.5523 9 15V9H15C15.5523 9 16 8.5523 16 8C16 7.44772 15.5523 7 15 7Z" /></svg>
                Create Report
              </Link>
            </div>
          </div>

          {/* --- 2. Bottom Row: Advanced Filters (Refined) --- */}
          <div className="rounded-lg border border-stroke bg-gray-50/80 p-4 dark:border-strokedark dark:bg-meta-4/30">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">

              {/* Label & Icon */}
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Filters:
              </div>

              {/* Filter Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-1 lg:items-center gap-3">

                {/* 📅 Date Picker */}
                <div className="w-full lg:w-64">
                  <Datepicker
                    value={dateRange}
                    onChange={(newValue) => setDateRange(newValue)}
                    placeholder="Date Range"
                    inputClassName="w-full rounded-md border border-stroke bg-white py-2.5 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                    toggleClassName="absolute right-0 top-0 h-full px-3 text-gray-400 focus:outline-none"
                  />
                </div>

                {/* Filter: Form Type (Dynamic from availableForms) */}
                <div className="relative w-full lg:w-48">
                  <select
                    className="w-full appearance-none rounded-md border border-stroke bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white cursor-pointer"
                    value={filterFormType}
                    onChange={(e) => setFilterFormType(e.target.value)}
                  >
                    <option value="">All Types</option>

                    {/* 👇 วนลูปสร้าง Option จากไฟล์ availableForms_GENA.ts */}
                    {availableForms.map((form) => (
                      <option key={form.value} value={form.value}>
                        {form.label}
                      </option>
                    ))}

                  </select>
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.970484 0.558983 0.911642C0.676668 0.793958 0.882613 0.793958 1.0003 0.911642L5.00015 4.91149L8.99999 0.911642C9.11768 0.793958 9.32362 0.793958 9.44131 0.911642C9.55899 1.02933 9.55899 1.23527 9.44131 1.35295L5.22081 5.57345C5.10312 5.69114 4.89718 5.69114 4.77949 5.57345L0.558983 1.35295C0.500141 1.29411 0.47072 1.23527 0.47072 1.17643V1.08816Z" fill="currentColor" /></svg>
                  </span>
                </div>

                {/* 👤 User Search (Input) */}
                <div className="relative w-full lg:w-48">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="User Name"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="w-full rounded-md border border-stroke bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                {/* ⚡ Status Select */}
                <div className="relative w-full lg:w-40">
                  <select
                    className="w-full appearance-none rounded-md border border-stroke bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Drafted">Drafted</option>
                  </select>
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.970484 0.558983 0.911642C0.676668 0.793958 0.882613 0.793958 1.0003 0.911642L5.00015 4.91149L8.99999 0.911642C9.11768 0.793958 9.32362 0.793958 9.44131 0.911642C9.55899 1.02933 9.55899 1.23527 9.44131 1.35295L5.22081 5.57345C5.10312 5.69114 4.89718 5.69114 4.77949 5.57345L0.558983 1.35295C0.500141 1.29411 0.47072 1.23527 0.47072 1.17643V1.08816Z" fill="currentColor" /></svg>
                  </span>
                </div>

                {/* 🧹 Clear Button (Ghost Style - Cleanest) */}
                {(filterFormType || filterUser || filterStatus || dateRange?.startDate) && (
                  <button
                    onClick={() => {
                      setFilterFormType('');
                      setFilterUser('');
                      setFilterStatus('');
                      setDateRange({ startDate: null, endDate: null });
                      setGlobalFilter('');
                    }}
                    className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Reset all filters"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
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
                const isHighlighted = row.original.submissionId === highlightedId;
                const isDeleting = row.original.submissionId === deletingRowId;

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