// location: frontend/src/pages/Reports/ReportHistory_GEN_B.tsx

// =============================================================================
// --- 1. IMPORT STATEMENTS ---
// นำเข้าไลบรารีและคอมโพเนนต์ที่จำเป็นทั้งหมด
// =============================================================================
import { socket } from '../../services/socket';
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { deleteSubmission, generatePdfById } from '../../services/submissionService';
import { useReportHistoryData } from './hooks/useReportHistoryData';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { fireToast } from '../../hooks/fireToast';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import { useAuth } from "../../context/AuthContext";
import { availableForms } from '../../components/formGen/pages/GEN_B/availableForms_GENB';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { DateValueType } from "react-tailwindcss-datepicker";
import { TablePagination } from '../../components/Tables/TablePagination';
import { ReportTableToolbar } from './components/ReportTableToolbar';
import { getReportColumns } from './components/ReportTableColumns';
import { SubmissionData } from './components/types';

// =============================================================================
// --- 3. COMPONENT DEFINITION ---
// ReportHistory Component: หน้าสำหรับแสดงประวัติการบันทึกทั้งหมดในรูปแบบตาราง
// =============================================================================
const ReportHistory_GEN_B: React.FC = () => {

  // --- 3.1. STATE MANAGEMENT & DATA FETCHING (VIA HOOK) ---
  const { submissions, setSubmissions, totalRows, isLoading, error, fetchSubmissions } = useReportHistoryData('GEN_B');

  // UI State
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);
  const [filterFormType, setFilterFormType] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateValueType>({ startDate: null, endDate: null });
  const [printingId, setPrintingId] = useState<number | null>(null); // ✅ State สำหรับ Button Loading

  // Pagination State
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

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

  // --- 3.3. DATA FETCHING TRIGGER ---
  // Fetch data when pagination or filters change
  useEffect(() => {
    fetchSubmissions(pageIndex, pageSize, {
      search: globalFilter,
      startDate: dateRange,
      status: filterStatus,
      formType: filterFormType,
      user: filterUser
    });
  }, [pageIndex, pageSize, globalFilter, filterStatus, filterFormType, dateRange, filterUser]);

  // --- 3.4. REAL-TIME UPDATES (Socket.io) ---
  useEffect(() => {
    const handleServerAction = (data: any) => {
      if (data.action === 'refresh_data') {
        fetchSubmissions(pageIndex, pageSize, {
          search: globalFilter,
          startDate: dateRange,
          status: filterStatus,
          formType: filterFormType,
          user: filterUser
        });
      }
    };

    socket.on('server-action', handleServerAction);
    return () => {
      socket.off('server-action', handleServerAction);
    };
  }, [pageIndex, pageSize, globalFilter, filterStatus, filterFormType, dateRange, filterUser, fetchSubmissions]);


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
            // Refetch to stay consistent
            fetchSubmissions(pageIndex, pageSize, {
              search: globalFilter,
              startDate: dateRange,
              status: filterStatus,
              formType: filterFormType,
              user: filterUser
            });
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
    [highlightedId, deletingRowId, user, printingId]
  );


  // --- 3.7. TABLE INSTANCE CREATION ---
  const table = useReactTable({
    data: submissions,
    columns,
    pageCount: Math.ceil(totalRows / pageSize), // ✅ Pass pageCount
    state: {
      pagination,
      globalFilter,
      columnFilters,
    },
    manualPagination: true,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  // --- 3.8. JSX RENDERING ---
  return (
    <>
      <Breadcrumb pageName="Record History GEN B" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">

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
          availableForms={availableForms} // ✅ Use GEN_B Forms
          createLink="/forms/form-elements-gen-b" // ✅ Link to GEN_B
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

export default ReportHistory_GEN_B;