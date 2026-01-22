import React from 'react';
import { Link } from 'react-router-dom';
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";

interface Props {
    globalFilter: string;
    setGlobalFilter: (val: string) => void;
    dateRange: DateValueType;
    setDateRange: (val: DateValueType) => void;
    filterFormType: string;
    setFilterFormType: (val: string) => void;
    filterUser: string;
    setFilterUser: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    onClearFilters: () => void;
    availableForms: { label: string; value: string }[]; // ✅ Add Prop
    createLink: string; // ✅ Add Prop
}

export const ReportTableToolbar: React.FC<Props> = ({
    globalFilter,
    setGlobalFilter,
    dateRange,
    setDateRange,
    filterFormType,
    setFilterFormType,
    filterUser,
    setFilterUser,
    filterStatus,
    setFilterStatus,
    onClearFilters,
    availableForms, // ✅ Destructure
    createLink // ✅ Destructure
}) => {
    return (
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
                        to={createLink} // ✅ Use Dynamic Link
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

                                {/* 👇 วนลูปสร้าง Option จาก availableForms Prop */}
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
                                onClick={onClearFilters}
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
    );
};
