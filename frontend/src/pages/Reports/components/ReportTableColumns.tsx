import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { SubmissionData } from './types';
import { getStatusColorClass } from '../../../utils/statusHelpers';
import { Tooltip } from '../../../components/Tooltip';

interface GetColumnsProps {
    user: any; // Or specific User type if available
    navigate: (path: string) => void;
    handleDelete: (id: number, lotNo: string) => void;
    handlePrint: (id: number) => void;
    printingId?: number | null; // ✅ รับค่า printingId
    category?: string; // ✅ รับหมวดหมู่เพื่อกำหนด URL
}

export const getReportColumns = ({
    user,
    navigate,
    handleDelete,
    handlePrint,
    printingId, // ✅
    category // ✅
}: GetColumnsProps): ColumnDef<SubmissionData>[] => {
    return [
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
            header: category === 'Recycle' ? 'Machine Name' : 'Form Type',
        },
        {
            accessorKey: 'submitted_by_name',
            header: 'Record By',
        },
        {
            accessorKey: 'production_date',
            header: 'Date',
            cell: info => {
                const val = info.getValue<string>();
                if (!val) return "-";

                const dateObj = new Date(val);
                if (isNaN(dateObj.getTime())) return "-";

                return dateObj.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'UTC'
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
            header: 'Status',
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
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const submission = row.original;
                const isPrinting = printingId === submission.submission_id; // ✅ เช็คว่า Row นี้กำลัง Print อยู่ไหม

                return (
                    <div className="flex items-center space-x-3.5">
                        {/* View Button */}
                        {(() => {
                            const isMyTurn = submission.status === 'Pending' && submission.pending_level === user?.LV_Approvals;
                            const viewTooltipText = isMyTurn ? "ถึงตาคุณอนุมัติแล้ว!" : "ดูรายละเอียด";

                            return (
                                <Tooltip message={viewTooltipText}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (category === 'Recycle') {
                                                navigate(`/reports/view/recycle/${submission.submission_id}`);
                                            } else {
                                                navigate(`/reports/view/${submission.submission_id}`);
                                            }
                                        }}
                                        className="relative hover:text-primary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
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

                        {/* Edit Button */}
                        {(() => {
                            const isNeedsEdit = submission.status === 'Rejected' && (user?.id == submission.submitted_by);
                            const canEdit = (
                                (user?.id == submission.submitted_by) ||
                                (user?.LV_Approvals === 3)
                            );
                            const tooltipText = isNeedsEdit ? "งานถูกตีกลับ กรุณาแก้ไข" : "แก้ไขข้อมูล";

                            return canEdit && (
                                <Tooltip message={tooltipText}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (category === 'Recycle') {
                                                navigate(`/reports/edit/recycle/${submission.submission_id}`);
                                            } else {
                                                navigate(`/reports/edit/${submission.submission_id}`);
                                            }
                                        }}
                                        className="relative hover:text-yellow-500 cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
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

                        {/* Delete Button */}
                        {((user?.id == submission.submitted_by) || (user?.LV_Approvals === 3)) && (
                            <Tooltip message="ลบรายการนี้">
                                <button
                                    onClick={() => handleDelete(submission.submission_id, submission.lot_no)}
                                    className="hover:text-danger"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </Tooltip>
                        )}

                        {/* Print Button */}
                        <Tooltip message={isPrinting ? "กำลังสร้างไฟล์ PDF..." : "พิมพ์รายงาน"}> {/* ✅ UI: เปลี่ยน Tooltip */}
                            <button
                                onClick={() => handlePrint(submission.submission_id)}
                                disabled={isPrinting} // ✅ Logic: ห้ามกดซ้ำ
                                className={`hover:text-blue-500 ${isPrinting ? 'cursor-wait opacity-50' : ''}`} // ✅ UI: เปลี่ยน Cursor/Opacity
                            >
                                {isPrinting ? (
                                    // ✅ UI: แสดง Spinner หมุนติ้วๆ
                                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                        <rect x="6" y="14" width="12" height="8"></rect>
                                    </svg>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];
};
