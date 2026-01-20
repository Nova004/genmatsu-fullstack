// location: frontend/src/pages/Reports/ReportHistory_Gen_Recycle.tsx

// =============================================================================
// --- 1. IMPORT STATEMENTS ---
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnFiltersState,
} from '@tanstack/react-table';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";

// Custom Components & Hooks
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import Loader from '../../common/Loader';
import { Tooltip } from '../../components/Tooltip';
import { useAuth } from "../../context/AuthContext";
import { fireToast } from '../../hooks/fireToast';
import { getStatusColorClass } from '../../utils/statusHelpers';

// Services
import { ironpowderService } from '../../services/ironpowder.service';
import { socket } from '../../services/socket';

// Config
import { availableForms_Recycle } from '../../components/formGen/pages/Recycle/availableForms_Recycle';

// Icons
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

// =============================================================================
// --- 2. INTERFACES ---
// =============================================================================
interface IronpowderSubmission {
  submissionId: number;
  lot_no: string;
  report_date: string;
  machine_name: string;
  total_input: number;
  total_output: number;
  diff_weight: number;
  status: string;
  submitted_by: string;
  submitted_by_name: string; // ✅ เพิ่มชื่อผู้บันทึก
  created_at: string;
  form_type: string;
}

const ReportHistory_Gen_Recycle: React.FC = () => {
  // --- State Management ---
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<IronpowderSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalFilter, setGlobalFilter] = useState('');

  // Advanced Filters
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterFormType, setFilterFormType] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [dateValue, setDateValue] = useState<DateValueType>({
    startDate: null,
    endDate: null,
  });

  // Animation States
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);

  // --- 3. DATA FETCHING ---
  const fetchData = async () => {
    try {
      const result = await ironpowderService.getAllIronpowder();
      const rawData = Array.isArray(result) ? result : result.data || [];
      // Map data if necessary, though backend should return correct structure now
      setData(rawData);
    } catch (error) {
      console.error('Error fetching ironpowder history:', error);
      fireToast('error', 'Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket Listeners
    socket.on('ironpowder_updated', (updatedId: number) => {
      fetchData();
      setHighlightedId(updatedId);
      setTimeout(() => setHighlightedId(null), 3000);
    });

    socket.on('ironpowder_created', () => {
      fetchData();
    });

    socket.on('ironpowder_deleted', () => {
      fetchData();
    });

    return () => {
      socket.off('ironpowder_updated');
      socket.off('ironpowder_created');
      socket.off('ironpowder_deleted');
    };
  }, []);

  // --- 4. FILTERING LOGIC ---
  useEffect(() => {
    const newFilters = [];

    // 1. Date Range
    if (dateValue?.startDate) {
      newFilters.push({
        id: 'report_date',
        value: dateValue,
      });
    }

    // 2. Form Type
    if (filterFormType) {
      newFilters.push({
        id: 'form_type',
        value: filterFormType,
      });
    }

    // 3. User Name
    if (filterUser) {
      newFilters.push({
        id: 'submitted_by_name',
        value: filterUser,
      });
    }

    // 4. Status
    if (filterStatus) {
      newFilters.push({
        id: 'status',
        value: filterStatus,
      });
    }

    setColumnFilters(newFilters);
  }, [dateValue, filterFormType, filterUser, filterStatus]);

  // --- 5. HANDLERS ---


  const handleDelete = async (id: number, lotNo: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete Lot No: ${lotNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        setDeletingRowId(id);
        await ironpowderService.deleteIronpowder(id);

        setTimeout(() => {
          setDeletingRowId(null);
          fetchData();
        }, 500);

        fireToast('success', 'Record has been deleted.');
      } catch (error) {
        setDeletingRowId(null);
        console.error('Delete error:', error);
        fireToast('error', 'Failed to delete record.');
      }
    }
  };

  // --- 6. TABLE CONFIGURATION ---
  const columnHelper = createColumnHelper<IronpowderSubmission>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('submissionId', {
        header: 'ID',
        cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
      }),
      columnHelper.accessor('lot_no', {
        header: 'Lot No',
        cell: (info) => <span className="font-medium text-black dark:text-white">{info.getValue()}</span>,
      }),
      columnHelper.accessor('form_type', {
        header: 'Form Type',
        cell: (info) => <span className="text-sm">{info.getValue()}</span>,
      }),
      columnHelper.accessor('submitted_by_name', {
        header: 'User',
        cell: (info) => <span className="text-sm">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('report_date', {
        header: 'Report Date',
        cell: (info) => {
          const dateVal = info.getValue();
          // Fallback to created_at if report_date is null
          const displayDate = dateVal || info.row.original.created_at;

          if (!displayDate) return '-';

          return new Date(displayDate).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        },
        filterFn: (row, columnId, filterValue: DateValueType) => {
          if (!filterValue?.startDate) return true;
          const val = row.getValue(columnId) as string;
          if (!val) return false;

          const rowDate = new Date(val);
          const start = new Date(filterValue.startDate);
          const end = new Date(filterValue.endDate || filterValue.startDate);

          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          return rowDate >= start && rowDate <= end;
        }
      }),
      columnHelper.accessor('machine_name', {
        header: 'Machine',
        cell: (info) => info.getValue() || '-',
      }),
      // รวม Input/Output/Diff ไว้ในคอลัมน์เดียว หรือแยกก็ได้ตามดีไซน์
      // แต่เอาตามเดิมคือแยก
      columnHelper.accessor('total_input', {
        header: 'Input (kg)',
        cell: (info) => (
          <span className="text-black dark:text-gray-200">
            {Number(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      }),
      columnHelper.accessor('total_output', {
        header: 'Output (kg)',
        cell: (info) => (
          <span className="text-black dark:text-gray-200">
            {Number(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      }),
      columnHelper.accessor('diff_weight', {
        header: 'Diff',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          const isWarning = Math.abs(val) > 5;
          return (
            <span className={`font-bold ${isWarning ? 'text-danger' : 'text-success'}`}>
              {val > 0 ? '+' : ''}{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusColorClass(status)}`}>
              {status}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => <div className="flex items-center space-x-3.5" onClick={(e) => e.stopPropagation()}>
          {/* View Button */}
          <Tooltip message="View Details">
            <button
              onClick={() => navigate(`/form-generator/recycle/view/${info.row.original.submissionId}`)}
              className="hover:text-primary transition-colors"
              type="button"
            >
              <FaEye size={18} />
            </button>
          </Tooltip>

          {/* Edit Button */}
          {['Draft', 'Rejected', 'Pending', 'Drafted'].includes(info.row.original.status) && (
            <Tooltip message="Edit">
              <button
                onClick={() => navigate(`/form-generator/recycle/edit/${info.row.original.submissionId}`)}
                className="hover:text-warning transition-colors"
                type="button"
              >
                <FaEdit size={18} />
              </button>
            </Tooltip>
          )}

          {/* Delete Button */}
          <Tooltip message="Delete">
            <button
              onClick={(e) => handleDelete(info.row.original.submissionId, info.row.original.lot_no, e)}
              className="hover:text-danger transition-colors"
              type="button"
            >
              <FaTrash size={18} />
            </button>
          </Tooltip>
        </div>
      }),
    ],
    [navigate]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    }
  });

  if (loading) return <Loader />;

  return (
    <>
      <Breadcrumb pageName="Recycle Reports History" />

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        {/* ======================================================================== */}
        {/* 🟢 PREMUIUM LAYOUT HEADER                                                 */}
        {/* ======================================================================== */}
        <div className="mb-6 space-y-4">

          {/* Top Row: Global Search & Primary Action */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Global Search */}
            <div className="relative flex-1 max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search by Lot No, ID, Machine..."
                className="w-full rounded-lg border border-stroke bg-white py-3 pl-11 pr-4 text-sm text-black placeholder-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-form-input dark:text-white"
              />
            </div>

            {/* Create Button */}
            <div className="shrink-0">
              <Link
                to="/form-generator/recycle/create"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-primary py-3 px-6 text-sm font-medium text-white shadow-md hover:bg-opacity-90 hover:shadow-lg transition-all sm:w-auto"
              >
                <FaPlus />
                Create New
              </Link>
            </div>
          </div>

          {/* Bottom Row: Advanced Filters */}
          <div className="rounded-lg border border-stroke bg-gray-50/80 p-4 dark:border-strokedark dark:bg-meta-4/30">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                Filters:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-1 lg:items-center gap-3">
                {/* Date Picker */}
                <div className="w-full lg:w-64">
                  <Datepicker
                    value={dateValue}
                    onChange={setDateValue}
                    placeholder="Date Range"
                    inputClassName="w-full rounded-md border border-stroke bg-white py-2.5 px-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                    toggleClassName="absolute right-0 top-0 h-full px-3 text-gray-400 focus:outline-none"
                  />
                </div>

                {/* Form Type */}
                <div className="relative w-full lg:w-48">
                  <select
                    className="w-full appearance-none rounded-md border border-stroke bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white cursor-pointer"
                    value={filterFormType}
                    onChange={(e) => setFilterFormType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {availableForms_Recycle.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Search */}
                <div className="relative w-full lg:w-48">
                  <input
                    type="text"
                    placeholder="User Name"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="w-full rounded-md border border-stroke bg-white py-2.5 px-4 text-sm font-medium text-black outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                {/* Status */}
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
                </div>

                {/* Clear Filters */}
                {(filterFormType || filterUser || filterStatus || dateValue?.startDate) && (
                  <button
                    onClick={() => {
                      setFilterFormType('');
                      setFilterUser('');
                      setFilterStatus('');
                      setDateValue({ startDate: null, endDate: null });
                      setGlobalFilter('');
                    }}
                    className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Table Area --- */}
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-2 text-left dark:bg-meta-4">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="py-4 px-4 font-medium text-black dark:text-white cursor-pointer hover:bg-gray-3 dark:hover:bg-meta-4 transition-colors" onClick={header.column.getToggleSortingHandler()}>
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && ' 🔼'}
                        {header.column.getIsSorted() === 'desc' && ' 🔽'}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const isHighlighted = row.original.submissionId === highlightedId;
                  const isDeleting = row.original.submissionId === deletingRowId;

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[#eee] dark:border-strokedark transition-all duration-300 hover:bg-gray-1 dark:hover:bg-meta-4
                                ${isHighlighted ? 'highlight-row' : ''}
                                ${isDeleting ? 'deleting-row' : ''}
                            `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-5 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-stroke dark:border-strokedark gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({table.getFilteredRowModel().rows.length} items)
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border border-stroke hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded border border-stroke hover:bg-gray-100 dark:border-strokedark dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportHistory_Gen_Recycle;