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
          title="ใบรายงานการผลิต (Ironpowder) - แก้ไข"
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

        <div className="flex justify-center gap-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-md bg-amber-500 px-10 py-2 font-medium text-white hover:bg-opacity-90 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>

          {(status === 'Rejected' || status === 'Drafted') && (
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
