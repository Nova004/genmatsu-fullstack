// src/pages/Reports/ActivityLogPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import { getAllLogs, ActivityLog } from "../../services/activityLog.service";
import LogDetailModal from "./components/LogDetailModal";
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { useLevelGuard } from '../../hooks/useLevelGuard';

const ActivityLogPage: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    useLevelGuard(2);

    // Filters
    const [filterAction, setFilterAction] = useState<string>("");
    const [filterModule, setFilterModule] = useState<string>("");

    // Date Filter State (Range)
    const [dateRange, setDateRange] = useState<DateValueType>({
        startDate: null,
        endDate: null
    });

    const [searchTerm, setSearchTerm] = useState<string>("");

    // Modal State
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await getAllLogs();
            setLogs(data);
        } catch (err) {
            setError("Failed to fetch logs");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Dropdowns
    const uniqueActions = useMemo(() => {
        return Array.from(new Set(logs.map(log => log.action_type))).sort();
    }, [logs]);

    const uniqueModules = useMemo(() => {
        return Array.from(new Set(logs.map(log => log.target_module))).sort();
    }, [logs]);

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchAction = filterAction ? log.action_type === filterAction : true;
            const matchModule = filterModule ? log.target_module === filterModule : true;

            // Date Range Filter
            let matchDate = true;
            if (dateRange?.startDate && dateRange?.endDate) {
                const start = new Date(dateRange.startDate).toISOString().split('T')[0];
                const end = new Date(dateRange.endDate).toISOString().split('T')[0];
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                matchDate = logDate >= start && logDate <= end;
            }

            // Search Term (Target ID or Message)
            let matchSearch = true;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const target = (log.target_id || "").toString().toLowerCase();
                const user = (log.user_id || "").toString().toLowerCase();
                matchSearch = target.includes(term) || user.includes(term);
            }

            return matchAction && matchModule && matchDate && matchSearch;
        });
    }, [logs, filterAction, filterModule, dateRange, searchTerm]);

    const handleRowClick = (log: ActivityLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    // Helper for Action Badges
    const getActionBadgeStyle = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('create') || lower.includes('add')) return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
        if (lower.includes('update') || lower.includes('edit')) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
        if (lower.includes('delete') || lower.includes('remove')) return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    };

    return (
        <>
            <Breadcrumb pageName="Activity Logs" />

            <div className="flex flex-col gap-6">
                {/* 🔍 Filters Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </span>
                            Filter Logs
                        </h2>
                        <button
                            onClick={fetchLogs}
                            className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Data
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search User or Target ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                            />
                        </div>

                        {/* Date Picker */}
                        <div className="relative">
                            <Datepicker
                                value={dateRange}
                                onChange={(newValue) => setDateRange(newValue)}
                                showShortcuts={true}
                                placeholder="Select Date Range"
                                inputClassName="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                toggleClassName="absolute right-0 top-0 h-full px-3 text-gray-400 focus:outline-none"
                            />
                        </div>

                        {/* Filter Action */}
                        <div className="relative">
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
                            >
                                <option value="">All Actions</option>
                                {uniqueActions.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                            <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>

                        {/* Filter Module */}
                        <div className="relative">
                            <select
                                value={filterModule}
                                onChange={(e) => setFilterModule(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 py-2.5 px-4 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-form-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary cursor-pointer"
                            >
                                <option value="">All Modules</option>
                                {uniqueModules.map(mod => (
                                    <option key={mod} value={mod}>{mod}</option>
                                ))}
                            </select>
                            <span className="absolute right-3 top-3 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 📋 Data Table */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-strokedark flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            Activity History
                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-meta-4 px-2 py-0.5 rounded-full">
                                {filteredLogs.length} Records
                            </span>
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-50 dark:bg-meta-4">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Time</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Module</th>
                                    <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Target ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-strokedark">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-8 h-8 animate-spin text-primary mb-2" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Loading logs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-red-500">{error}</td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-500 flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            No logs found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr
                                            key={log.log_id}
                                            onClick={() => handleRowClick(log)}
                                            className="group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                                                {new Date(log.timestamp).toLocaleString("th-TH", { timeZone: "UTC" })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    {log.user_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeStyle(log.action_type)}`}>
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {log.target_module}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400 font-mono">
                                                {log.target_id || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                <LogDetailModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    log={selectedLog}
                />
            </div>
        </>
    );
};

export default ActivityLogPage;
