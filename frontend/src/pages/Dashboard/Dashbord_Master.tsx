import React from 'react';
import MenuCard from '../../components/MenuCard';
import { FaRegUser, FaCogs, FaHome, FaWpforms, FaEyeDropper } from 'react-icons/fa';
import ButtonLink from '../../components/button/button_back';
import { useLevelGuard } from '../../hooks/useLevelGuard';

const ECommerce: React.FC = () => {
  useLevelGuard(3);
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <MenuCard
          title="Master User"
          description="จัดการข้อมูลหลังบ้านสำหรับแอดมิน"
          linkTo="/master/user-master" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaRegUser size={22} className="text-success" />
        </MenuCard>

        <MenuCard
          title="NaCl Master"
          description="จัดการข้อมูลหลังบ้านสำหรับแอดมิน"
          linkTo="/master/nacl-master" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaEyeDropper size={22} className="text-primary" />
        </MenuCard>

        <MenuCard
          title="Form Master Editor"
          description="จัดการข้อมูลหลังบ้านสำหรับแอดมิน"
          linkTo="/master/form-editor" // <-- **แก้ URL ปลายทางได้ตามต้องการ**
        >
          <FaWpforms size={22} className="text-secondary" />
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
