import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// กำหนด Props ใหม่ (ทำให้ description เป็น optional)
interface ButtonLinkProps {
  title: string;
  linkTo: string;
  children: ReactNode; // สำหรับไอคอน
  description?: string; // Optional: ไม่จำเป็นต้องใส่
}

const ButtonLink: React.FC<ButtonLinkProps> = ({ title, linkTo, children }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(linkTo);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      // เปลี่ยน className เป็นสไตล์ของปุ่มแทน
      className="inline-flex items-center gap-2 rounded-md bg-primary py-2 px-4 font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {/* 1. แสดงไอคอนโดยตรง */}
      {children}
      
      {/* 2. แสดงแค่ title */}
      <span>{title}</span>
    </button>
  );
};

export default ButtonLink;