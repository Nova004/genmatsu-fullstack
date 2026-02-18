// src/pages/Reports/components/LogDetailModal.tsx
import React, { useEffect, useState } from 'react';
import { ActivityLog } from '../../../services/activityLog.service';

interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: ActivityLog | null;
}

const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, log }) => {
    const [parsedDetails, setParsedDetails] = useState<any>(null);

    useEffect(() => {
        if (log?.details) {
            try {
                const parsed = JSON.parse(log.details);
                setParsedDetails(parsed);
            } catch (e) {
                // If not JSON, just treat as string
                setParsedDetails(log.details);
            }
        } else {
            setParsedDetails(null);
        }
    }, [log]);

    if (!isOpen || !log) return null;

    const isDiff = typeof parsedDetails === 'object' && parsedDetails?.type === 'DIFF';

    // Helper to flatten object for side-by-side comparison
    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
        let result: Record<string, any> = {};
        if (!obj || typeof obj !== 'object') {
            result[prefix] = obj;
            return result;
        }

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                // Handle Array keys nicely: items.0 -> items[0]
                // But simple dot notation is easier for generic deep flatten logic first.
                // Let's stick to dot for consistency, or format it.
                // Problem: if I use [0], the next recursion might do [0].field.
                // Let's stick to dot notation here and formatter later, OR handle it smart.

                const isArrayKey = Array.isArray(obj);
                const stringKey = isArrayKey ? `[${key}]` : `.${key}`;
                const newKey = prefix ? `${prefix}${stringKey}` : (isArrayKey ? `[${key}]` : key);

                // Recurse for both Objects and Arrays (non-null)
                if (value && typeof value === 'object') {
                    Object.assign(result, flattenObject(value, newKey));
                } else {
                    result[newKey] = value;
                }
            }
        }
        return result;
    };

    const renderDiffContent = () => {
        // Case 1: We have oldData and newData (Full Diff)
        if (parsedDetails.oldData || parsedDetails.newData) {
            const oldFlat = flattenObject(parsedDetails.oldData || {});
            const newFlat = flattenObject(parsedDetails.newData || {});
            const allKeys = Array.from(new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])).sort();

            return (
                <div className="flex flex-col gap-4">
                    <div className="bg-gray-100 p-3 rounded mb-2 dark:bg-meta-4">
                        <p className="font-semibold">{parsedDetails.summary || "Comparison View"}</p>
                    </div>
                    {renderTable(allKeys, oldFlat, newFlat)}
                </div>
            );
        }

        // Case 2: We only have 'changes' array (Backward compatibility or simple diff)
        if (parsedDetails.changes && Array.isArray(parsedDetails.changes)) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="bg-gray-100 p-3 rounded mb-2 dark:bg-meta-4">
                        <p className="font-semibold">{parsedDetails.message || "Changes Log"}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-meta-4 text-left">
                                <tr>
                                    <th className="py-2 px-3 font-semibold">Field</th>
                                    <th className="py-2 px-3 font-semibold text-red-600">Old Value</th>
                                    <th className="py-2 px-3 font-semibold text-green-600">New Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedDetails.changes.map((changeStr: string, idx: number) => {
                                    // Parse string "items[0].item_id: 2874 -> 2875"
                                    // Regex to split by ": " and " -> "
                                    // Supports: "items[0].id: 1 -> 2" OR "LV_Approvals: 3 -> 0"
                                    const match = changeStr.match(/^(.+?): (.*?) -> (.*)$/);

                                    if (!match) {
                                        return (
                                            <tr key={idx} className="border-b border-gray-200 dark:border-strokedark">
                                                <td colSpan={3} className="py-2 px-3 text-gray-700 dark:text-gray-300">{changeStr}</td>
                                            </tr>
                                        );
                                    }
                                    const [, key, oldVal, newVal] = match;

                                    // Format Key
                                    const formattedKey = key
                                        .replace(/([A-Z])/g, ' $1')
                                        .replace(/\./g, ' > ')
                                        .replace(/_/g, ' ')
                                        .replace(/^\w/, (c) => c.toUpperCase());

                                    return (
                                        <tr key={idx} className="border-b border-gray-200 dark:border-strokedark bg-yellow-50 dark:bg-slate-700">
                                            <td className="py-2 px-3 font-medium text-gray-700 dark:text-gray-300 max-w-xs break-words align-top">{formattedKey}</td>
                                            <td className="py-2 px-3 align-top">
                                                <div className="w-full bg-red-100 text-red-800 border border-red-200 rounded px-2 py-1 text-xs break-all whitespace-pre-wrap font-mono dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
                                                    {oldVal}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 align-top">
                                                <div className="w-full bg-green-100 text-green-800 border border-green-200 rounded px-2 py-1 text-xs break-all whitespace-pre-wrap font-mono dark:bg-green-900/30 dark:border-green-800 dark:text-green-200">
                                                    {newVal}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        return <div className="p-4 text-center">No data available for comparison.</div>;
    };

    const areValuesEquivalent = (v1: any, v2: any) => {
        // 1. Strict equality first
        if (v1 === v2) return true;

        // 2. Prepare strings by trimming whitespace (Solving "0.89" vs "0.89 ")
        const s1 = (v1 !== null && v1 !== undefined) ? String(v1).trim() : '';
        const s2 = (v2 !== null && v2 !== undefined) ? String(v2).trim() : '';

        // If trimmed strings are equal, they are equivalent
        if (s1 === s2) return true;

        // 3. Status check: if strings are different, try numeric comparison (Solving "740.00" vs "740")
        if (s1 !== '' && s2 !== '') {
            const n1 = Number(s1);
            const n2 = Number(s2);

            if (!isNaN(n1) && !isNaN(n2)) {
                // Use a slightly larger epsilon than Number.EPSILON
                const FLOAT_EPSILON = 1e-9;
                return Math.abs(n1 - n2) < FLOAT_EPSILON;
            }
        }
        return false;
    };

    const renderTable = (allKeys: string[], oldFlat: Record<string, any>, newFlat: Record<string, any>) => {
        // Filter out keys where values are equivalent
        const keysWithChanges = allKeys.filter(key => {
            const oldVal = oldFlat[key];
            const newVal = newFlat[key];
            return !areValuesEquivalent(oldVal, newVal);
        });

        // Loop only keys with actual changes
        const rows = keysWithChanges.map((key) => {
            const oldVal = oldFlat[key];
            const newVal = newFlat[key];

            const showOld =
                oldVal === undefined || oldVal === null ? '(empty)' :
                    typeof oldVal === 'object' ? JSON.stringify(oldVal, null, 2) : String(oldVal);

            const showNew =
                newVal === undefined || newVal === null ? '(empty)' :
                    typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : String(newVal);

            const formattedKey = key
                .replace(/\[(\d+)\]/g, ' #$1 ') // [0] -> #0
                .replace(/^\./, '')             // remove leading dot if any
                .replace(/\./g, ' > ')          // dots to arrows
                .replace(/([A-Z])/g, ' $1')    // Space before Caps
                .replace(/_/g, ' ')            // Underscores to spaces
                .replace(/^\w/, (c: string) => c.toUpperCase()) // Capitalize first letter
                .trim();

            return (
                <tr key={key} className="border-b border-gray-200 dark:border-strokedark bg-yellow-50 dark:bg-slate-700">
                    <td className="py-2 px-3 font-medium text-gray-700 dark:text-gray-300 max-w-xs break-words align-top">
                        {formattedKey}
                    </td>
                    <td className="py-2 px-3 align-top">
                        <div className="w-full bg-red-100 text-red-800 border border-red-200 rounded px-2 py-1 text-xs break-all whitespace-pre-wrap font-mono dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
                            {showOld}
                        </div>
                    </td>
                    <td className="py-2 px-3 align-top">
                        <div className="w-full bg-green-100 text-green-800 border border-green-200 rounded px-2 py-1 text-xs break-all whitespace-pre-wrap font-mono dark:bg-green-900/30 dark:border-green-800 dark:text-green-200">
                            {showNew}
                        </div>
                    </td>
                </tr>
            );
        });

        if (keysWithChanges.length === 0) {
            return <div className="p-4 text-center text-gray-500">No content changes detected.</div>;
        }

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-meta-4 text-left">
                        <tr>
                            <th className="py-2 px-3 font-semibold">Field</th>
                            <th className="py-2 px-3 font-semibold text-red-600">Old Value</th>
                            <th className="py-2 px-3 font-semibold text-green-600">New Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }

    // Helper to get Action Icon/Color
    const getActionStyle = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('create') || lower.includes('add')) return { color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-200' };
        if (lower.includes('update') || lower.includes('edit')) return { color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-200' };
        if (lower.includes('delete') || lower.includes('remove')) return { color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-200' };
        return { color: 'text-gray-600', bg: 'bg-gray-100', borderColor: 'border-gray-200' };
    };

    const actionStyle = getActionStyle(log.action_type);

    return (
        <div
            className={`fixed inset-0 z-999999 flex h-full w-full items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity px-4 py-5 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        >
            <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl dark:bg-boxdark max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${actionStyle.bg} ${actionStyle.color} dark:bg-opacity-20`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Activity Details
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Log ID: <span className="font-mono text-gray-700 dark:text-gray-300">#{log.log_id}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-meta-4 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:border-strokedark dark:bg-meta-4/30">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Time</span>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(log.timestamp).toLocaleString("th-TH", { timeZone: "UTC" })}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:border-strokedark dark:bg-meta-4/30">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">User</span>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {log.user_id}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:border-strokedark dark:bg-meta-4/30">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Action</span>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${actionStyle.bg} ${actionStyle.color} ${actionStyle.borderColor} dark:bg-opacity-20`}>
                                {log.action_type}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:border-strokedark dark:bg-meta-4/30">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Target</span>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={`${log.target_module} (${log.target_id})`}>
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="truncate">{log.target_module}</span>
                            </div>
                        </div>
                    </div>

                    {/* Change Reason Box */}
                    {(parsedDetails?.change_reason || (log as any).extra_change_reason) && (
                        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg dark:bg-blue-900/20 dark:border-blue-400">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700 dark:text-blue-200">
                                        <strong className="font-semibold block mb-1">Change Reason:</strong>
                                        {parsedDetails?.change_reason || (log as any).extra_change_reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diff Viewer / Content */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-boxdark dark:border-strokedark overflow-hidden">
                        {isDiff ? (
                            renderDiffContent()
                        ) : (
                            <div className="p-0">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 dark:bg-meta-4 dark:border-strokedark">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Raw Detail View</span>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-boxdark">
                                    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                                        {typeof parsedDetails === 'string' ? parsedDetails : JSON.stringify(parsedDetails, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 dark:bg-meta-4/30 dark:border-strokedark">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 transition-colors dark:bg-meta-4 dark:text-gray-200 dark:border-strokedark dark:hover:bg-boxdark"
                    >
                        Close
                    </button>
                    {/* Could add a 'Copy Details' button here in future */}
                </div>
            </div>
        </div>
    );
};

export default LogDetailModal;
