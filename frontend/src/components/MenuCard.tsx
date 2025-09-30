import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// กำหนด Props ที่ Component นี้จะรับเข้ามา
interface MenuCardProps {
  title: string;      // ชื่อเมนูหลัก
  description: string; // คำอธิบายสั้นๆ
  linkTo: string;     // URL ที่จะลิงก์ไป
  children: ReactNode;  // สำหรับใส่ Icon SVG
}

const MenuCard: React.FC<MenuCardProps> = ({ title, description, linkTo, children }) => {
  return (
    // ใช้ <Link> จาก react-router-dom หุ้มการ์ดทั้งหมดเพื่อให้คลิกได้
    <Link
      to={linkTo}
      className="block rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default transition-shadow duration-300 hover:shadow-lg dark:border-strokedark dark:bg-boxdark"
    >
      {/* ส่วนของไอคอน (เหมือน CardDataStats) */}
      <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        {children}
      </div>

      {/* ส่วนของข้อความ */}
      <div className="mt-4">
        <h4 className="text-title-md font-bold text-black dark:text-white">
          {title}
        </h4>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{description}</span>
      </div>
    </Link>
  );
};

export default MenuCard;