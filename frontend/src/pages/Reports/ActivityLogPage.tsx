// src/pages/Reports/ActivityLogPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import { getAllLogs, ActivityLog } from "../../services/activityLog.service";
import LogDetailModal from "./components/LogDetailModal";
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

const ActivityLogPage: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                // Optionally search in details too if needed
                matchSearch = target.includes(term);
            }

            return matchAction && matchModule && matchDate && matchSearch;
        });
    }, [logs, filterAction, filterModule, dateRange, searchTerm]);

    const handleRowClick = (log: ActivityLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    return (
        <>
            <Breadcrumb pageName="Activity Logs" />

            <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                {/* Header & Filters */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                    <h4 className="text-xl font-semibold text-black dark:text-white shrink-0">
                        Recent Activity
                    </h4>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap items-center">
                        {/* Search Target */}
                        <input
                            type="text"
                            placeholder="Search Target ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-48 rounded border border-stroke bg-transparent py-2 px-4 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                        />

                        {/* Date Picker (Range) */}
                        <div className="w-full sm:w-64">
                            <Datepicker
                                value={dateRange}
                                onChange={(newValue) => setDateRange(newValue)}
                                showShortcuts={true}
                                placeholder="Filter by Date Range"
                                inputClassName="w-full rounded border border-stroke bg-transparent py-2 px-4 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                toggleClassName="absolute right-0 top-0 h-full px-3 text-gray-400 focus:outline-none"
                            />
                        </div>

                        {/* Filter Action */}
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full sm:w-auto rounded border border-stroke bg-transparent py-2 px-4 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input cursor-pointer"
                        >
                            <option value="">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>

                        {/* Filter Module */}
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="w-full sm:w-auto rounded border border-stroke bg-transparent py-2 px-4 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input cursor-pointer"
                        >
                            <option value="">All Modules</option>
                            {uniqueModules.map(mod => (
                                <option key={mod} value={mod}>{mod}</option>
                            ))}
                        </select>

                        <button
                            onClick={fetchLogs}
                            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 shrink-0"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="flex flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-6">
                        <div className="p-2.5 xl:p-5">
                            <h5 className="text-sm font-medium uppercase xsm:text-base">Time</h5>
                        </div>
                        <div className="p-2.5 text-center xl:p-5">
                            <h5 className="text-sm font-medium uppercase xsm:text-base">User</h5>
                        </div>
                        <div className="p-2.5 text-center xl:p-5">
                            <h5 className="text-sm font-medium uppercase xsm:text-base">Action</h5>
                        </div>
                        <div className="hidden p-2.5 text-center sm:block xl:p-5">
                            <h5 className="text-sm font-medium uppercase xsm:text-base">Module</h5>
                        </div>
                        <div className="hidden p-2.5 text-center sm:block xl:p-5">
                            <h5 className="text-sm font-medium uppercase xsm:text-base">Target</h5>
                        </div>
                        <div className="hidden p-2.5 text-center sm:block xl:p-5">
                            <h5 className="text-sm font-medium uppercase xsm:text-base">Details</h5>
                        </div>
                    </div>

                    {/* Table Body */}
                    {loading && (
                        <div className="p-4 text-center">
                            <p>Loading logs...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 text-center text-red-500">
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && filteredLogs.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            <p>No logs found matching filters.</p>
                        </div>
                    )}

                    {!loading && !error && filteredLogs.map((log) => (
                        <div
                            key={log.log_id}
                            className={`grid grid-cols-3 sm:grid-cols-6 ${filteredLogs.indexOf(log) === filteredLogs.length - 1 ? '' : 'border-b border-stroke dark:border-strokedark'
                                } hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer transition-colors`}
                            onClick={() => handleRowClick(log)}
                        >
                            <div className="flex items-center gap-3 p-2.5 xl:p-5">
                                <p className="text-black dark:text-white whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString("th-TH", { timeZone: "UTC" })}
                                </p>
                            </div>

                            <div className="flex items-center justify-center p-2.5 xl:p-5">
                                <p className="text-black dark:text-white">{log.user_id}</p>
                            </div>

                            <div className="flex items-center justify-center p-2.5 xl:p-5">
                                <span
                                    className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${log.action_type === "CREATE"
                                        ? "bg-success text-success"
                                        : log.action_type === "UPDATE"
                                            ? "bg-warning text-warning"
                                            : log.action_type === "DELETE"
                                                ? "bg-danger text-danger"
                                                : "bg-primary text-primary"
                                        }`}
                                >
                                    {log.action_type}
                                </span>
                            </div>

                            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                                <p className="text-black dark:text-white whitespace-nowrap text-sm truncate max-w-full px-2">
                                    {log.target_module}
                                </p>
                            </div>

                            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                                <p className="text-meta-5">{log.target_id || "-"}</p>
                            </div>

                            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                                <p className="text-sm text-gray-500">View Details</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Modal */}
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
