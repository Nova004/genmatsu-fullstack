// location: frontend/src/pages/Reports/ReportHistory_Gen_A.tsx

// =============================================================================
// --- 1. IMPORT STATEMENTS ---
// นำเข้าไลบรารีและคอมโพเนนต์ที่จำเป็นทั้งหมด
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'; // เพิ่ม useNavigate
import { deleteSubmission, generatePdfById } from '../../services/submissionService';
import { useReportHistoryData } from './hooks/useReportHistoryData';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { fireToast } from '../../hooks/fireToast';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import { useAuth } from "../../context/AuthContext";
import { availableForms } from '../../components/formGen/pages/GEN_A/availableForms_GENA';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel, // 👈 เพิ่ม import
  flexRender,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table';
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import { TablePagination } from '../../components/Tables/TablePagination'; // ✅ Import Pagination
import { ReportTableToolbar } from './components/ReportTableToolbar'; // ✅ Import Toolbar
import { getReportColumns } from './components/ReportTableColumns'; // ✅ Import Columns
import { SubmissionData } from './components/types'; // ✅ Import Types




// =============================================================================
// --- 3. COMPONENT DEFINITION ---
// ReportHistory Component: หน้าสำหรับแสดงประวัติการบันทึกทั้งหมดในรูปแบบตาราง
// =============================================================================
const ReportHistory_GEN_A: React.FC = () => {

  // --- 3.1. STATE MANAGEMENT & DATA FETCHING (VIA HOOK) ---
  const { submissions, setSubmissions, isLoading, error } = useReportHistoryData('GEN_A');

  // UI State
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);
  const [filterFormType, setFilterFormType] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateValueType>({ startDate: null, endDate: null });
  const [printingId, setPrintingId] = useState<number | null>(null); // ✅ State สำหรับ Button Loading

  const location = useLocation();
  const highlightedId = location.state?.highlightedId;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sync Search Params to Global Filter
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setGlobalFilter(searchFromUrl);
    }
  }, [searchParams]);

  // --- 3.3. FILTERING EFFECT (Consolidated) ---
  useEffect(() => {
    const newFilters = [];

    if (dateRange?.startDate) newFilters.push({ id: 'production_date', value: dateRange });
    if (filterFormType) newFilters.push({ id: 'form_type', value: filterFormType });
    if (filterUser) newFilters.push({ id: 'submitted_by_name', value: filterUser });
    if (filterStatus) newFilters.push({ id: 'status', value: filterStatus });

    setColumnFilters(newFilters);
  }, [dateRange, filterFormType, filterUser, filterStatus]);


  // --- 3.5. ACTION HANDLERS (DEFINED BEFORE COLUMNS) ---

  // ฟังก์ชันสำหรับจัดการการลบข้อมูล
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
          await deleteSubmission(id);
          setDeletingRowId(id);
          fireToast('success', `รายงาน Lot No: "${lotNo}" ถูกลบแล้ว`);
          setTimeout(() => {
            setSubmissions(prev => prev.filter(s => s.submission_id !== id));
            setDeletingRowId(null);
          }, 500);
        } catch (error) {
          console.error("Failed to delete submission:", error);
          fireToast('error', 'ไม่สามารถลบรายงานได้');
        }
      }
    });
  };

  // ฟังก์ชันสำหรับพิมพ์รายงาน
  const handlePrint = async (id: number) => {
    setPrintingId(id); // 🟡 เริ่ม Loading
    try {
      const blob = await generatePdfById(id.toString());
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // clean up url after some time? usually ok to leave for tab
    } catch (error) {
      console.error("Failed to print:", error);
      fireToast('error', 'ไม่สามารถสร้างไฟล์ PDF ได้');
    } finally {
      setPrintingId(null); // 🟢 จบ Loading
    }
  };

  // --- 3.6. TABLE COLUMN DEFINITIONS ---
  const columns = useMemo<ColumnDef<SubmissionData>[]>(
    () => getReportColumns({
      user,
      navigate,
      handleDelete,
      handlePrint,
      printingId // ✅ ส่ง State ไปให้ Columns Component
    }),
    [highlightedId, deletingRowId, user, printingId] // ✅ เพิ่ม printingId ใน dependency array
  );


  // --- 3.6. DELETE HANDLER ---
  // ฟังก์ชันสำหรับจัดการการลบข้อมูล ใช้ Swal.fire เพื่อแสดง dialog ยืนยันก่อนลบ


  // --- 3.7. TABLE INSTANCE CREATION ---
  // สร้าง instance ของตารางด้วย `useReactTable` hook
  // โดยส่งข้อมูล (data), โครงสร้างคอลัมน์ (columns), และ state การกรองต่างๆ เข้าไป
  const table = useReactTable({
    data: submissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // ✅ เพิ่ม Pagination Model
    state: {
      globalFilter,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10, // ✅ กำหนดให้แสดงหน้าละ 10 แถว
      },
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
        {/* ======================================================================== */}
        {/* 🟢 SECTION: TOOLBAR & CONTROLS (PREMIUM LAYOUT)                          */}
        {/* ======================================================================== */}
        <ReportTableToolbar
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filterFormType={filterFormType}
          setFilterFormType={setFilterFormType}
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}

          onClearFilters={() => {
            setFilterFormType('');
            setFilterUser('');
            setFilterStatus('');
            setDateRange({ startDate: null, endDate: null });
            setGlobalFilter('');
          }}
          availableForms={availableForms}
          createLink="/forms/form-elements-gen-a"
        />
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
        {/* --- Pagination Controls --- */}
        <TablePagination table={table} />
      </div >
    </>
  );
};

export default ReportHistory_GEN_A;