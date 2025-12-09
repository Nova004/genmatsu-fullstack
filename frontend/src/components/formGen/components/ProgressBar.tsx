// frontend/src/components/formGen/components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void; // 👈 เพิ่ม Callback function สำหรับการคลิก (ใส่ ? เผื่อบางหน้าไม่อยากให้กด)
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, onStepClick }) => {
  
  return (
    <div className="my-6 flex justify-center">
      <div className="inline-flex rounded-md shadow-sm">
        {[...Array(totalSteps)].map((_, index) => {
          const stepNumber = index + 1;
          
          // --- Logic กำหนดสถานะ ---
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          // --- Logic การคลิก ---
          // ให้คลิกได้เฉพาะ Step ที่ผ่านมาแล้ว (Completed) และต้องมีการส่งฟังก์ชัน onStepClick มาให้
          const isClickable = isCompleted && onStepClick;

          const handleClick = () => {
            if (isClickable) {
              onStepClick(stepNumber);
            }
          };

          // --- Logic เลือกสี Class (Tailwind) ---
          let stepClass = '';
          
          if (isActive) {
            // สีฟ้า (Active)
            stepClass = 'bg-primary text-white border-primary cursor-default';
          } else if (isCompleted) {
            // สีเขียว (Completed) + เมาส์เป็นรูปมือ (Pointer) + Hover effect
            stepClass = 'bg-success text-white border-success cursor-pointer hover:bg-opacity-90 hover:shadow-md';
          } else {
            // สีเทา (Inactive) + ห้ามกด
            stepClass = 'bg-gray-2 text-black dark:bg-meta-4 dark:text-white border-gray-200 cursor-not-allowed';
          }

          return (
            <div
              key={stepNumber}
              onClick={handleClick}
              className={`
                px-4 py-2 text-sm font-medium border transition-all duration-300 ease-in-out
                ${stepClass}
                ${stepNumber === 1 ? 'rounded-l-lg' : ''} 
                ${stepNumber === totalSteps ? 'rounded-r-lg' : ''}
              `}
            >
              Step {stepNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;