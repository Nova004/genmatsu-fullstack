import React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
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
import ApprovalFlowDisplay from '../../components/forms/ApprovalFlowDisplay';

interface PrintableReportIronpowderProps {
    submission: any;
    blueprints?: any;
}

const PrintableReportIronpowder: React.FC<PrintableReportIronpowderProps> = ({
    submission,
}) => {
    const methods = useForm({
        defaultValues: submission.form_data_json || {},
        mode: 'onChange',
    });

    const { control, register, watch, setValue, formState: { errors } } = methods;

    // Setup useFieldArray for each table to ensure components render correctly
    const inputProductFieldArray = useFieldArray({ control, name: 'inputProduct' });
    const outputGenmatsuAFieldArray = useFieldArray({ control, name: 'outputGenmatsuA' });
    const outputGenmatsuBFieldArray = useFieldArray({ control, name: 'outputGenmatsuB' });
    const outputGenmatsuBRightFieldArray = useFieldArray({ control, name: 'outputGenmatsuBRight' });
    const outputFilmProductFieldArray = useFieldArray({ control, name: 'outputFilmProduct' });
    const outputFilmProductRightFieldArray = useFieldArray({ control, name: 'outputFilmProductRight' });
    const outputPEBagFieldArray = useFieldArray({ control, name: 'outputPEBag' });
    const outputDustCollectorFieldArray = useFieldArray({ control, name: 'outputDustCollector' });
    const outputCleaningFieldArray = useFieldArray({ control, name: 'outputCleaning' });

    return (
        <FormProvider {...methods}>
            <div className="p-8 bg-white text-black text-sm"> {/* Adjust font size and padding for print */}

                {/* Custom Print Header (Simple) */}
                <div className="text-center mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold">ใบรายงานการผลิต (Ironpowder)</h1>
                    <p>Job ID: {submission.submission_id} | Lot No: {submission.lot_no}</p>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Basic Info */}
                    <section className="border border-gray-300 rounded p-4">
                        <SharedFormStep1
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            errors={errors}
                            packagingWarningItemName=""
                        />
                    </section>

                    {/* Pallet Table */}
                    <section className="border border-gray-300 rounded p-4">
                        <PalletTable
                            title="Pallet (พาเลท)"
                            numberOfRows={4}
                            register={register}
                            fieldName="palletInfo"
                        />
                    </section>

                    {/* Input Product */}
                    <section className="border border-gray-300 rounded p-4">
                        <InputProductTable
                            title="Input product"
                            register={register}
                            watch={watch}
                            fieldArray={inputProductFieldArray}
                            fieldName="inputProduct"
                        />
                    </section>

                    {/* Output Section - Grid Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-300 rounded p-4">
                            <OutputProductGenmatsuA
                                title="Output product Genmatsu A"
                                register={register}
                                watch={watch}
                                fieldArray={outputGenmatsuAFieldArray}
                                fieldName="outputGenmatsuA"
                            />
                        </div>
                        <div className="border border-gray-300 rounded p-4">
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

                    {/* Film & PE Bag - Grid Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-300 rounded p-4">
                            <OutputFilmProduct
                                title="Output Film product"
                                register={register}
                                watch={watch}
                                fieldArray={outputFilmProductFieldArray}
                                fieldArrayRight={outputFilmProductRightFieldArray}
                                fieldName="outputFilmProduct"
                            />
                        </div>
                        <div className="border border-gray-300 rounded p-4">
                            <OutputPEBag
                                title="Output PE bag"
                                register={register}
                                watch={watch}
                                fieldArray={outputPEBagFieldArray}
                                fieldName="outputPEBag"
                            />
                        </div>
                    </div>

                    {/* Dust Collector & Cleaning - Grid Layout */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-300 rounded p-4">
                            <OutputDustCollector
                                title="Output from dust collector"
                                register={register}
                                watch={watch}
                                fieldArray={outputDustCollectorFieldArray}
                                fieldName="outputDustCollector"
                            />
                        </div>
                        <div className="border border-gray-300 rounded p-4">
                            <OutputCleaning
                                title="Output from cleaning"
                                register={register}
                                watch={watch}
                                fieldArray={outputCleaningFieldArray}
                                fieldName="outputCleaning"
                            />
                        </div>
                    </div>

                    {/* Summary Section */}
                    <section className="border border-gray-300 rounded p-4">
                        <Summary register={register} watch={watch} setValue={setValue} />
                    </section>

                    {/* Approval Signature Section - Important for Reports */}
                    <div className="mt-8 break-inside-avoid">
                        <ApprovalFlowDisplay
                            submissionId={submission.submission_id}
                            submissionData={submission}
                        />
                    </div>

                </div>
            </div>
        </FormProvider>
    );
};

export default PrintableReportIronpowder;
