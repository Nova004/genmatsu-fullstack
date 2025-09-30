import React from 'react';
import MenuCard from '../../components/MenuCard'; 
import { FaFileAlt, FaCogs } from 'react-icons/fa'; 


const ECommerce: React.FC = () => {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <MenuCard 
          title="ใบเมนู GEN-A" 
          description="เข้าสู่หน้าบันทึกฟอร์ม GEN-A" 
          linkTo="/reports/history" 
        >
          <FaFileAlt size={22} className="text-primary" />
        </MenuCard>

        <MenuCard 
          title="ใบเมนู GEN-B" 
          description="เข้าสู่หน้าบันทึกฟอร์ม GEN-B" 
          linkTo="/forms/production-bz" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaFileAlt size={22} className="text-success" />
        </MenuCard>

        <MenuCard 
          title="Master (Admin)" 
          description="จัดการข้อมูลหลังบ้านสำหรับแอดมิน" 
          linkTo="/master/form-editor" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaCogs size={22} className="text-warning" />
        </MenuCard>
      </div>
    </>
  );
};

export default ECommerce;
