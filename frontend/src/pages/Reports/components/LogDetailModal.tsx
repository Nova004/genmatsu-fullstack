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

    const renderTable = (allKeys: string[], oldFlat: Record<string, any>, newFlat: Record<string, any>) => {
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
                        {/* ... Existing row rendering logic ... */}
                        {allKeys.map((key) => {
                            const oldVal = oldFlat[key];
                            const newVal = newFlat[key];

                            if (oldVal === newVal) return null;

                            const showOld =
                                oldVal === undefined || oldVal === null ? '(empty)' :
                                    typeof oldVal === 'object' ? JSON.stringify(oldVal, null, 2) : String(oldVal);

                            const showNew =
                                newVal === undefined || newVal === null ? '(empty)' :
                                    typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : String(newVal);

                            const isChanged = oldVal !== newVal;
                            const rowClass = isChanged ? "bg-yellow-50 dark:bg-slate-700" : "";

                            if (!isChanged) return null;

                            const formattedKey = key
                                .replace(/\[(\d+)\]/g, ' #$1 ') // [0] -> #0
                                .replace(/^\./, '')             // remove leading dot if any
                                .replace(/\./g, ' > ')          // dots to arrows
                                .replace(/([A-Z])/g, ' $1')    // Space before Caps
                                .replace(/_/g, ' ')            // Underscores to spaces
                                .replace(/^\w/, (c: string) => c.toUpperCase()) // Capitalize first letter
                                .trim();

                            return (
                                <tr key={key} className={`border-b border-gray-200 dark:border-strokedark ${rowClass}`}>
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
                        })}
                        {allKeys.every(k => oldFlat[k] === newFlat[k]) && (
                            <tr><td colSpan={3} className="text-center py-4 text-gray-500">No content changes detected.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div
            className={`fixed top-0 left-0 z-999999 flex h-full w-full items-center justify-center bg-black/50 px-4 py-5 ${isOpen ? 'block' : 'hidden'
                }`}
        >
            <div className="relative w-full max-w-4xl rounded-lg bg-white p-8 shadow-md dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-black dark:text-white">
                        Log Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="mt-4">
                    {/* Meta Data */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-600 dark:text-gray-300 border-b pb-4 mb-4 dark:border-strokedark">
                        <div><strong>Log ID:</strong> {log.log_id}</div>
                        <div><strong>Time:</strong> {new Date(log.timestamp).toLocaleString("th-TH", { timeZone: "UTC" })}</div>
                        <div><strong>User:</strong> {log.user_id}</div>
                        <div><strong>Action:</strong> {log.action_type}</div>
                        <div><strong>Module:</strong> {log.target_module} ({log.target_id})</div>
                    </div>

                    {isDiff ? (
                        renderDiffContent()
                    ) : (
                        <div className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap dark:bg-meta-4 break-words">
                            {typeof parsedDetails === 'string' ? parsedDetails : JSON.stringify(parsedDetails, null, 2)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogDetailModal;
