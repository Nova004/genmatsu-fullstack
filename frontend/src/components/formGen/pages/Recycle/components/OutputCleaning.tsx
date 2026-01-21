import React from 'react';
import { UseFormRegister, UseFormWatch, UseFieldArrayReturn, FieldArrayWithId } from 'react-hook-form';

interface OutputCleaningProps {
    register: UseFormRegister<any>;
    watch: UseFormWatch<any>;
    title?: string;
    fieldArray: UseFieldArrayReturn<any, any, "id">;
    fieldName: string;
    isReadOnly?: boolean;
}

const OutputCleaning: React.FC<OutputCleaningProps> = ({
    register,
    watch,
    title = 'Output from cleaning',
    fieldArray,
    fieldName,
    isReadOnly = false
}) => {
    const { fields, append, remove } = fieldArray;
    const inputClass = "w-full rounded-lg bg-transparent px-3 py-2 text-center text-black outline-none transition focus:border-primary active:border-primary dark:bg-form-input dark:text-white dark:focus:border-primary";

    const headerThClass = "border-b border-stroke px-3 py-3 text-center font-semibold text-xs whitespace-nowrap text-gray-700 dark:border-strokedark dark:text-gray-200 bg-gray-50 dark:bg-gray-800";
    const tdCenterClass = "border border-stroke px-4 py-3 text-center align-middle font-normal text-sm text-gray-600 dark:border-strokedark dark:text-gray-300";
    const footerTdClass = "border border-stroke px-4 py-3 text-center align-middle text-gray-900 font-semibold text-sm dark:border-strokedark dark:text-gray-100 bg-gray-50 dark:bg-gray-800";

    // Watch the weight field to calculate total
    const items = watch(fieldName) || [];
    const totalWeight = items.reduce((sum: number, item: any) => {
        const weight = parseFloat(item?.weight) || 0;
        return sum + weight;
    }, 0);

    const handleAddRow = () => {
        append({ bagNo: '', weight: undefined });
    };

    const handleRemoveRow = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    return (
        <div>
            <div className="border-b-2 border-stroke py-3 px-4 text-center bg-gradient-to-r from-gray-900 to-gray-800 dark:border-strokedark rounded-t-lg flex justify-between items-center">
                <h5 className="font-bold text-white text-base tracking-wide uppercase flex-1">{title}</h5>
                {!isReadOnly && (
                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition"
                    >
                        + Add
                    </button>
                )}
            </div>
            <div className="rounded-b-lg border border-t-0 border-stroke dark:border-strokedark shadow-sm">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            <th className={`${headerThClass} w-[80px]`}>Bag no</th>
                            <th className={headerThClass}>Weight ≦ 20 kg / bag</th>
                            {!isReadOnly && <th className="border-b border-stroke px-3 py-3 text-center font-semibold text-xs text-gray-700 dark:border-strokedark dark:text-gray-200 bg-gray-50 dark:bg-gray-800">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field: FieldArrayWithId<any, any, "id">, index: number) => (
                            <tr key={field.id}>
                                {/* Bag no */}
                                <td className={tdCenterClass}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={index + 1}
                                        disabled
                                        {...register(`${fieldName}.${index}.bagNo`)}
                                    />
                                </td>

                                {/* Weight */}
                                <td className={tdCenterClass}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={inputClass}
                                        placeholder=""
                                        {...register(`${fieldName}.${index}.weight`, {
                                            setValueAs: (value) => value === '' ? undefined : parseFloat(value)
                                        })}
                                    />
                                </td>

                                {/* Action */}
                                {!isReadOnly && (
                                    <td className={tdCenterClass}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRow(index)}
                                            disabled={fields.length === 1}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs font-medium transition"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-2 dark:bg-meta-4">
                            <td className={footerTdClass}>Total</td>
                            <td className={footerTdClass}>{totalWeight.toFixed(2)} kg.</td>
                            {!isReadOnly && <td className={footerTdClass}></td>}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default OutputCleaning;
