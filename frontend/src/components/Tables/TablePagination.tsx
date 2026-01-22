import React from 'react';
import { Table } from '@tanstack/react-table';

interface Props<TData> {
    table: Table<TData>;
}

export function TablePagination<TData>({ table }: Props<TData>) {
    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-stroke px-4 py-4 dark:border-strokedark sm:flex-row">
            <div className="flex items-center gap-2">
                <p className="text-sm text-black dark:text-white">
                    Showing{' '}
                    <span className="font-medium">
                        {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{table.getFilteredRowModel().rows.length}</span>{' '}
                    entries
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    className="flex items-center justify-center rounded bg-primary py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => {
                        const currentPage = table.getState().pagination.pageIndex;
                        const pageCount = table.getPageCount();

                        // Logic to show limited page numbers (Optional, simple version for now)
                        if (
                            pageIndex === 0 ||
                            pageIndex === pageCount - 1 ||
                            (pageIndex >= currentPage - 1 && pageIndex <= currentPage + 1)
                        ) {
                            return (
                                <button
                                    key={pageIndex}
                                    className={`min-w-[32px] rounded py-1 px-2 text-sm font-medium ${currentPage === pageIndex
                                        ? 'bg-primary text-white'
                                        : 'bg-white text-black hover:bg-gray-100 dark:bg-boxdark dark:text-white dark:hover:bg-meta-4'
                                        } border border-stroke dark:border-strokedark`}
                                    onClick={() => table.setPageIndex(pageIndex)}
                                >
                                    {pageIndex + 1}
                                </button>
                            );
                        }

                        if (
                            pageIndex === currentPage - 2 ||
                            pageIndex === currentPage + 2
                        ) {
                            return <span key={pageIndex} className="px-1">...</span>;
                        }

                        return null;
                    })}
                </div>

                <button
                    className="flex items-center justify-center rounded bg-primary py-1 px-3 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
