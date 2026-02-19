// local src/pages/Reports/components/ReportTableToolbar.tsx 

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
    title?: React.ReactNode; // ✅ Add Title Prop
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
    // onClearFilters,
    availableForms, // ✅ Destructure
    createLink, // ✅ Destructure
    title // ✅ Destructure Title
}) => {
    return (
        <div className="space-y-4">
            {/* --- 1. Top Row: Primary Action --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                {/* Left: Title (Optional) */}
                <div>
                    {title}
                </div>

                {/* Right: Create Button */}
                {/* Right: Create Button (Enhanced) */}
                <Link
                    to={createLink}
                    className="group relative inline-flex items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-primary to-blue-600 py-3 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-0.5"
                >
                    <span className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-white/20 mr-1">
                        <svg className="fill-current w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M15 7H9V1C9 0.447715 8.55228 0 8 0C7.44772 0 7 0.447715 7 1V7H1C0.447715 7 0 7.44772 0 8C0 8.55228 0.447715 9 1 9H7V15C7 15.5523 7.44772 16 8 16C8.55228 16 9 15.5523 9 15V9H15C15.5523 9 16 8.5523 16 8C16 7.44772 15.5523 7 15 7Z" /></svg>
                    </span>
                    <span className="relative">Create Form</span>
                </Link>
            </div>

            {/* --- 2. Bottom Row: Advanced Filters (Refined) --- */}
            <div>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Filter Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">

                        {/* 🔍 Global Search (Moved Here) */}
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                value={globalFilter}
                                onChange={e => setGlobalFilter(e.target.value)}
                                placeholder="Search Lot No..."
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        {/* 📅 Date Picker */}
                        <div className="relative">
                            <Datepicker
                                value={dateRange}
                                onChange={(newValue) => setDateRange(newValue)}
                                showShortcuts={true}
                                placeholder="Date Range"
                                inputClassName="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                toggleClassName="absolute right-0 top-0 h-full px-3 text-gray-400 focus:outline-none"
                            />
                        </div>

                        {/* Filter: Form Type (Dynamic from availableForms) */}
                        <div className="relative">
                            <select
                                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
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
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="User Name / ID"
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        {/* ⚡ Status Select */}
                        <div className="relative">
                            <select
                                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Draft">Draft</option>
                            </select>
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M0.47072 1.08816C0.47072 1.02932 0.500141 0.970484 0.558983 0.911642C0.676668 0.793958 0.882613 0.793958 1.0003 0.911642L5.00015 4.91149L8.99999 0.911642C9.11768 0.793958 9.32362 0.793958 9.44131 0.911642C9.55899 1.02933 9.55899 1.23527 9.44131 1.35295L5.22081 5.57345C5.10312 5.69114 4.89718 5.69114 4.77949 5.57345L0.558983 1.35295C0.500141 1.29411 0.47072 1.23527 0.47072 1.17643V1.08816Z" fill="currentColor" /></svg>
                            </span>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};
