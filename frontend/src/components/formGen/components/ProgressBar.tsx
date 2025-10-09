// frontend/src/components/formGen/components/ProgressBar.tsx

import React from 'react';

// 1. สร้าง Interface สำหรับกำหนด Props ที่จะรับเข้ามา
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

// 2. นำโค้ดเดิมของ ProgressBar มาวางและปรับให้เป็น Component มาตรฐาน
const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const activeClass = 'bg-primary text-white';
  const inactiveClass = 'bg-gray-2 text-black dark:bg-meta-4 dark:text-white';

  return (
    <div className="my-6 flex justify-center">
      <div className="inline-flex rounded-md shadow-sm">
        {[...Array(totalSteps)].map((_, index) => {
          const stepNumber = index + 1;
          return (
            <div
              key={stepNumber}
              className={`px-4 py-2 text-sm font-medium ${
                stepNumber === currentStep ? activeClass : inactiveClass
              } ${stepNumber === 1 ? 'rounded-l-lg' : ''} ${
                stepNumber === totalSteps ? 'rounded-r-lg' : ''
              } border border-gray-200 dark:border-strokedark`}
            >
              Step {stepNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Export Component เพื่อให้ไฟล์อื่นนำไปใช้ได้
export default ProgressBar;