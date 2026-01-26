// frontend/src/components/formGen/pages/Recycle/Ironpowder_index.tsx 

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray } from 'react-hook-form';
import FormHeader from '../../components/FormHeader';
import SharedFormStep1 from '../../components/forms/SharedFormStep1_Recycle';
import PalletTable from '../../components/forms/PalletTable';
import InputProductTable from './components/InputProductTable';
import OutputProductGenmatsuA from './components/OutputProductGenmatsuA';
import OutputProductGenmatsuB from './components/OutputProductGenmatsuB';
import OutputFilmProduct from './components/OutputFilmProduct';
import OutputPEBag from './components/OutputPEBag';
import OutputDustCollector from './components/OutputDustCollector';
import OutputCleaning from './components/OutputCleaning';
import Summary from './components/Summary';
import { useProductionForm } from '../../../../hooks/useProductionForm';
import Breadcrumb from '../../../../components/Breadcrumbs/Breadcrumb';



function Ironpowder_Form() {
    // 🚀 เรียกใช้ Hook เพื่อจัดการ Logic ของฟอร์มทั้งหมด
    const { formMethods, onSubmit, isSubmitting, onDraft } = useProductionForm({
        formType: 'Ironpowder',
        netWeightOfYieldSTD: 0,
        category: 'Recycle'
    });

    // ดึงสิ่งที่จำเป็นออกมาจาก formMethods
    const { register, trigger, watch, getValues, setValue, control, formState: { errors } } = formMethods;

    // Setup useFieldArray สำหรับแต่ละตาราง
    const inputProductFieldArray = useFieldArray({
        control,
        name: 'inputProduct',
        shouldUnregister: true
    });

    const outputGenmatsuAFieldArray = useFieldArray({
        control,
        name: 'outputGenmatsuA',
        shouldUnregister: true
    });

    const outputGenmatsuBFieldArray = useFieldArray({
        control,
        name: 'outputGenmatsuB',
        shouldUnregister: true
    });

    const outputGenmatsuBRightFieldArray = useFieldArray({
        control,
        name: 'outputGenmatsuBRight',
        shouldUnregister: true
    });

    const outputFilmProductFieldArray = useFieldArray({
        control,
        name: 'outputFilmProduct',
        shouldUnregister: true
    });

    const outputFilmProductRightFieldArray = useFieldArray({
        control,
        name: 'outputFilmProductRight',
        shouldUnregister: true
    });

    const outputPEBagFieldArray = useFieldArray({
        control,
        name: 'outputPEBag',
        shouldUnregister: true
    });

    const outputDustCollectorFieldArray = useFieldArray({
        control,
        name: 'outputDustCollector',
        shouldUnregister: true
    });

    const outputCleaningFieldArray = useFieldArray({
        control,
        name: 'outputCleaning',
        shouldUnregister: true
    });

    // Initialize fields with 4 default rows for each dynamic table
    useEffect(() => {
        const initializeFieldArray = (fieldArray: any, fieldName: string) => {
            if (fieldArray.fields.length === 0) {
                for (let i = 0; i < 13; i++) {
                    fieldArray.append({});
                }
            }
        };

        initializeFieldArray(inputProductFieldArray, 'inputProduct');
        initializeFieldArray(outputGenmatsuAFieldArray, 'outputGenmatsuA');
        initializeFieldArray(outputGenmatsuBFieldArray, 'outputGenmatsuB');
        initializeFieldArray(outputGenmatsuBRightFieldArray, 'outputGenmatsuBRight');
        initializeFieldArray(outputFilmProductFieldArray, 'outputFilmProduct');
        initializeFieldArray(outputFilmProductRightFieldArray, 'outputFilmProductRight');
        initializeFieldArray(outputPEBagFieldArray, 'outputPEBag');
        initializeFieldArray(outputDustCollectorFieldArray, 'outputDustCollector');
        initializeFieldArray(outputCleaningFieldArray, 'outputCleaning');
    }, []);


    const availableForms = [
        { value: 'Ironpowder', label: 'Ironpowder', path: '/forms/ironpowder-form' },
    ];


    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    return (
        <>
            <Breadcrumb pageName="Form Elements" />
            <div className="rounded-lg border border-stroke bg-white p-4 shadow-md dark:border-strokedark dark:bg-boxdark md:p-6">
                <form onSubmit={onSubmit} className="space-y-4">
                    <FormHeader
                        title="Production Report (Ironpowder)"
                        formTypes={availableForms}
                        currentValue="Ironpowder"
                        inputClass={inputClass}
                    />

                    <div className="border-t border-stroke dark:border-strokedark pt-4">
                        <SharedFormStep1
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            errors={errors}
                            packagingWarningItemName=""
                        />
                    </div>

                    <div className="border-t border-stroke dark:border-strokedark pt-4">
                        <PalletTable
                            title="Pallet (พาเลท)"
                            numberOfRows={4}
                            register={register}
                            fieldName="palletInfo"
                        />
                    </div>

                    <div className="border-t border-stroke dark:border-strokedark pt-4">
                        <InputProductTable
                            title="Input product"
                            register={register}
                            watch={watch}
                            fieldArray={inputProductFieldArray}
                            fieldName="inputProduct"
                        />
                    </div>

                    {/* Output Section - 2 Columns Layout */}
                    <div className="border-t border-stroke dark:border-strokedark pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <OutputProductGenmatsuA
                                    title="Output product Genmatsu A"
                                    register={register}
                                    watch={watch}
                                    fieldArray={outputGenmatsuAFieldArray}
                                    fieldName="outputGenmatsuA"
                                />
                            </div>
                            <div>
                                <OutputProductGenmatsuB
                                    title="Output product Genmatsu B"
                                    register={register}
                                    watch={watch}
                                    fieldArray={outputGenmatsuBFieldArray}
                                    fieldArrayRight={outputGenmatsuBRightFieldArray}
                                    fieldName="outputGenmatsuB"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Film & PE Bag - 2 Columns Layout */}
                    <div className="border-t border-stroke dark:border-strokedark pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <OutputFilmProduct
                                    title="Output Film product"
                                    register={register}
                                    watch={watch}
                                    fieldArray={outputFilmProductFieldArray}
                                    fieldArrayRight={outputFilmProductRightFieldArray}
                                    fieldName="outputFilmProduct"
                                />
                            </div>
                            <div>
                                <OutputPEBag
                                    title="Output PE bag"
                                    register={register}
                                    watch={watch}
                                    fieldArray={outputPEBagFieldArray}
                                    fieldName="outputPEBag"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dust Collector & Cleaning - 2 Columns Layout */}
                    <div className="border-t border-stroke dark:border-strokedark pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <OutputDustCollector
                                    title="Output from dust collector"
                                    register={register}
                                    watch={watch}
                                    fieldArray={outputDustCollectorFieldArray}
                                    fieldName="outputDustCollector"
                                />
                            </div>
                            <div>
                                <OutputCleaning
                                    title="Output from cleaning"
                                    register={register}
                                    watch={watch}
                                    fieldArray={outputCleaningFieldArray}
                                    fieldName="outputCleaning"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <Summary
                        register={register}
                        watch={watch}
                        setValue={setValue} // <--- 1. เพิ่มบรรทัดนี้ ส่ง setValue ไปให้ลูก
                    />

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
                        <button
                            type="button"
                            onClick={onDraft}
                            disabled={isSubmitting}
                            className={`rounded-md bg-primary px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'Drafted'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default Ironpowder_Form;