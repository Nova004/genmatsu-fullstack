import React from 'react';
import MenuCard from '../../components/MenuCard';
import { FaFileAlt, FaChartLine, FaCogs } from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";

const ECommerce: React.FC = () => {
  const { user } = useAuth();
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">

        {/* --- Card 1: GEN-A (เอกสารการผลิต - ใช้ Icon เดิม) --- */}
        <MenuCard
          title="เอกสารการผลิต GEN-A"
          description="เข้าสู่หน้าบันทึกฟอร์ม GEN-A"
          linkTo="/reports/history/gen-a"
        >
          {/* สี Primary (มักเป็นสีน้ำเงิน) สื่อถึงเอกสารหลัก */}
          <FaFileAlt size={22} className="text-blue-600 dark:text-blue-400" />
        </MenuCard>

        {/* --- Card 2: GEN-B (เอกสารการผลิต - ใช้ Icon เดิม) --- */}
        <MenuCard
          title="เอกสารการผลิต GEN-B"
          description="เข้าสู่หน้าบันทึกฟอร์ม GEN-B"
          linkTo="/reports/history/gen-b"
        >
          {/* สี Success (มักเป็นสีเขียว) แยกความต่างจาก A ด้วยสี */}
          <FaFileAlt size={22} className="text-green-600 dark:text-green-400" />
        </MenuCard>

        {/* --- Card 3: Report (เปลี่ยน Icon และสีให้ดูเป็น Data/Dashboard) --- */}
        <MenuCard
          title="Report Production Amount"
          description="เข้าสู่หน้า Data Production Amount"
          linkTo="/reports/daily-production"
        >
          {/* ใช้ Icon กราฟ และสีม่วง (Indigo/Purple) เพื่อให้ดูเป็น Analytics */}
          <FaChartLine size={22} className="text-indigo-600 dark:text-indigo-400" />
        </MenuCard>

        {/* --- Card 4: Admin (เปลี่ยน Icon และสีให้ดูเป็น System/Control) --- */}
        {((user?.LV_Approvals ?? 0) >= 2) && (
          <MenuCard
            title="Master (Admin)"
            description="จัดการข้อมูลหลังบ้านสำหรับแอดมิน"
            linkTo="/master/Dashbord_Master"
          >
            {/* ใช้ Icon UserCog หรือ Cogs และสีส้ม/แดง (Warning/Rose) เพื่อสื่อถึงส่วน Admin */}
            <FaCogs size={22} className="text-rose-500 dark:text-rose-400" />
          </MenuCard>
        )}

      </div>
    </>
  );
};

export default ECommerce;
