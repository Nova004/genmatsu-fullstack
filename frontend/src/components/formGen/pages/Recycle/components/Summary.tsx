// local src/components/formGen/pages/Recycle/components/Summary.tsx

import React, { useEffect } from 'react'; // <--- 1. อย่าลืม import useEffect
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'; // <--- 2. import Type เพิ่ม

interface SummaryProps {
    register: UseFormRegister<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
}

const Summary: React.FC<SummaryProps> = ({
    register,
    watch,
    setValue
}) => {
    const inputClass = "w-full rounded-lg bg-transparent px-3 py-2 text-black outline-none transition focus:border-primary active:border-primary dark:bg-form-input dark:text-white dark:focus:border-primary border-b border-stroke dark:border-strokedark";

    const labelClass = "font-semibold text-gray-900 dark:text-gray-100 text-sm";
    const valueClass = "text-primary text-sm font-semibold";
    const rowClass = "border-b border-stroke dark:border-strokedark px-4 py-3 flex items-center justify-between";

    // Watch data for calculations
    const inputProduct = watch('inputProduct') || [];
    const outputGenmatsuA = watch('outputGenmatsuA') || [];
    const outputGenmatsuB = watch('outputGenmatsuB') || [];
    const outputGenmatsuBRight = watch('outputGenmatsuBRight') || [];
    const outputFilmProduct = watch('outputFilmProduct') || [];
    const outputFilmProductRight = watch('outputFilmProductRight') || [];
    const outputPEBag = watch('outputPEBag') || [];
    const outputDustCollector = watch('outputDustCollector') || [];
    const outputCleaning = watch('outputCleaning') || [];

    const calculateSum = (items: any[]) => items.reduce((sum, item) => sum + (parseFloat(item?.weight) || 0), 0);

    const subTotalGenmatsuA = calculateSum(outputGenmatsuA);
    const subTotalGenmatsuB = calculateSum(outputGenmatsuB) + calculateSum(outputGenmatsuBRight); // รวมซ้ายขวา
    const subTotalFilm = calculateSum(outputFilmProduct) + calculateSum(outputFilmProductRight); // รวมซ้ายขวา
    const subTotalPEBag = calculateSum(outputPEBag);
    const subTotalDust = calculateSum(outputDustCollector);
    const subTotalCleaning = calculateSum(outputCleaning);

    // Calculate total input
    const totalInput = inputProduct.reduce((sum: number, item: any) => {
        const weight = parseFloat(item?.weight) || 0;
        return sum + weight;
    }, 0);

    // Calculate total output
    const totalOutput =
        outputGenmatsuA.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputGenmatsuB.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputGenmatsuBRight.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputFilmProduct.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputFilmProductRight.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputPEBag.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputDustCollector.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0) +
        outputCleaning.reduce((sum: number, item: any) => sum + (parseFloat(item?.weight) || 0), 0);

    // Calculate diff
    const diff = totalInput - totalOutput;

    useEffect(() => {
        setValue('totalInput', totalInput);
        setValue('totalOutput', totalOutput);
        setValue('diffWeight', diff);

        // ส่งค่าแยกราย Component
        setValue('totalGenmatsuA', subTotalGenmatsuA);
        setValue('totalGenmatsuB', subTotalGenmatsuB);
        setValue('totalFilm', subTotalFilm);
        setValue('totalPEBag', subTotalPEBag);
        setValue('totalDustCollector', subTotalDust);
        setValue('totalCleaning', subTotalCleaning);
    }, [
        totalInput, totalOutput, diff,
        subTotalGenmatsuA, subTotalGenmatsuB, subTotalFilm,
        subTotalPEBag, subTotalDust, subTotalCleaning,
        setValue
    ]);

    // Watch quantity fields
    const quantityCans = watch('quantityOfProductCans');
    const quantityWeight = watch('quantityOfProductWeight');
    const lastCan = watch('lastCanWeight');



    return (
        <div className="border-t border-stroke dark:border-strokedark pt-6">
            <div className="rounded-lg border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b-2 border-stroke py-3 px-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:border-strokedark rounded-t-lg">
                    <h5 className="font-bold text-white text-base tracking-wide uppercase">Summary</h5>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-boxdark">
                    {/* Time Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* Production Start Time */}
                        <div className="border-r border-stroke dark:border-strokedark px-4 py-4">
                            <label className={`${labelClass} block mb-2`}>Production Start time</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="time"
                                    className={inputClass}
                                    {...register('productionStartTime')}
                                />
                                <span className={labelClass}>To</span>
                                <input
                                    type="time"
                                    className={inputClass}
                                    {...register('productionEndTime')}
                                />
                            </div>
                        </div>

                        {/* Cleaning Start Time */}
                        <div className="px-4 py-4">
                            <label className={`${labelClass} block mb-2`}>Cleaning Start time</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="time"
                                    className={inputClass}
                                    {...register('cleaningStartTime')}
                                />
                                <span className={labelClass}>To</span>
                                <input
                                    type="time"
                                    className={inputClass}
                                    {...register('cleaningEndTime')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-stroke dark:border-strokedark"></div>

                    {/* Weight Summary Section */}
                    <div className="space-y-0">
                        {/* Total Input */}
                        <div className={rowClass}>
                            <label className={labelClass}>Total Input</label>
                            <div className="flex gap-2 items-center">
                                <span className={valueClass}>{totalInput.toFixed(2)}</span>
                                <span className={labelClass}>kg.</span>
                            </div>
                        </div>

                        {/* Total Output */}
                        <div className={rowClass}>
                            <label className={labelClass}>Total Output</label>
                            <div className="flex gap-2 items-center">
                                <span className={valueClass}>{totalOutput.toFixed(2)}</span>
                                <span className={labelClass}>kg.</span>
                            </div>
                        </div>

                        {/* Diff */}
                        <div className={rowClass}>
                            <label className={labelClass}>Diff (Weight ± )</label>
                            <div className="flex gap-2 items-center">
                                <span className={valueClass}>{diff < 0 ? '-' : ''}{Math.abs(diff).toFixed(2)}</span>
                                <span className={labelClass}>kg.</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-stroke dark:border-strokedark"></div>

                    {/* Quantity Section */}
                    <div className="space-y-0">
                        {/* Quantity of product */}
                        <div className="border-b border-stroke dark:border-strokedark px-4 py-4">
                            <label className={`${labelClass} block mb-3`}>Quantity of product</label>
                            <div className="flex gap-4 items-center justify-start flex-wrap">
                                <div className="flex gap-1 items-center">
                                    <input
                                        type="number"
                                        className={`${inputClass} w-24`}
                                        placeholder="0"
                                        {...register('quantityOfProductCans', {
                                            setValueAs: (value) => value === '' ? undefined : parseFloat(value)
                                        })}
                                    />
                                    <span className={labelClass}>Cans</span>
                                </div>
                                <span className={labelClass}>×</span>
                                <div className="flex gap-1 items-center">
                                    <span className={labelClass}>Weight</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`${inputClass} w-24`}
                                        placeholder="0.00"
                                        defaultValue={75}
                                        {...register('quantityOfProductWeight', {
                                            setValueAs: (value) => value === '' ? undefined : parseFloat(value)
                                        })}
                                    />

                                </div>
                                <span className={labelClass}>=</span>
                                <div className="flex gap-1 items-center">
                                    <span className={valueClass}>
                                        {(Number(quantityCans || 0) * Number(quantityWeight || 0)).toFixed(2)}
                                    </span>
                                    <span className={labelClass}>kg.</span>
                                </div>
                            </div>
                        </div>

                        {/* Last Can */}
                        <div className="border-b border-stroke dark:border-strokedark px-4 py-4">
                            <label className={`${labelClass} block mb-2`}>Last Can</label>
                            <div className="flex gap-2 items-center w-60">
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputClass}
                                    placeholder="0.00"
                                    {...register('lastCanWeight', {
                                        setValueAs: (value) => value === '' ? undefined : parseFloat(value)
                                    })}
                                />
                                <span className={labelClass}>kg.</span>
                            </div>
                        </div>

                        {/* Total Quantity */}
                        <div className={`${rowClass} bg-gray-50 dark:bg-gray-800`}>
                            <label className={labelClass}>Total Quantity of product</label>
                            <div className="flex gap-2 items-center">
                                <span className={valueClass}>
                                    {((Number(quantityCans || 0) * Number(quantityWeight || 0)) + Number(lastCan || 0)).toFixed(2)}
                                </span>
                                <span className={labelClass}>kg.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Summary;
