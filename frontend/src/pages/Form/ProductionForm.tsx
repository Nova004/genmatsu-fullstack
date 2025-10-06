// frontend/src/pages/Form/ProductionForm.tsx

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

// 1. Import ทุกอย่างที่จำเป็น
import { IManufacturingReportForm } from '../../components/formGen/pages/types';
import FormHeader from '../../components/formGen/components/FormHeader';
import PageTitle from '../../components/PageTitle';

// 2. Import Component ของฟอร์มแต่ละประเภทที่เรามี
import BZ_Form from '../../components/formGen/pages/BZ_Form/BZ_index';
import BZ3_Form from '../../components/formGen/pages/BZ3_Form/BZ3_index';

const ProductionForm: React.FC = () => {
    // 3. ย้าย useForm มาไว้ที่นี่ที่เดียว ให้เป็น "สมอง" หลัก
    const { register, watch, handleSubmit } = useForm<IManufacturingReportForm>({
        // กำหนดค่าเริ่มต้นให้ reportType เป็น 'BZ'
        defaultValues: {
            reportType: 'BZ' 
        }
    });

    // 4. ใช้ watch เพื่อ "แอบดู" ว่าตอนนี้ผู้ใช้เลือก form ประเภทไหนอยู่
    const selectedFormType = watch('reportType');

    // 5. สร้าง Array ของประเภทฟอร์มสำหรับส่งให้ FormHeader
    const reportTypes = [
        { value: 'BZ', label: 'BZ' },
        { value: 'BZ3', label: 'BZ3' },
    ];
    
    // เราจะปล่อยให้ BZ_Form และ BZ3_Form จัดการการ submit ของตัวเอง
    // ดังนั้นหน้านี้จึงไม่ต้องมีฟังก์ชัน onSubmit
    
    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

    const renderSelectedForm = () => {
        switch (selectedFormType) {
            case 'BZ':
                return <BZ_Form />;
            case 'BZ3':
                return <BZ3_Form />;
            default:
                // ในกรณีที่ยังไม่มีการเลือก หรือค่าไม่ตรงกับที่มี
                return <div className="text-center p-10">กรุณาเลือกประเภทฟอร์ม</div>;
        }
    };

    return (
        <>
            <PageTitle title="Production Form" />
            
            {/* 6. แสดง Header เสมอ */}
            <FormHeader
                title="ใบรายงานการผลิต Manufacturing"
                register={register}
                formTypes={reportTypes}
                inputClass={inputClass}
            />
            
            {/* 7. แสดงฟอร์มที่ถูกเลือก */}
            <div className="mt-6">
                {renderSelectedForm()}
            </div>
        </>
    );
};

export default ProductionForm;