// src/components/Tooltip.tsx
import React, { ReactNode } from 'react';

interface TooltipProps {
  message: string;
  children: ReactNode;
}

export const Tooltip = ({ message, children }: TooltipProps) => {
  return (
    <div className="group/tooltip relative flex items-center justify-center">
      {/* ตัวเนื้อหาหลัก (ปุ่ม) */}
      {children}

      {/* ส่วน Tooltip */}
      <div className="
        pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 
        w-max -translate-x-1/2 origin-bottom scale-95 opacity-0 
        transition-all duration-200 ease-out 
        group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-1
      ">
        <div className="relative rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg ring-1 ring-white/10">
          {message}

          {/* หางลูกศร (Arrow) - ทำให้เนียนไปกับกล่อง */}
          <div className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-gray-900"></div>
        </div>
      </div>
    </div>
  );
};