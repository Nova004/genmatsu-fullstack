import React from 'react';
import MenuCard from '../../components/MenuCard';
import { FaRegUser, FaHome, FaWpforms, FaEyeDropper, FaList , FaRegChartBar } from 'react-icons/fa';
import ButtonLink from '../../components/button/button_back';
import { useLevelGuard } from '../../hooks/useLevelGuard';


const ECommerce: React.FC = () => {
  useLevelGuard(2);
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <MenuCard
          title="Master Users"
          description="จัดการข้อมูล ผู้ใช้งาน"
          linkTo="/master/user-master" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaRegUser size={22} className="text-success" />
        </MenuCard>

        <MenuCard
          title="NaCl Master"
          description="จัดการข้อมูล NaCl Master"
          linkTo="/master/nacl-master" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaEyeDropper size={22} className="text-primary" />
        </MenuCard>

        <MenuCard
          title="Form Master Editor"
          description="จัดการข้อมูลเเบบฟอร์ม"
          linkTo="/master/form-editor" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaWpforms size={22} className="text-secondary" />
        </MenuCard>

        <MenuCard
          title="Standard Plan Master"
          description="จัดการข้อมูล Standard Plan Master"
          linkTo="/master/standard-plan-master" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaRegChartBar size={22} className="text-rose-500 dark:text-rose-400" />
        </MenuCard>

        <MenuCard
          title="ActivityLog"
          description="จัดการข้อมูล ActivityLog"
          linkTo="/master/activity-logs" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaList size={22} className="text-amber-500 dark:text-rose-400" />
        </MenuCard>


      </div>

      <div className="mt-4 flex justify-end">
        <ButtonLink title="ย้อนกลับ" linkTo="/">
          <FaHome size={22} className="" />
        </ButtonLink>

      </div>
    </>
  );
};

export default ECommerce;
