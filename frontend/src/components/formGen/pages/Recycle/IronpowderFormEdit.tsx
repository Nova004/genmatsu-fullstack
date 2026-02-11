// location: frontend/src/components/formGen/pages/Recycle/IronpowderFormEdit.tsx

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
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
import FormHeader from '../../components/FormHeader';
import ProgressBar from '../../components/ProgressBar';
import { useFieldArray } from 'react-hook-form';
import { useMultiStepForm } from '../../../../hooks/useMultiStepForm';
import { useFormSubmitHandler } from '../../../../hooks/useFormSubmitHandler';
import RemarkField from '../../components/forms/RemarkField';

interface IronpowderFormEditProps {
  initialData: Partial<IManufacturingReportForm>;
  onSubmit: SubmitHandler<IManufacturingReportForm>;
  onResubmit: SubmitHandler<IManufacturingReportForm>;
  submissionId: number;
  status: string;
}

const IRONPOWDER_VALIDATION_SCHEMA = {
  1: {
    fields: ['basicData.date', 'basicData.machineName', 'basicData.lotNo'],
    scope: 'basicData',
    message: 'กรุณากรอกข้อมูลวันที่, เครื่อง, และ Lot No. ให้ครบถ้วน',
  },
};

const IronpowderFormEdit: React.FC<IronpowderFormEditProps> = ({
  initialData,
  onSubmit,
  onResubmit,
  submissionId,
  status,
}) => {
  const totalSteps = 1;
  const availableForms = [
    { value: 'Ironpowder', label: 'Ironpowder', path: '/forms/ironpowder-form' },
  ];

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<IManufacturingReportForm>({
    defaultValues: initialData,
    mode: 'onChange',
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

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

  // Initialize fields with 4 default rows for each dynamic table
  useEffect(() => {
    const initializeFieldArray = (fieldArray: any) => {
      if (fieldArray.fields.length === 0) {
        for (let i = 0; i < 4; i++) {
          fieldArray.append({});
        }
      }
    };

    initializeFieldArray(inputProductFieldArray);
    initializeFieldArray(outputGenmatsuAFieldArray);
    initializeFieldArray(outputGenmatsuBFieldArray);
    initializeFieldArray(outputGenmatsuBRightFieldArray);
    initializeFieldArray(outputFilmProductFieldArray);
    initializeFieldArray(outputFilmProductRightFieldArray);
    initializeFieldArray(outputPEBagFieldArray);
    initializeFieldArray(outputDustCollectorFieldArray);
    initializeFieldArray(outputCleaningFieldArray);
  }, []);

  const { step } = useMultiStepForm({
    totalSteps: 1,
    trigger,
    errors,
    validationSchema: IRONPOWDER_VALIDATION_SCHEMA as any,
  });

  const inputClass =
    'w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

  // --- ใช้ Custom Hook สำหรับจัดการ Submit ---
  // Wrap onSubmit to include submissionId as expected by Ironpowder logic
  const { isSubmitting, handleFormSubmit } = useFormSubmitHandler({
    onSubmit: async (data: IManufacturingReportForm) => {
      const formattedData = {
        ...data,
        submissionId,
      };
      await onSubmit(formattedData);
    }
  });

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-md dark:border-strokedark dark:bg-boxdark md:p-8">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormHeader
          title="ใบรายงานการผลิต (Ironpowder)"
          formTypes={availableForms}
          currentValue="Ironpowder"
          inputClass={inputClass}
        />

        <ProgressBar currentStep={step} totalSteps={totalSteps} />

        <div className="border-t border-stroke dark:border-strokedark pt-6">
          <SharedFormStep1
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            packagingWarningItemName=""
          />
        </div>

        <div className="border-t border-stroke dark:border-strokedark pt-6">
          <PalletTable
            title="Pallet (พาเลท)"
            numberOfRows={4}
            register={register}
            fieldName="palletInfo"
          />
        </div>

        <div className="border-t border-stroke dark:border-strokedark pt-6">
          <InputProductTable
            title="Input product"
            register={register}
            watch={watch}
            fieldArray={inputProductFieldArray}
            fieldName="inputProduct"
          />
        </div>

        {/* Output Section - 2 Columns Layout */}
        <div className="border-t border-stroke dark:border-strokedark pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div className="border-t border-stroke dark:border-strokedark pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div className="border-t border-stroke dark:border-strokedark pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <Summary register={register} watch={watch} setValue={setValue} />
        <div className="rounded-md border border-warning bg-warning bg-opacity-10 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-warning mb-1">ข้อควรปฏิบัติ</h4>
              <ul className="list-disc pl-5 text-sm text-black dark:text-white space-y-1">
                <li>Tag ที่ติดมากับถุง Product ของกรงสุดท้ายที่ Recycle แล้วให้ดึงออกเก็บไว้เพื่อระบุหมายเลขถุงตอนลงข้อมูล (เก็บเฉพาะถุงที่นำไปคัดแยกแล้วเท่านั้น)</li>
                <li>ในกรณีที่ Tag บ่งชี้ชนิดของ Product ไม่ชัดเจนให้แยกเอาไว้ก่อน <span className="text-meta-1 font-medium">ห้ามนำไปคัดแยกเด็ดขาด</span></li>
              </ul>
            </div>
          </div>
        </div>
        <RemarkField
          register={register}
          name="remark"
          error={errors.remark}
          required={true}
          defaultValue="งานออกมีน้ำหนักเกินงานเข้าเนื่องจากฟีล์มมีน้ำขังและมีความชื้น"
        />

        <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-md bg-amber-500 px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>

          {(status === 'Rejected' || status === 'Draft') && (
            <button
              type="button"
              onClick={handleSubmit(onResubmit)} // ใช้ฟังก์ชันส่งอนุมัติ
              disabled={isSubmitting}
              className={`rounded-md px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                } ${
                // เปลี่ยนสีปุ่มตามสถานะได้ด้วยเพื่อความชัดเจน
                status === 'Rejected'
                  ? 'bg-indigo-600' // สีม่วง (Resubmit)
                  : 'bg-green-600'  // สีเขียว (Submit ครั้งแรก)
                }`}
            >
              {isSubmitting
                ? 'กำลังบันทึก...'
                : status === 'Rejected'
                  ? 'บันทึก และ ส่งอนุมัติใหม่ (Resubmit)'
                  : 'บันทึก และ ส่งอนุมัติ (Submit)'
              }
            </button>
          )}

        </div>
      </form>
    </div>
  );
};

export default IronpowderFormEdit;
