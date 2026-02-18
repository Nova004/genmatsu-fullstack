// frontend/src/components/formGen/components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  labels?: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, onStepClick, labels }) => {

  // Default Labels based on User Request
  const stepLabels = labels || Array.from({ length: totalSteps }, (_, i) =>
    i === 0 ? "Basic Data" : i === 1 ? "Quantity of used raw material" : i === 2 ? "Operation result" : `Packing Result`
  );

  return (
    <div className="w-full py-6">
      <div className="flex w-full rounded-lg bg-white border border-gray-200 dark:bg-boxdark dark:border-strokedark shadow-sm overflow-hidden">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = stepNumber === totalSteps;
          const isClickable = isCompleted && onStepClick;

          // Colors
          let textClass = "text-gray-500 dark:text-gray-400";
          let circleBg = "bg-white border-2 border-gray-200 text-gray-400 dark:bg-boxdark dark:border-strokedark dark:text-gray-500";

          if (isActive) {
            textClass = "text-primary font-bold";
            circleBg = "bg-white border-2 border-primary text-primary shadow-sm";
          } else if (isCompleted) {
            textClass = "text-primary font-medium";
            circleBg = "bg-primary border-2 border-primary text-white";
          }

          // Z-Index: Early steps must be on top of later steps for the arrow overlap to work correctly
          // We also need padding-left on later items to account for the arrow of previous item?
          // Actually, if we use overflow-visible on items, the arrow will just float over the next item.
          // The next item starts where the previous item ends (logically), but visually the arrow extends.
          // So we need padding-left on subsequent items?
          // No, the previous item's arrow covers the left side of the current item.
          // So the text content needs to be shifted right?
          // Let's rely on standard padding, maybe slightly increase left padding for items > 0.

          return (
            <div
              key={stepNumber}
              onClick={() => isClickable && onStepClick && onStepClick(stepNumber)}
              style={{ zIndex: totalSteps - index }}
              className={`
                relative flex-1 flex items-center justify-center py-4 px-6
                ${index > 0 ? 'pl-10' : ''}
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                bg-white dark:bg-boxdark
                transition-colors duration-300
              `}
            >
              {/* Chevron Arrow (Right Side) */}
              {!isLast && (
                <div
                  className="absolute top-0 bottom-0 -right-[1.4rem] w-[2.8rem] overflow-hidden pointer-events-none"
                >
                  <div
                    className={`
                            absolute top-1/2 -translate-y-1/2 left-[-1.5rem]
                            w-[3rem] h-[3rem]
                            bg-white dark:bg-boxdark
                            border-t border-r border-gray-200 dark:border-strokedark
                            transform rotate-45 shadow-sm
                            transition-colors duration-300
                        `}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex items-center space-x-3 relative z-10">
                {/* Circle Indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${circleBg}`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  ) : (
                    stepNumber.toString().padStart(2, '0')
                  )}
                </div>

                {/* Label */}
                <span className={`text-sm whitespace-nowrap ${textClass}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;