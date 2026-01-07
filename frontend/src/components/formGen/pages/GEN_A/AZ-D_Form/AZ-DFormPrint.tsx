

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IManufacturingReportForm } from '../../types';
import SharedFormStep1 from '../../../components/forms/SharedFormStep1_GENA';
import FormStep2 from './FormStep2';
import SharedFormStep3 from '../../../components/forms/SharedFormStep3';
import SharedFormStep4 from '../../../components/forms/SharedFormStep4_GENA';
import ApprovalFlowDisplay from "../../../components/forms/ApprovalFlowDisplay";


interface AZ_DFormPrintProps {
  formData: IManufacturingReportForm;
  blueprints: any;
  isReadOnly: boolean;
  approvalFlowComponent?: React.ReactNode;
}

const AZ_DFormPrint: React.FC<AZ_DFormPrintProps> = ({ formData, blueprints, isReadOnly, approvalFlowComponent }) => {
  const methods = useForm<IManufacturingReportForm>({
    defaultValues: formData,
    mode: 'onChange',
    criteriaMode: "all",
  });

  useEffect(() => {
    if (formData) {
      methods.reset(formData);
    }
  }, [formData, methods]);



  const formStepProps = {
    ...methods,
    errors: methods.formState.errors,
    isReadOnly: false,
    onTemplateLoaded: () => { },
  };



  return (
    <FormProvider {...methods}>
      {/* ‼️ เพิ่มคลาส relative ‼️ */}
      <div className="a4-page-container relative rounded-sm border border-stroke bg-white flex flex-col">

        {/* --- ส่วนเนื้อหา (ลบ flex-grow ออก) --- */}
        <div>
          {/* === หน้า 1 === */}
          <div className="flex w-full flex-col border-r border-stroke">
            <div className="form-section p-1 border-b border-stroke">
              <SharedFormStep1 {...formStepProps} packagingWarningItemName="Iron Powder" />
            </div>
            <div className="form-section p-1 border-b border-stroke">
              <FormStep2 {...formStepProps} staticBlueprint={blueprints['AS2-D_Step2_RawMaterials']} />
            </div>
            {/* ‼️ ส่ง marginTop เข้าไป ‼️ */}

          </div>

          {/* === หน้า 2 === */}
          <div className="flex w-full flex-col" style={{ pageBreakBefore: 'always' }}>
            <div className="form-section p-1 border-b border-stroke">
              <SharedFormStep3 {...formStepProps} staticBlueprint={blueprints['AS2-D_Step3_Operations']} templateName="AZ-D_Step3_Operations" />
            </div>
            {/* ‼️ ส่ง marginTop เข้าไป ‼️ */}

          </div>

          {/* === หน้า 3 === */}
          <div className="flex w-full flex-col" style={{ pageBreakBefore: 'always' }} >
            <div className="form-section p-1">
              <SharedFormStep4 {...formStepProps} totalWeightFieldName="calculations.finalTotalWeight" />
            </div>
            {/* ‼️ ส่ง marginTop เข้าไป ‼️ */}

          </div>
          
          {approvalFlowComponent}

        </div>
      </div>
    </FormProvider>
  );
};

export default AZ_DFormPrint;