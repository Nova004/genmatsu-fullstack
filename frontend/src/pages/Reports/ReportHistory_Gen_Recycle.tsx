// location: frontend/src/pages/Reports/ReportHistory_Gen_Recycle.tsx

// =============================================================================
// --- 1. IMPORT STATEMENTS ---
// นำเข้าไลบรารีและคอมโพเนนต์ที่จำเป็นทั้งหมด
// =============================================================================
import { socket } from '../../services/socket';
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ironpowderService } from '../../services/ironpowder.service'; // ยังต้องใช้สำหรับ Delete? หรือใช้ service รวมได้? deleteSubmission น่าจะใช้ได้ถ้ารวม ID
// Recycle ใช้ deleteIronpowder ซึ่งอาจจะไม่เหมือน deleteSubmission...
// เพื่อความชัวร์ ใช้ ironpowderService.deleteIronpowder ใน handleDelete ของตัวเองดีกว่า
// หรือ... ใน handleDelete ถ้าเป็น Recycle ก็เรียก ironpowderService
import { generatePdfById } from '../../services/submissionService';
import { FaHistory, FaFileAlt } from 'react-icons/fa';
// Print ของ Recycle ใช้ backend path ไหน? ในไฟล์เดิมใช้ `/genmatsu/api/submissions/print/${id}` เหมือนกน
import { useReportHistoryData } from './hooks/useReportHistoryData';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { fireToast } from '../../hooks/fireToast';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import { useAuth } from "../../context/AuthContext";
import { availableForms } from '../../components/formGen/pages/Recycle/availableForms_Recycle';
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
const ReportHistory_Gen_Recycle: React.FC = () => {

  // --- 3.1. STATE MANAGEMENT & DATA FETCHING (VIA HOOK) ---
  const { submissions, totalRows, isLoading, error, fetchSubmissions } = useReportHistoryData('Recycle');

  // UI State
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);
  const [filterFormType, setFilterFormType] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateValueType>({ startDate: null, endDate: null });
  const [printingId, setPrintingId] = useState<number | null>(null);

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
  const [searchParams] = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Effect to handle highlighting and fade out
  useEffect(() => {
    const idFromState = location.state?.highlightedId;
    const idFromUrl = Number(searchParams.get('highlight'));

    if (idFromState || idFromUrl) {
      setHighlightedId(idFromState || idFromUrl);
      const timer = setTimeout(() => {
        setHighlightedId(null);
        window.history.replaceState({}, document.title);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, searchParams]);
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
          setDeletingRowId(id); // 🔴 Start Animation

          // Wait for animation (e.g., 500ms) before actual delete or refresh
          setTimeout(async () => {
            try {
              // 🛑 For Recycle, we MUST use ironpowderService.deleteIronpowder
              await ironpowderService.deleteIronpowder(id);
              fireToast('success', `รายงาน Lot No: "${lotNo}" ถูกลบแล้ว`);

              // Refetch to stay consistent
              fetchSubmissions(pageIndex, pageSize, {
                search: globalFilter,
                startDate: dateRange,
                status: filterStatus,
                formType: filterFormType,
                user: filterUser
              });
            } catch (error) {
              console.error("Failed to delete submission:", error);
              fireToast('error', 'ไม่สามารถลบรายงานได้');
              setDeletingRowId(null); // Revert animation if failed
            } finally {
              setDeletingRowId(null);
            }
          },  1000); // ⏳ Delay for animation
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
      const blob = await generatePdfById(id.toString()); // ใช้ PDF Gen ตัวเดิมได้ (Backend น่าจะ handle)
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
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
      printingId,
      category: 'Recycle' // ✅ ส่ง category ไปบอก Columns
    }),
    [highlightedId, deletingRowId, user, printingId]
  );


  // --- 3.7. TABLE INSTANCE CREATION ---
  const table = useReactTable({
    data: submissions,
    columns,
    pageCount: Math.ceil(totalRows / pageSize),
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
      <Breadcrumb pageName="Record GEN-Recycle History" />

      <div className="flex flex-col gap-6">
        {/* 🔍 Controls Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <ReportTableToolbar
            title={
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </span>
                Filter History
              </h2>
            }
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
            createLink="/forms/ironpowder-form"
          />
        </div>

        {/* 📋 Data Table Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-strokedark flex justify-between items-center bg-gray-50/50 dark:bg-meta-4/30">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaFileAlt className="text-gray-400" />
              Report List
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                {totalRows} Records
              </span>
            </h3>
          </div>

          {/* --- ส่วนของตารางแสดงผล --- */}
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full text-left">
              {/* --- ส่วนหัวตาราง (Header) --- */}
              <thead className="bg-gray-50 dark:bg-meta-4">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
              <tbody className={`divide-y divide-gray-200 dark:divide-strokedark ${isLoading && table.getRowModel().rows.length > 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {/* 1. Initial Loading (No Data) */}
                {isLoading && table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <span className="mt-2 text-base text-gray-500">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* 2. Error State */}
                {error && !isLoading && (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="p-10 text-center text-red-500">
                      Error: {error}
                    </td>
                  </tr>
                )}

                {/* 3. Empty State */}
                {!isLoading && !error && table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="p-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-3 rounded-full mb-3 dark:bg-meta-4">
                          <FaHistory className="text-gray-400 text-xl" />
                        </div>
                        <span className="text-base">No records found.</span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* 4. Data Rows (Always render if exist) */}
                {table.getRowModel().rows.map(row => {
                  const isHighlighted = row.original.submission_id === highlightedId;
                  const isDeleting = row.original.submission_id === deletingRowId;

                  return (
                    <tr
                      key={row.id}
                      className={`group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all duration-1000 ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} ${isDeleting ? 'bg-red-100 dark:bg-red-900/20 opacity-50 pointer-events-none' : ''}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-base text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-strokedark">
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
          <div className="border-t border-gray-200 dark:border-strokedark">
            <TablePagination table={table} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportHistory_Gen_Recycle;