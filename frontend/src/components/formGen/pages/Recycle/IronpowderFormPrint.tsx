// location: frontend/src/components/formGen/pages/Recycle/IronpowderFormPrint.tsx

import React from 'react';
import { IManufacturingReportForm } from '../types';
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
import RemarkField from '../../components/forms/RemarkField';

import { useForm, FormProvider } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';

interface IronpowderFormPrintProps {
  formData: IManufacturingReportForm;
  blueprints?: any; // Add blueprints
  isReadOnly?: boolean; // Add isReadOnly
  approvalFlowComponent?: React.ReactNode; // Add approvalFlowComponent
}

const IronpowderFormPrint: React.FC<IronpowderFormPrintProps> = ({
  formData,
  isReadOnly = false,
  approvalFlowComponent // Destructure approvalFlowComponent
}) => {


  const methods = useForm<IManufacturingReportForm>({
    defaultValues: formData,
    mode: 'onChange',
  });

  const {
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = methods;

  // Setup useFieldArray for each table
  const inputProductFieldArray = useFieldArray({
    control,
    name: 'inputProduct',
    shouldUnregister: true,
  });

  const outputGenmatsuAFieldArray = useFieldArray({
    control,
    name: 'outputGenmatsuA',
    shouldUnregister: true,
  });

  const outputGenmatsuBFieldArray = useFieldArray({
    control,
    name: 'outputGenmatsuB',
    shouldUnregister: true,
  });

  const outputGenmatsuBRightFieldArray = useFieldArray({
    control,
    name: 'outputGenmatsuBRight',
    shouldUnregister: true,
  });

  const outputFilmProductFieldArray = useFieldArray({
    control,
    name: 'outputFilmProduct',
    shouldUnregister: true,
  });

  const outputFilmProductRightFieldArray = useFieldArray({
    control,
    name: 'outputFilmProductRight',
    shouldUnregister: true,
  });

  const outputPEBagFieldArray = useFieldArray({
    control,
    name: 'outputPEBag',
    shouldUnregister: true,
  });

  const outputDustCollectorFieldArray = useFieldArray({
    control,
    name: 'outputDustCollector',
    shouldUnregister: true,
  });

  const outputCleaningFieldArray = useFieldArray({
    control,
    name: 'outputCleaning',
    shouldUnregister: true,
  });

  // 🟡 Remove Dark Mode Classes for Print


  return (
    <FormProvider {...methods}>
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-md md:p-8 print:shadow-none print:border-0 text-black">
        <style>{`
          @media print {
            body { 
              margin: 0; padding: 0; 
              background-color: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            * { visibility: visible !important; }
            
            /* Force table borders to be visible but not too harsh */
            table, th, td, tr {
              border-color: #555 !important;
              border-width: 1px !important;
            }
            .border-stroke {
              border-color: #555 !important;
            }
            /* Remove shadows and ensuring distinct borders */
            div {
              box-shadow: none !important;
            }
            input, textarea {
              color: black !important;
            }
            .text-primary {
              color: #3C50E0 !important;
              -webkit-text-fill-color: #3C50e0 !important;
            }
          }
          /* Override dark mode manually to ensure black text on white paper */
          .dark .text-white { color: black !important; }
        `}</style>

        <div className="space-y-6">
          <div className="border-t border-stroke pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <SharedFormStep1
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  errors={{}}
                  packagingWarningItemName=""
                // isReadOnly={isReadOnly} <SharedFormStep1 does not support isReadOnly>
                />
              </div>
              <div>
                <PalletTable
                  title="Pallet (พาเลท)"
                  numberOfRows={4}
                  register={register}
                  fieldName="palletInfo"
                />
                <div className="mt-6">
                  <InputProductTable
                    title="Input product"
                    register={register}
                    watch={watch}
                    fieldArray={inputProductFieldArray}
                    fieldName="inputProduct"
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Combined Output Section - 3 Columns Layout */}
          <div className="border-t border-stroke pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <OutputProductGenmatsuA
                  title="Output product Genmatsu A"
                  register={register}
                  watch={watch}
                  fieldArray={outputGenmatsuAFieldArray}
                  fieldName="outputGenmatsuA"
                  isReadOnly={isReadOnly}
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
                  isReadOnly={isReadOnly}
                />
              </div>
              <div>
                <OutputFilmProduct
                  title="Output Film product"
                  register={register}
                  watch={watch}
                  fieldArray={outputFilmProductFieldArray}
                  fieldArrayRight={outputFilmProductRightFieldArray}
                  fieldName="outputFilmProduct"
                  isReadOnly={isReadOnly}
                />
              </div>
              <div>
                <OutputPEBag
                  title="Output PE bag"
                  register={register}
                  watch={watch}
                  fieldArray={outputPEBagFieldArray}
                  fieldName="outputPEBag"
                  isReadOnly={isReadOnly}
                />
              </div>
              <div>
                <OutputDustCollector
                  title="Output from dust collector"
                  register={register}
                  watch={watch}
                  fieldArray={outputDustCollectorFieldArray}
                  fieldName="outputDustCollector"
                  isReadOnly={isReadOnly}
                />
              </div>
              <div>
                <OutputCleaning
                  title="Output from cleaning"
                  register={register}
                  watch={watch}
                  fieldArray={outputCleaningFieldArray}
                  fieldName="outputCleaning"
                  isReadOnly={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Summary & Approval Flow - Side by Side */}
          <div className="border-t border-stroke pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div>
                <Summary register={register} watch={watch} setValue={setValue} />
                <div className="border border-black p-4 mb-4 mt-6 text-xs">
                  <h4 className="font-bold mb-2">ข้อควรปฏิบัติ</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Tag ที่ติดมากับถุง Product ของกรงสุดท้ายที่ Recycle แล้วให้ดึงออกเก็บไว้เพื่อระบุหมายเลขถุงตอนลงข้อมูล (เก็บเฉพาะถุงที่นำไปคัดแยกแล้วเท่านั้น)</li>
                    <li>ในกรณีที่ Tag บ่งชี้ชนิดของ Product ไม่ชัดเจนให้แยกเอาไว้ก่อน <span className="font-bold">ห้ามนำไปคัดแยกเด็ดขาด</span></li>
                  </ul>
                </div>

                <RemarkField
                  register={register}
                  name="remark"
                  error={errors.remark}
                  required={true}
                  disabled={isReadOnly}
                />
              </div>

              {/* 🟡 3. Render Approval Flow - Right Column */}
              <div>
                {approvalFlowComponent && (
                  <div className="break-inside-avoid">
                    {approvalFlowComponent}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </FormProvider>
  );
};

export default IronpowderFormPrint;
